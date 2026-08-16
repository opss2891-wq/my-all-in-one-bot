import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Sparkles, FileText, CheckSquare, Key, Link2, Code, Menu, Plus, PanelLeftOpen, PanelLeftClose, Eye, EyeOff, ChevronLeft, ChevronRight, File, Sun, Moon, Search, X, Check } from 'lucide-react';
import { 
  Message, MessageType, getMessages, addMessage, deleteMessage, TaskItem, LinkItem, CredentialData, CodeData, FileData,
  Conversation, ConversationColor, getConversations, getArchivedConversations, createConversation, 
  archiveConversation, unarchiveConversation, deleteConversation, updateConversation,
  pinConversation, unpinConversation, setConversationColor, setConversationLabel, updateMessage
} from '@/lib/supabase';
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
const MessageCard = React.lazy(() => import('./MessageCard'));
const MessageInput = React.lazy(() => import('./MessageInput'));
const SearchBar = React.lazy(() => import('./SearchBar'));
const ConversationSidebar = React.lazy(() => import('./ConversationSidebar'));
const ContextMenu = React.lazy(() => import('./ContextMenu'));
const SettingsDialog = React.lazy(() => import('./SettingsDialog'));
const Pagination = React.lazy(() => import('./Pagination'));
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUI } from '@/contexts/UIContext';
import { encryptData } from '@/lib/encryption';

const MESSAGES_PER_PAGE = 12;

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
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [page, setPage] = useState(1);
  const mainRef = useRef<HTMLDivElement>(null);

  const { t, isRTL, language } = useLanguage();
  const { sidebarOpen, setSidebarOpen, toggleSidebar, headerVisible, toggleHeader, theme, toggleTheme, layout } = useUI();
  const { user } = useAuth();

  useEffect(() => {
    if (user) loadConversations();
  }, [user?.id]);

  useEffect(() => {
    if (currentConversationId) {
      loadMessages();
      setPage(1); // Reset page when conversation changes
    }
  }, [currentConversationId]);

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery]);

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    scrollToTop();
  };

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
           // Toast removed to avoid distraction during typing/navigation
         }
      } else if (e.key === 'ArrowRight') {
        // Go to previous conversation
        if (currentIndex > 0) {
          const prevId = convs[currentIndex - 1].id!;
          setCurrentConversationId(prevId);
           localStorage.setItem('activeConversationId', prevId);
           // Toast removed to avoid distraction during typing/navigation
         }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [conversations, archivedConversations, currentConversationId, showArchived]);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const [convs, archived] = await Promise.all([
        getConversations(user.id),
        getArchivedConversations(user.id)
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
    if (!currentConversationId || !user) return;
    try {
      const data = await getMessages(user.id, currentConversationId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleCreateConversation = async () => {
    if (!user) return;
    try {
      const docRef = await createConversation(user.id, t('newChat'));
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
      // toast removed to prevent distraction during quick actions
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const handlePinConversation = async (id: string) => {
    try {
      await pinConversation(id);
      await loadConversations();
      // toast removed
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const handleUnpinConversation = async (id: string) => {
    try {
      await unpinConversation(id);
      await loadConversations();
      // toast removed
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const handleSetColor = async (id: string, color: ConversationColor) => {
    try {
      await setConversationColor(id, color);
      await loadConversations();
      // toast removed
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const handleSetLabel = async (id: string, label: string) => {
    try {
      await setConversationLabel(id, label);
      await loadConversations();
      // toast removed
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const parseContent = async (type: MessageType, content: string): Promise<Partial<Message>> => {
    switch (type) {
      case 'note':
        return { type: 'note', content };

      case 'tasks': {
        const tasks: TaskItem[] = content
          .split('\n')
          .filter(line => line.trim())
          .map(line => ({ text: line.trim(), completed: false }));
        return { type: 'tasks', tasks };
      }

      case 'links': {
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
      }

      case 'credentials': {
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
      }

      case 'code': {
        // Use AI to explain code and add tags
        const codeResult = await explainCode(content);
        const codeData: CodeData = {
          code: content,
          language: codeResult.language || detectCodeLanguage(content),
          explanation: codeResult.explanation,
          tags: codeResult.tags
        };
        return { type: 'code', codeData };
      }

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
        await addMessage(user.id, { 
          type: 'file',
          fileData,
          conversationId: currentConversationId 
        });
      } else {
        const messageData = await parseContent(type, content);
        
        // Encrypt credentials if type is credentials
        if (type === 'credentials' && messageData.credential) {
          messageData.credential = {
            ...messageData.credential,
            username: encryptData(messageData.credential.username),
            password: encryptData(messageData.credential.password),
            host: messageData.credential.host ? encryptData(messageData.credential.host) : '',
            url: messageData.credential.url ? encryptData(messageData.credential.url) : '',
          };
        }

        // Add images if it's a note
        if (type === 'note' && images && images.length > 0) {
          (messageData as Partial<Message>).images = images;
        }
        await addMessage(user.id, { 
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

  const handleUpdateMessageColor = async (id: string, color: ConversationColor) => {
    try {
      await updateMessage(id, { color });
      await loadMessages();
      toast({ title: language === 'ar' ? 'تم تحديث اللون' : 'Color updated' });
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const filteredMessages = messages
    .filter(m => {
      if (filter !== 'all' && m.type !== filter) return false;
      if (!searchQuery.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      
      if (m.type === 'note' && m.content?.toLowerCase().includes(query)) return true;
      if (m.type === 'tasks' && m.tasks?.some(t => t.text.toLowerCase().includes(query))) return true;
      if (m.type === 'credentials') {
        const cred = m.credential;
        if (cred?.username?.toLowerCase().includes(query)) return true;
        if (cred?.host?.toLowerCase().includes(query)) return true;
        if (cred?.url?.toLowerCase().includes(query)) return true;
      }
      if (m.type === 'links' && m.links?.some(l => 
        l.title.toLowerCase().includes(query) || l.url.toLowerCase().includes(query)
      )) return true;
      if (m.type === 'code') {
        const cd = m.codeData;
        if (cd?.code?.toLowerCase().includes(query)) return true;
        if (cd?.explanation?.toLowerCase().includes(query)) return true;
        if (cd?.tags?.some(tag => tag.toLowerCase().includes(query))) return true;
      }
      if (m.type === 'file' && m.fileData?.name?.toLowerCase().includes(query)) return true;
      return false;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalPages = Math.ceil(filteredMessages.length / MESSAGES_PER_PAGE);
  const pagedMessages = filteredMessages.slice(
    (page - 1) * MESSAGES_PER_PAGE,
    page * MESSAGES_PER_PAGE
  );

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
    setPage(1);
  };

  // Navigate to next/previous conversation
  const allConvs = showArchived ? archivedConversations : conversations;
  const currentConvIndex = allConvs.findIndex(c => c.id === currentConversationId);
  
  const goToNextConversation = () => {
    if (currentConvIndex >= 0 && currentConvIndex < allConvs.length - 1) {
      const nextId = allConvs[currentConvIndex + 1].id!;
      setCurrentConversationId(nextId);
       localStorage.setItem('activeConversationId', nextId);
       // Toast removed to avoid distraction
     }
  };

  const goToPrevConversation = () => {
    if (currentConvIndex > 0) {
      const prevId = allConvs[currentConvIndex - 1].id!;
      setCurrentConversationId(prevId);
       localStorage.setItem('activeConversationId', prevId);
       // Toast removed to avoid distraction
     }
  };
  
   const handleRenameCurrent = () => {
    if (currentConversation) {
      setTempTitle(currentConversation.title);
      setEditingTitle(true);
    }
  };

  const saveHeaderRename = () => {
    if (currentConversationId && tempTitle.trim() && tempTitle !== currentConversation?.title) {
      handleRenameConversation(currentConversationId, tempTitle.trim());
    }
    setEditingTitle(false);
  };

  const cancelHeaderRename = () => {
    setEditingTitle(false);
  };

  const canGoNext = currentConvIndex >= 0 && currentConvIndex < allConvs.length - 1;
  const canGoPrev = currentConvIndex > 0;

  return (
    <div className={cn(
      "flex h-[100dvh] overflow-hidden transition-colors duration-300 relative",
      isRTL ? "flex-row-reverse" : "flex-row",
      theme === 'dark' ? "bg-[#0a0c10]" : "bg-background"
    )}>
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-80 cyber-grid" />
      <div className="absolute top-[-15%] start-[-10%] w-[70%] h-[70%] bg-primary/20 rounded-full blur-[180px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-15%] end-[-10%] w-[70%] h-[70%] bg-accent/20 rounded-full blur-[180px] pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-[30%] end-[5%] w-[40%] h-[40%] bg-info/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] end-[10%] w-[30%] h-[30%] bg-info/5 rounded-full blur-[100px] pointer-events-none" />

      <React.Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <ContextMenu 
          onNavigate={handleNavigate}
          onNextConversation={goToNextConversation}
          onPrevConversation={goToPrevConversation}
          canGoNext={canGoNext}
          canGoPrev={canGoPrev}
          onRenameConversation={handleRenameCurrent}
          onSetCardColor={async (color) => {
            const activeCardId = (document.querySelector('[data-active-card="true"]') as HTMLElement)?.dataset.cardId;
            if (activeCardId) {
              await handleUpdateMessageColor(activeCardId, color);
            }
          }}
        />
      </React.Suspense>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Bottom Navigation - Grid layout */}
      <div className="fixed bottom-0 start-0 end-0 z-30 md:hidden glass-panel border-t border-white/10 safe-area-bottom rounded-t-2xl">
        <div className="grid grid-cols-4 gap-1 p-2">
          {filterButtons.map(btn => {
            const Icon = btn.icon;
            const isActive = filter === btn.type;
            return (
              <button
                key={btn.type}
                onClick={() => { setFilter(btn.type); setPage(1); }}
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
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 z-50 w-80 transform transition-transform duration-300 ease-out shadow-2xl",
        isRTL 
          ? (sidebarOpen ? "translate-x-0 left-0" : "-translate-x-full left-0") 
          : (sidebarOpen ? "translate-x-0 right-0" : "translate-x-full right-0")
      )}>
        <React.Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
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
        </React.Suspense>
      </div>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 pb-[140px] md:pb-0 transition-colors duration-300 relative z-10",
        theme === 'dark' ? "bg-transparent" : "bg-background/50"
      )}>
        {/* Header */}
        {headerVisible && (
          <header className="cyber-header">
            <div className="p-3 md:p-4">
              <div className="flex items-center gap-3 mb-3">
                {/* Sidebar Toggle - Desktop & Mobile */}
                <button
                  onClick={toggleSidebar}
                  className="flex p-2.5 rounded-xl bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all border border-white/5"
                  title={t('conversations')}
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                {/* Previous Conversation */}
                <button
                  onClick={goToPrevConversation}
                  disabled={!canGoPrev}
                  className={cn(
                    "p-2 rounded-xl transition-all border border-white/5",
                    canGoPrev 
                      ? "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground" 
                      : "bg-white/5 text-muted-foreground/30 cursor-not-allowed"
                  )}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0 group overflow-hidden">
                  <svg viewBox="0 0 100 100" className="w-6 h-6 md:w-8 md:h-8 fill-none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 5L15 20V45C15 67.2 29.9 87.7 50 95C70.1 87.7 85 67.2 85 45V20L50 5Z" stroke="currentColor" strokeWidth="6" className="text-primary" />
                    <circle cx="50" cy="45" r="12" stroke="currentColor" strokeWidth="4" className="text-primary" />
                    <path d="M50 57V68M45 73H55" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className="text-primary" />
                  </svg>
                </div>
                 <div className="flex-1 min-w-0">
                   {currentConversationId ? (
                     editingTitle ? (
                       <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                         <input
                           type="text"
                           value={tempTitle}
                           onChange={(e) => setTempTitle(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter') saveHeaderRename();
                             if (e.key === 'Escape') cancelHeaderRename();
                           }}
                           className="bg-white/5 border border-primary/30 rounded-lg px-2 py-1 text-lg font-bold text-foreground w-full focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                           autoFocus
                         />
                         <button onClick={saveHeaderRename} className="p-1.5 bg-success/20 hover:bg-success/30 rounded-lg transition-colors">
                           <Check className="w-5 h-5 text-success" />
                         </button>
                         <button onClick={cancelHeaderRename} className="p-1.5 bg-destructive/20 hover:bg-destructive/30 rounded-lg transition-colors">
                           <X className="w-5 h-5 text-destructive" />
                         </button>
                       </div>
                     ) : (
                        <div 
                          className="cursor-pointer hover:bg-muted/30 rounded-lg px-2 py-1 transition-all group relative border border-transparent hover:border-primary/20"
                          onClick={handleRenameCurrent}
                          title={language === 'ar' ? 'تعديل العنوان' : 'Edit title'}
                        >
                          <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                            {currentConversation?.title}
                          </h1>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('personalStorage')}</p>
                        </div>

                     )
                   ) : (
                     <div className="flex flex-col">
                       <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                         {t('appName')}
                       </h1>
                       <p className="text-xs text-muted-foreground">{t('personalStorage')}</p>
                     </div>
                   )}
                  </div>
                  
                  {/* Filter Pills - Desktop only to avoid crowding */}
                  <div className="hidden lg:flex items-center gap-1.5 bg-muted/20 p-1 rounded-2xl mx-2">
                    {['all', 'note', 'tasks', 'credentials', 'links', 'code', 'file'].map((type) => {
                      const isActive = filter === type;
                      return (
                        <button
                          key={type}
                          onClick={() => { setFilter(type as any); setPage(1); }}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-xs font-medium",
                            isActive 
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}
                        >
                          {type === 'all' && <Sparkles className="w-3.5 h-3.5" />}
                          {type === 'note' && <FileText className="w-3.5 h-3.5" />}
                          {type === 'tasks' && <CheckSquare className="w-3.5 h-3.5" />}
                          {type === 'credentials' && <Key className="w-3.5 h-3.5" />}
                          {type === 'links' && <Link2 className="w-3.5 h-3.5" />}
                          {type === 'code' && <Code className="w-3.5 h-3.5" />}
                          {type === 'file' && <File className="w-3.5 h-3.5" />}
                          <span className="hidden xl:inline">{type === 'all' ? t('all') : t(type)}</span>
                        </button>
                      );
                    })}
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
                <React.Suspense fallback={<Loader2 className="w-4 h-4 animate-spin" />}>
                  <SettingsDialog />
                </React.Suspense>
                
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
                      onClick={() => { setFilter(btn.type); setPage(1); }}
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
        <main 
          ref={mainRef} 
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain transition-colors duration-300 scroll-smooth",
            theme === 'dark' ? "bg-transparent text-slate-50" : "bg-slate-50/30 text-slate-900"
          )}
        >
          <div className="p-3 md:p-4 max-w-3xl mx-auto">
            {/* Messages Grid - 2 columns on mobile */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">{t('loading')}</p>
              </div>
            ) : !currentConversationId ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-3xl gradient-primary mx-auto mb-6 flex items-center justify-center">
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
                <div className={cn(
                  "grid gap-3 md:gap-4",
                  layout === 'grid' ? "grid-cols-2 md:grid-cols-2" : "grid-cols-1 md:grid-cols-1"
                )}>
                  <React.Suspense fallback={<div className="p-4 border border-border rounded-xl bg-card animate-pulse h-24" />}>
                    {pagedMessages.map(message => (
                      <MessageCard 
                        key={message.id} 
                        message={message} 
                        onDelete={handleDelete}
                        onUpdate={loadMessages}
                        searchQuery={searchQuery}
                      />
                    ))}
                  </React.Suspense>
                </div>
                
                {/* Pagination for messages */}
                {totalPages > 1 && (
                  <div className="mt-8 mb-12">
                    <React.Suspense fallback={<div className="h-10 w-full animate-pulse bg-muted rounded-xl" />}>
                      <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        totalItems={filteredMessages.length}
                      />
                    </React.Suspense>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Input */}
        {currentConversationId && (
          <div className={cn(
            "sticky bottom-0 z-20 transition-colors duration-300",
            theme === 'dark' ? "bg-slate-900/90 backdrop-blur-md" : "bg-card/90 backdrop-blur-md"
          )}>
            <React.Suspense fallback={<div className="p-4 border-t border-border bg-card animate-pulse h-20" />}>
              <MessageInput onSend={handleSend} loading={sending} />
            </React.Suspense>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatView;
