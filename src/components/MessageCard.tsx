import React, { useState } from 'react';
import { Trash2, Copy, FileText, CheckSquare, Square, Key, Link2, Code, Eye, EyeOff, ExternalLink, Plus, X, File, Download, ChevronDown } from 'lucide-react';
import { Message, updateMessage } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { decryptData } from '@/lib/encryption';
import { playTaskSound, playCopySound } from '@/hooks/useSound';
import HighlightText from './HighlightText';
import CodeHighlight from './CodeHighlight';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const CODE_LANGUAGES = [
  'javascript', 'typescript', 'python', 'php', 'sql',
  'css', 'html', 'xml', 'json', 'bash', 'java', 'text'
];

// Component for adding new tasks
const AddTaskInput: React.FC<{ messageId: string; onUpdate: () => void }> = ({ messageId, onUpdate }) => {
  const [newTask, setNewTask] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { t } = useLanguage();

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    try {
      // Get current message and add new task
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const docRef = doc(db, 'messages', messageId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentTasks = docSnap.data().tasks || [];
        const updatedTasks = [...currentTasks, { text: newTask.trim(), completed: false }];
        await updateMessage(messageId, { tasks: updatedTasks });
        setNewTask('');
        setIsAdding(false);
        onUpdate();
        toast({ title: t('addedSuccess') });
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-all w-full"
      >
        <Plus className="w-4 h-4" />
        <span>{t('addNewTask')}</span>
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
        placeholder={t('taskPlaceholder')}
        className="flex-1 px-3 py-2 text-sm bg-muted/50 border border-warning/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-warning/30"
        autoFocus
      />
      <button
        onClick={handleAddTask}
        className="px-3 py-2 bg-warning/20 text-warning rounded-xl hover:bg-warning/30 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

// Language selector for code blocks
const LanguageSelector: React.FC<{
  language: string;
  messageId: string;
  codeData: { code: string; language?: string; explanation?: string; tags?: string[] };
  onUpdate: () => void;
}> = ({ language, messageId, codeData, onUpdate }) => {
  const [open, setOpen] = useState(false);

  const handleSelect = async (lang: string) => {
    setOpen(false);
    await updateMessage(messageId, { codeData: { ...codeData, language: lang } });
    onUpdate();
    toast({ title: `تم تغيير اللغة إلى ${lang.toUpperCase()}` });
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-info/20 text-info rounded-md uppercase hover:bg-info/30 transition-colors"
      >
        {language}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 end-0 bg-card border border-border rounded-lg shadow-lg py-1 z-50 max-h-48 overflow-y-auto min-w-[120px]">
          {CODE_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={(e) => { e.stopPropagation(); handleSelect(lang); }}
              className={cn(
                "w-full text-start px-3 py-1.5 text-xs font-mono uppercase hover:bg-muted transition-colors",
                lang === language ? "text-info bg-info/10" : "text-foreground"
              )}
            >
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface MessageCardProps {
  message: Message;
  onDelete: (id: string) => void;
  onUpdate: () => void;
  searchQuery?: string;
}

// Detect if text is Arabic
const isArabicText = (text: string): boolean => {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const arabicCount = (text.match(arabicPattern) || []).length;
  const totalLetters = text.replace(/[^a-zA-Z\u0600-\u06FF]/g, '').length;
  return totalLetters > 0 && (arabicCount / totalLetters) > 0.5;
};

const MessageCard: React.FC<MessageCardProps> = ({ message, onDelete, onUpdate, searchQuery = '' }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { t, language } = useLanguage();

  const credential = message.credential ? {
    ...message.credential,
    username: decryptData(message.credential.username),
    password: decryptData(message.credential.password),
    host: message.credential.host ? decryptData(message.credential.host) : '',
    url: message.credential.url ? decryptData(message.credential.url) : '',
  } : undefined;


  const copyToClipboard = (text: string, label: string = 'Text') => {
    navigator.clipboard.writeText(text);
    playCopySound();
    toast({ title: t('copied') });
  };

  const handleToggleTask = async (index: number) => {
    if (!message.tasks || !message.id) return;
    const newTasks = [...message.tasks];
    const willBeCompleted = !newTasks[index].completed;
    newTasks[index] = { ...newTasks[index], completed: willBeCompleted };
    playTaskSound(willBeCompleted);
    await updateMessage(message.id, { tasks: newTasks });
    onUpdate();
  };

  const handleCardClick = () => {
    if (message.type === 'note' && message.content) {
      copyToClipboard(message.content, t('note'));
    }
    if (message.type === 'code' && message.codeData?.code) {
      copyToClipboard(message.codeData.code, t('code'));
    }
  };

  const getIcon = () => {
    switch (message.type) {
      case 'note': return <FileText className="w-5 h-5 text-success" />;
      case 'tasks': return <CheckSquare className="w-5 h-5 text-warning" />;
      case 'credentials': return <Key className="w-5 h-5 text-accent" />;
      case 'links': return <Link2 className="w-5 h-5 text-primary" />;
      case 'code': return <Code className="w-5 h-5 text-info" />;
      case 'file': return <File className="w-5 h-5 text-purple-400" />;
    }
  };

  const getTypeLabel = () => {
    switch (message.type) {
      case 'note': return t('note');
      case 'tasks': return t('tasks');
      case 'credentials': return t('credentials');
      case 'links': return t('links');
      case 'code': return t('code');
      case 'file': return t('file') || 'ملف';
    }
  };

  const getBorderColor = () => {
    switch (message.type) {
      case 'note': return 'border-success/30 hover:border-success/50';
      case 'tasks': return 'border-warning/30 hover:border-warning/50';
      case 'credentials': return 'border-accent/30 hover:border-accent/50';
      case 'links': return 'border-primary/30 hover:border-primary/50';
      case 'code': return 'border-info/30 hover:border-info/50';
      case 'file': return 'border-purple-500/30 hover:border-purple-500/50';
    }
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const renderContent = () => {
    switch (message.type) {
      case 'note':
        const content = message.content || '';
        const isLongNote = content.length > 200 || content.split('\n').length > 4;
        const displayContent = (!isLongNote || isExpanded) ? content : content.slice(0, 180) + '...';

        return (
          <div 
            className="cursor-pointer active:scale-[0.99] transition-transform space-y-3"
            dir="rtl"
            style={{ textAlign: 'right' }}
          >
            <HighlightText 
              text={displayContent} 
              searchQuery={searchQuery}
              className="text-foreground whitespace-pre-wrap block text-sm md:text-base leading-relaxed"
            />
            
            {isLongNote && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1 mt-1 mr-auto"
              >
                {isExpanded ? (language === 'ar' ? 'عرض أقل' : 'Show less') : (language === 'ar' ? 'عرض المزيد' : 'Show more')}
                <ChevronDown className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-180")} />
              </button>
            )}
            
            {/* Display Images */}
            {message.images && message.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                {message.images.map((img, index) => (
                  <div 
                    key={index} 
                    className="relative group rounded-xl overflow-hidden border border-border cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(img); }}
                  >
                    <img 
                      src={img} 
                      alt={`Image ${index + 1}`}
                      className="w-full h-24 object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'tasks':
        const tasks = message.tasks || [];
        const title = tasks.length > 0 ? tasks[0].text : '';
        const actualTasks = tasks.slice(1); // Tasks start from index 1
        const completedCount = actualTasks.filter(t => t.completed).length;
        const totalCount = actualTasks.length;
        const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        return (
          <div className="space-y-3">
            {/* Title - First line */}
            {title && (
              <h3 className="text-base font-semibold text-foreground border-b border-warning/20 pb-2">
                {title}
              </h3>
            )}
            
            {/* Progress bar */}
            {actualTasks.length > 0 && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-success/70 to-success transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="font-medium tabular-nums">{completedCount}/{totalCount}</span>
              </div>
            )}
            
            {/* Task items - starting from index 1 */}
            {actualTasks.map((task, index) => (
              <div
                key={index + 1}
                onClick={() => handleToggleTask(index + 1)} // +1 because title is at index 0
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all active:scale-[0.98]",
                  task.completed ? "bg-success/10" : "hover:bg-muted/80"
                )}
              >
                {task.completed ? (
                  <CheckSquare className="w-5 h-5 text-success flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <HighlightText 
                  text={task.text} 
                  searchQuery={searchQuery}
                  className={cn(
                    "text-sm flex-1",
                    task.completed ? "line-through text-muted-foreground" : "text-foreground"
                  )}
                />
              </div>
            ))}
            
            {/* Add new task */}
            <AddTaskInput messageId={message.id!} onUpdate={onUpdate} />
          </div>
        );

      case 'credentials':
        const cred = credential;
        if (!cred) return null;
        return (
          <div className="space-y-2 font-mono text-sm">
            {/* Type Badge */}
            <div className="pb-2 border-b border-border">
              <span className="text-xs px-3 py-1.5 rounded-full bg-accent/20 text-accent font-medium">
                {cred.credType?.toUpperCase() || 'OTHER'}
              </span>
            </div>
            
            {/* Username */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
              <span className="text-muted-foreground text-xs min-w-[60px]">{t('userLabel')}</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-foreground truncate max-w-[180px]">{cred.username}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(cred.username, 'Username'); }} 
                  className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
            
            {/* Password */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
              <span className="text-muted-foreground text-xs min-w-[60px]">{t('passLabel')}</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-foreground font-mono">
                  {showPassword ? cred.password : '••••••••'}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }} 
                  className="p-1.5 hover:bg-warning/20 rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 text-warning" /> : <Eye className="w-3.5 h-3.5 text-warning" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(cred.password, 'Password'); }} 
                  className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
            
            {/* Host */}
            {cred.host && (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                <span className="text-muted-foreground text-xs min-w-[60px]">{t('hostLabel')}</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-foreground truncate max-w-[180px]">{cred.host}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(cred.host!, 'Host'); }} 
                    className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-primary" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Port */}
            {cred.port && (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                <span className="text-muted-foreground text-xs min-w-[60px]">{t('portLabel')}</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-foreground">{cred.port}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(cred.port!, 'Port'); }} 
                    className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-primary" />
                  </button>
                </div>
              </div>
            )}
            
            {/* URL */}
            {cred.url && (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                <span className="text-muted-foreground text-xs min-w-[60px]">{t('urlLabel')}</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <a 
                    href={cred.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline truncate max-w-[150px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {cred.url}
                  </a>
                  <button 
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(cred.url!, 'URL'); }} 
                    className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-primary" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'links':
        return (
          <div className="space-y-2">
            {message.links?.map((link, index) => {
              // Get favicon from Google's service
              let faviconUrl: string | undefined;
              try {
                const urlObj = new URL(link.url);
                faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
              } catch {
                faviconUrl = undefined;
              }
              
              return (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-all group active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors overflow-hidden">
                    {faviconUrl ? (
                      <img 
                        src={faviconUrl} 
                        alt="" 
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('fallback-icon');
                        }}
                      />
                    ) : (
                      <ExternalLink className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate text-sm">{link.title || link.url}</p>
                    {link.title && (
                      <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        );

      case 'code':
        const codeData = message.codeData;
        if (!codeData) return null;
        return (
          <div className="space-y-3">
            {/* Code Block with Syntax Highlighting */}
            <div className="relative group/code">
              <div className="absolute top-2 end-2 flex gap-2 z-10">
                <LanguageSelector
                  language={codeData.language || 'javascript'}
                  messageId={message.id!}
                  codeData={codeData}
                  onUpdate={onUpdate}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(codeData.code, t('code')); }}
                  className="p-1.5 bg-muted/80 hover:bg-muted rounded-md transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <div className="pt-8 border border-info/20 rounded-xl overflow-hidden bg-[#0d1117]">
                <CodeHighlight
                  code={codeData.code} 
                  language={codeData.language || 'text'}
                />
              </div>
            </div>
            
            {/* Explanation (if any) */}
            {codeData.explanation && (
              <div className="p-3 rounded-xl bg-info/5 border border-info/20">
                <p className="text-xs text-muted-foreground mb-1">{t('explanation')}</p>
                <p className="text-sm text-foreground">{codeData.explanation}</p>
              </div>
            )}
            
            {/* Tags */}
            {codeData.tags && codeData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {codeData.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2.5 py-1 text-xs font-medium bg-info/10 text-info rounded-lg"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      case 'file':
        const fileData = message.fileData;
        if (!fileData) return null;
        
        const isTextFile = fileData.type === 'text/plain' || fileData.name.endsWith('.txt') || fileData.type === 'text/csv';
        const fileContent = isTextFile ? fileData.content : null;
        
        const downloadFile = () => {
          const link = document.createElement('a');
          if (isTextFile) {
            const blob = new Blob([fileData.content], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
          } else {
            link.href = fileData.content; // base64 URL
          }
          link.download = fileData.name;
          link.click();
        };
        
        return (
          <div className="space-y-3">
            {/* File Info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <File className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium truncate text-sm">{fileData.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(fileData.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={downloadFile}
                className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 text-purple-400" />
              </button>
            </div>
            
            {/* Text Content Preview */}
            {fileContent && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border max-h-48 overflow-y-auto">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {fileContent.length > 2000 ? fileContent.slice(0, 2000) + '...' : fileContent}
                </pre>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div 
      data-card-type={message.type}
      className={cn(
        "bg-card border-2 rounded-2xl p-4 animate-slide-up group transition-all",
        getBorderColor(),
        (message.type === 'note' || message.type === 'code') && "cursor-pointer active:scale-[0.99]"
      )}
      onClick={(message.type === 'note' || message.type === 'code') ? handleCardClick : undefined}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            message.type === 'note' && "bg-success/10",
            message.type === 'tasks' && "bg-warning/10",
            message.type === 'credentials' && "bg-accent/10",
            message.type === 'links' && "bg-primary/10",
            message.type === 'code' && "bg-info/10",
            message.type === 'file' && "bg-purple-500/10",
          )}>
            {getIcon()}
          </div>
          <div>
            <span className="text-xs font-medium text-foreground">{getTypeLabel()}</span>
            <p className="text-[10px] text-muted-foreground">
              {new Date(message.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(message.id!); }}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-50 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {renderContent()}
      
      {/* Image Preview Modal with Esc support */}
      {selectedImage && (
        <ImagePreviewModal 
          image={selectedImage} 
          onClose={() => setSelectedImage(null)} 
        />
      )}
    </div>
  );
};

// Separate component for image preview with Esc support
const ImagePreviewModal: React.FC<{ image: string; onClose: () => void }> = ({ image, onClose }) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
        <img 
          src={image} 
          alt="Preview" 
          className="max-w-full max-h-[85vh] object-contain rounded-xl cursor-pointer"
          onClick={onClose}
        />
        <p className="text-center text-white/60 text-sm mt-3">اضغط ESC أو انقر للإغلاق</p>
      </div>
    </div>
  );
};

export default MessageCard;
