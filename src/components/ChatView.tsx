import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Sparkles, FileText, CheckSquare, Key, Link2, Code, Menu, Plus, PanelLeftOpen, PanelLeftClose, Eye, EyeOff, ChevronLeft, ChevronRight, File, Sun, Moon } from 'lucide-react';
import { 
  Message, MessageType, getMessages, addMessage, deleteMessage, TaskItem, LinkItem, CredentialData, CodeData, FileData,
  Conversation, ConversationColor, getConversations, getArchivedConversations, createConversation, 
  archiveConversation, unarchiveConversation, deleteConversation, updateConversation,
  pinConversation, unpinConversation, setConversationColor, setConversationLabel,
  searchAllMessages
} from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { generateLinkTitle, explainCode } from '@/lib/gemini';
import { useAuth } from '@/contexts/AuthContext';

// Simple language detection for code
const detectCodeLanguage = (code: string): string => {
  const patterns: { pattern: RegExp; lang: string }[] = [
    { pattern: /^<(!DOCTYPE|html|div|span|p|a|img)/im, lang: 'html' },
    { pattern: /(function|const|let|var|=>|import|export)\s/m, lang: 'javascript' },
    { pattern: /^(def |class |import |from |print\()/m, lang: 'python' },
    { pattern: /^(public|private|class|void|int|String)\s/m, lang: 'java' },
    { pattern: /^(<?php|echo|function\s+\w+\()/m, lang: 'php' },
    { pattern: /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\s/im, lang: 'sql' },
    { pattern: /^(\{|\[)[\s\S]*(\}|\])$/m, lang: 'json' },
    { pattern: /^(\.|#|@media|@keyframes)\w+\s*\{/m, lang: 'css' },
    { pattern: /^#!/m, lang: 'bash' },
  ];
  
  for (const { pattern, lang } of patterns) {
    if (pattern.test(code)) return lang;
  }
  return 'text';
};
import MessageCard from './MessageCard';
import MessageInput from './MessageInput';
import SearchBar from './SearchBar';
import ConversationSidebar from './ConversationSidebar';
import ContextMenu from './ContextMenu';
import SettingsDialog from './SettingsDialog';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUI } from '@/contexts/UIContext';

const MESSAGES_PER_PAGE = 15;

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => {
    // Load from localStorage on initial render
    return localStorage.getItem('activeConversationId');
  });
  const [showArchived, setShowArchived] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<MessageType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(MESSAGES_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const { t, isRTL } = useLanguage();
  const { sidebarOpen, setSidebarOpen, toggleSidebar, headerVisible, toggleHeader, theme, toggleTheme } = useUI();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages();
    }
  }, [currentConversationId]);

  const handleScroll = useCallback(() => {
    if (!mainRef.current || loadingMore) return;
    
    const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    if (scrollPercentage > 0.8) {
      setLoadingMore(true);
      setTimeout(() => {
        setDisplayCount(prev => prev + MESSAGES_PER_PAGE);
        setLoadingMore(false);
      }, 300);
    }
  }, [loadingMore]);

  useEffect(() => {
    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      return () => mainElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Keyboard navigation for conversations (ArrowLeft/ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const convs = showArchived ? archivedConversations : conversations;
      const currentIndex = convs.findIndex(c => c.id === currentConversationId);
      
      if (e.key === 'ArrowLeft') {
        // Go to next conversation
        if (currentIndex >= 0 && currentIndex < convs.length - 1) {
          const nextId = convs[currentIndex + 1].id!;
          setCurrentConversationId(nextId);
          localStorage.setItem('activeConversationId', nextId);
          toast({ title: convs[currentIndex + 1].title });
        }
      } else if (e.key === 'ArrowRight') {
        // Go to previous conversation
        if (currentIndex > 0) {
          const prevId = convs[currentIndex - 1].id!;
          setCurrentConversationId(prevId);
          localStorage.setItem('activeConversationId', prevId);
          toast({ title: convs[currentIndex - 1].title });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [conversations, archivedConversations, currentConversationId, showArchived]);

  const loadConversations = async () => {
    try {
      const [convs, archived] = await Promise.all([
        getConversations(),
        getArchivedConversations()
      ]);
      setConversations(convs);
      setArchivedConversations(archived);
      
      // Check if saved conversation exists
      const savedId = localStorage.getItem('activeConversationId');
      const allConvs = [...convs, ...archived];
      const savedConvExists = savedId && allConvs.some(c => c.id === savedId);
      
      if (savedConvExists) {
        setCurrentConversationId(savedId);
      } else if (convs.length > 0 && !currentConversationId) {
        const newId = convs[0].id!;
        setCurrentConversationId(newId);
        localStorage.setItem('activeConversationId', newId);
      } else if (convs.length === 0 && archived.length === 0) {
        handleCreateConversation();
      }
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!currentConversationId) return;
    try {
      const data = await getMessages(currentConversationId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const docRef = await createConversation();
      await loadConversations();
      setCurrentConversationId(docRef.id);
      localStorage.setItem('activeConversationId', docRef.id);
      setShowArchived(false);
      setSidebarOpen(false);
      toast({ title: t('newConversation') });
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const handleArchiveConversation = async (id: string) => {
    try {
      await archiveConversation(id);
      await loadConversations();
      if (currentConversationId === id) {
        const remaining = conversations.filter(c => c.id !== id);
        const newId = remaining.length > 0 ? remaining[0].id! : null;
        setCurrentConversationId(newId);
        if (newId) localStorage.setItem('activeConversationId', newId);
        else localStorage.removeItem('activeConversationId');
      }
      toast({ title: t('archived') });
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const handleUnarchiveConversation = async (id: string) => {
    try {
      await unarchiveConversation(id);
      await loadConversations();
      toast({ title: t('unarchive') });
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      await loadConversations();
      if (currentConversationId === id) {
        const allConvs = [...conversations, ...archivedConversations].filter(c => c.id !== id);
        setCurrentConversationId(allConvs.length > 0 ? allConvs[0].id! : null);
      }
      toast({ title: t('deletedSuccess') });
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const handleRenameConversation = async (id: string, title: string) => {
    try {
      await updateConversation(id, { title });
      await loadConversations();
      toast({ title: t('nameUpdated') });
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const handlePinConversation = async (id: string) => {
    try {
      await pinConversation(id);
      await loadConversations();
      toast({ title: t('pin') });
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const handleUnpinConversation = async (id: string) => {
    try {
      await unpinConversation(id);
      await loadConversations();
      toast({ title: t('unpin') });
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const handleSetColor = async (id: string, color: ConversationColor) => {
    try {
      await setConversationColor(id, color);
      await loadConversations();
      toast({ title: t('setColor') });
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const handleSetLabel = async (id: string, label: string) => {
    try {
      await setConversationLabel(id, label);
      await loadConversations();
      toast({ title: t('setLabel') });
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const parseContent = async (type: MessageType, content: string): Promise<Partial<Message>> => {
    switch (type) {
      case 'note':
        return { type: 'note', content };

      case 'tasks':
        const tasks: TaskItem[] = content
          .split('\n')
          .filter(line => line.trim())
          .map(line => ({ text: line.trim(), completed: false }));
        return { type: 'tasks', tasks };

      case 'links':
        const lines = content.split('\n').filter(line => line.trim());
        const links: LinkItem[] = await Promise.all(
          lines.map(async (line) => {
            const parts = line.split('|');
            if (parts.length === 2 && parts[0].trim()) {
              return { title: parts[0].trim(), url: parts[1].trim() };
            }
            const url = line.trim();
            const title = await generateLinkTitle(url);
            return { title, url };
          })
        );
        return { type: 'links', links };

      case 'credentials':
        // Parse credentials without AI - simple format parsing
        const lines2 = content.split('\n').filter(l => l.trim());
        let username = '', password = '', host = '', url = '', port = '', credType: CredentialData['credType'] = 'other';
        
        for (const line of lines2) {
          const lower = line.toLowerCase();
          if (lower.includes('user') || lower.includes('username') || lower.includes('اسم')) {
            username = line.replace(/^[^:]+:\s*/i, '').trim();
          } else if (lower.includes('pass') || lower.includes('password') || lower.includes('كلمة')) {
            password = line.replace(/^[^:]+:\s*/i, '').trim();
          } else if (lower.includes('host') || lower.includes('server') || lower.includes('سيرفر') || lower.includes('ftp.')) {
            host = line.replace(/^[^:]+:\s*/i, '').trim();
          } else if (lower.includes('url') || lower.includes('link') || lower.includes('رابط') || lower.includes('http')) {
            url = line.replace(/^[^:]+:\s*/i, '').trim();
            // If it's just a URL without a label
            if (lower.startsWith('http')) {
              url = line.trim();
            }
          } else if (lower.includes('port') || lower.includes('منفذ') || lower.includes('بورت')) {
            port = line.replace(/^[^:]+:\s*/i, '').trim();
          } else if (lower.includes('type') || lower.includes('نوع')) {
            const typeValue = line.replace(/^[^:]+:\s*/i, '').trim().toLowerCase();
            if (typeValue.includes('ftp')) credType = 'ftp';
            else if (typeValue.includes('ssh')) credType = 'ssh';
            else if (typeValue.includes('cpanel')) credType = 'cpanel';
            else if (typeValue.includes('hosting')) credType = 'hosting';
            else if (typeValue.includes('admin')) credType = 'admin';
            else if (typeValue.includes('database')) credType = 'database';
          }
          
          // Detect type from line content
          if (lower.includes('ftp') && !host) credType = 'ftp';
          else if (lower.includes('ssh') && !host) credType = 'ssh';
          else if (lower.includes('cpanel') && !host) credType = 'cpanel';
          else if (lower.includes('hosting') && !host) credType = 'hosting';
          else if (lower.includes('admin') && !host) credType = 'admin';
          else if (lower.includes('database') && !host) credType = 'database';
        }
        
        // Fallback: simple user:pass@host format
        if (!username && !password) {
          const match = content.match(/^([^:\n]+)[:\s]+([^@\n]+)(?:@(.+))?$/);
          if (match) {
            username = match[1].trim();
            password = match[2].trim();
            host = match[3]?.trim() || '';
          } else {
            // Just use lines as user/pass/host/url/port
            username = lines2[0] || '';
            password = lines2[1] || '';
            host = lines2[2] || '';
            url = lines2[3] || '';
            port = lines2[4] || '';
          }
        }
        
        return { 
          type: 'credentials', 
          credential: { username, password, host, url, port, credType } 
        };

      case 'code':
        // Use AI to explain code and add tags
        const codeResult = await explainCode(content);
        const codeData: CodeData = {
          code: content,
          language: codeResult.language || detectCodeLanguage(content),
          explanation: codeResult.explanation,
          tags: codeResult.tags
        };
        return { type: 'code', codeData };

      default:
        return { type: 'note', content };
    }
  };

  const handleSend = async (type: MessageType, content: string, file?: { name: string; type: string; size: number; content: string }, images?: string[]) => {
    if (!currentConversationId || !user) {
      toast({ title: t('error'), variant: 'destructive' });
      return;
    }
    
    setSending(true);
    try {
      if (type === 'file' && file) {
        const fileData: FileData = {
          name: file.name,
          type: file.type,
          size: file.size,
          content: file.content
        };
        await addMessage(user.uid, { 
          type: 'file',
          fileData,
          conversationId: currentConversationId 
        });
      } else {
        const messageData = await parseContent(type, content);
        // Add images if it's a note
        if (type === 'note' && images && images.length > 0) {
          (messageData as Partial<Message>).images = images;
        }
        await addMessage(user.uid, { 
          ...messageData, 
          conversationId: currentConversationId 
        } as Omit<Message, 'id' | 'createdAt' | 'userId'>);
      }
      await loadMessages();
      await loadConversations();
      toast({ title: t('addedSuccess') });
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMessage(id);
      await loadMessages();
      toast({ title: t('deletedSuccess') });
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter !== 'all' && m.type !== filter) return false;
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    
    if (m.type === 'note' && m.content?.toLowerCase().includes(query)) return true;
    if (m.type === 'tasks' && m.tasks?.some(t => t.text.toLowerCase().includes(query))) return true;
    if (m.type === 'credentials') {
      const cred = m.credential;
      if (cred?.username.toLowerCase().includes(query)) return true;
      if (cred?.host?.toLowerCase().includes(query)) return true;
    }
    if (m.type === 'links' && m.links?.some(l => 
      l.title.toLowerCase().includes(query) || l.url.toLowerCase().includes(query)
    )) return true;
    if (m.type === 'code') {
      const codeData = m.codeData;
      if (codeData?.code?.toLowerCase().includes(query)) return true;
      if (codeData?.explanation?.toLowerCase().includes(query)) return true;
      if (codeData?.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
    }
    if (m.type === 'file') {
      const fileData = m.fileData;
      if (fileData?.name?.toLowerCase().includes(query)) return true;
      if (fileData?.content?.toLowerCase().includes(query)) return true;
    }
    
    return false;
  });

  const displayedMessages = filteredMessages.slice(0, displayCount);
  const hasMore = displayCount < filteredMessages.length;

  const currentConversation = [...conversations, ...archivedConversations].find(
    c => c.id === currentConversationId
  );

  const filterButtons = [
    { type: 'all' as const, label: t('all'), icon: Sparkles },
    { type: 'note' as const, label: t('notes'), icon: FileText },
    { type: 'tasks' as const, label: t('tasks'), icon: CheckSquare },
    { type: 'credentials' as const, label: t('credentials'), icon: Key },
    { type: 'links' as const, label: t('links'), icon: Link2 },
    { type: 'code' as const, label: t('code'), icon: Code },
    { type: 'file' as const, label: t('file') || 'ملف', icon: File },
  ];

  const handleNavigate = (section: string) => {
    if (section === 'all') {
      setFilter('all');
    } else {
      setFilter(section as MessageType);
    }
    setDisplayCount(MESSAGES_PER_PAGE);
  };

  // Navigate to next/previous conversation
  const allConvs = showArchived ? archivedConversations : conversations;
  const currentConvIndex = allConvs.findIndex(c => c.id === currentConversationId);
  
  const goToNextConversation = () => {
    if (currentConvIndex >= 0 && currentConvIndex < allConvs.length - 1) {
      const nextId = allConvs[currentConvIndex + 1].id!;
      setCurrentConversationId(nextId);
      localStorage.setItem('activeConversationId', nextId);
      toast({ title: allConvs[currentConvIndex + 1].title });
    }
  };

  const goToPrevConversation = () => {
    if (currentConvIndex > 0) {
      const prevId = allConvs[currentConvIndex - 1].id!;
      setCurrentConversationId(prevId);
      localStorage.setItem('activeConversationId', prevId);
      toast({ title: allConvs[currentConvIndex - 1].title });
    }
  };

  const canGoNext = currentConvIndex >= 0 && currentConvIndex < allConvs.length - 1;
  const canGoPrev = currentConvIndex > 0;

  return (
    <div className={cn("flex h-[100dvh] bg-background overflow-hidden", isRTL && "flex-row-reverse")}>
      {/* Context Menu */}
      <ContextMenu 
        onNavigate={handleNavigate}
        onNextConversation={goToNextConversation}
        onPrevConversation={goToPrevConversation}
        canGoNext={canGoNext}
        canGoPrev={canGoPrev}
      />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Bottom Navigation - Grid layout */}
      <div className="fixed bottom-0 start-0 end-0 z-30 md:hidden bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
        <div className="grid grid-cols-4 gap-1 p-2">
          {filterButtons.slice(0, 4).map(btn => {
            const Icon = btn.icon;
            const isActive = filter === btn.type;
            return (
              <button
                key={btn.type}
                onClick={() => { setFilter(btn.type); setDisplayCount(MESSAGES_PER_PAGE); }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{btn.label}</span>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-4 gap-1 px-2 pb-2">
          {filterButtons.slice(4).map(btn => {
            const Icon = btn.icon;
            const isActive = filter === btn.type;
            return (
              <button
                key={btn.type}
                onClick={() => { setFilter(btn.type); setDisplayCount(MESSAGES_PER_PAGE); }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{btn.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-muted-foreground col-span-2"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t('chats')}</span>
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 w-80 transform transition-transform duration-300 ease-out",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <ConversationSidebar
          conversations={conversations}
          archivedConversations={archivedConversations}
          currentConversationId={currentConversationId}
          showArchived={showArchived}
          onSelectConversation={(id) => {
            setCurrentConversationId(id);
            localStorage.setItem('activeConversationId', id);
            setSidebarOpen(false);
          }}
          onCreateConversation={handleCreateConversation}
          onArchiveConversation={handleArchiveConversation}
          onUnarchiveConversation={handleUnarchiveConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onPinConversation={handlePinConversation}
          onUnpinConversation={handleUnpinConversation}
          onSetColor={handleSetColor}
          onSetLabel={handleSetLabel}
          onToggleArchived={() => setShowArchived(!showArchived)}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-[140px] md:pb-0">
        {/* Header */}
        {headerVisible && (
          <header className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-20 safe-area-top animate-fade-in">
            <div className="p-3 md:p-4">
              <div className="flex items-center gap-3 mb-3">
                {/* Sidebar Toggle - Desktop */}
                <button
                  onClick={toggleSidebar}
                  className="hidden md:flex p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </button>
                
                {/* Previous Conversation */}
                <button
                  onClick={goToPrevConversation}
                  disabled={!canGoPrev}
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    canGoPrev 
                      ? "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground" 
                      : "bg-muted/20 text-muted-foreground/30 cursor-not-allowed"
                  )}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl gradient-primary flex items-center justify-center glow-primary flex-shrink-0">
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                    {currentConversation?.title || t('appName')}
                  </h1>
                  <p className="text-xs text-muted-foreground">{t('personalStorage')}</p>
                </div>
                
                {/* Next Conversation */}
                <button
                  onClick={goToNextConversation}
                  disabled={!canGoNext}
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    canGoNext 
                      ? "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground" 
                      : "bg-muted/20 text-muted-foreground/30 cursor-not-allowed"
                  )}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Settings */}
                <SettingsDialog />
                
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title={theme === 'dark' ? t('lightMode') : t('darkMode')}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                
                {/* Header Toggle */}
                <button
                  onClick={toggleHeader}
                  className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <EyeOff className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleCreateConversation}
                  className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors md:hidden"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <SearchBar value={searchQuery} onChange={setSearchQuery} />

              {/* Desktop Filter Tabs */}
              <div className="hidden md:flex gap-2 mt-3 overflow-x-auto pb-1">
                {filterButtons.map(btn => {
                  const Icon = btn.icon;
                  const isActive = filter === btn.type;
                  return (
                    <button
                      key={btn.type}
                      onClick={() => { setFilter(btn.type); setDisplayCount(MESSAGES_PER_PAGE); }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all font-medium",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg" 
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {btn.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>
        )}

        {/* Header Show Button (when hidden) */}
        {!headerVisible && (
          <button
            onClick={toggleHeader}
            className="fixed top-4 start-4 z-30 p-3 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-lg text-muted-foreground hover:text-foreground transition-colors animate-fade-in"
          >
            <Eye className="w-5 h-5" />
          </button>
        )}

        {/* Messages */}
        <main ref={mainRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-3 md:p-4 max-w-3xl mx-auto">
            {/* Messages Grid - 2 columns on mobile */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">{t('loading')}</p>
              </div>
            ) : !currentConversationId ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-3xl gradient-primary mx-auto mb-6 flex items-center justify-center glow-primary">
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">{t('welcome')}</h2>
                <p className="text-muted-foreground mb-6">{t('createToStart')}</p>
                <button
                  onClick={handleCreateConversation}
                  className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-medium"
                >
                  {t('newConversation')}
                </button>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium mb-1">
                  {searchQuery ? t('noResults') : t('noMessages')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? t('tryDifferent') : t('startAdding')}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-3 md:gap-4">
                  {displayedMessages.map(message => (
                    <MessageCard 
                      key={message.id} 
                      message={message} 
                      onDelete={handleDelete}
                      onUpdate={loadMessages}
                      searchQuery={searchQuery}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center py-6">
                    {loadingMore ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('scrollMore')}</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Input */}
        {currentConversationId && <MessageInput onSend={handleSend} loading={sending} />}
      </div>
    </div>
  );
};

export default ChatView;
