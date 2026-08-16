import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Copy, FileText, CheckSquare, Square, Key, Link2, Code, Eye, EyeOff, ExternalLink, Plus, X, File, Download, ChevronDown, User, Shield, Lock, Activity, Zap, Terminal, Globe, Palette, Mic, Music, Database } from 'lucide-react';
import { Message, updateMessage } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { decryptData } from '@/lib/encryption';
import { playTaskSound, playCopySound } from '@/hooks/useSound';
import HighlightText from './HighlightText';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeHighlight from './CodeHighlight';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUI } from '@/contexts/UIContext';
import { Pin, PinOff, Slash } from 'lucide-react';

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
      const { supabase: supabaseClient } = await import('@/lib/supabase');
      const { data: docSnap, error } = await supabaseClient.from('messages').select('*').eq('id', messageId).single();
      if (docSnap && !error) {
        const currentTasks = (docSnap.tasks as any) || [];
        const updatedTasks = [...currentTasks, { text: newTask.trim(), completed: false }];
        await updateMessage(messageId, { tasks: updatedTasks as any });

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

const MessageCard: React.FC<MessageCardProps> = ({ message, onDelete, onUpdate, searchQuery = '' }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingDescription, setIsAddingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [noteHeight, setNoteHeight] = useState<number | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const { t, language } = useLanguage();
  const { layout } = useUI();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAddingDescription) {
      const handleClickOutside = (event: MouseEvent) => {
        if (descriptionRef.current && !descriptionRef.current.contains(event.target as Node)) {
          handleUpdateDescription();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAddingDescription, tempDescription]);

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startHeight = noteHeight || (isExpanded ? 500 : 150);

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const delta = currentY - startY;
      const newHeight = Math.max(80, Math.min(1000, startHeight + delta));
      setNoteHeight(newHeight);
    };

    const onEnd = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };


  const credential = message.credential ? {
    ...message.credential,
    username: decryptData(message.credential.username),
    password: decryptData(message.credential.password),
    host: message.credential.host ? decryptData(message.credential.host) : '',
    url: message.credential.url ? decryptData(message.credential.url) : '',
  } : undefined;

  const copyToClipboard = (text: string) => {
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
      copyToClipboard(message.content);
    }
    if (message.type === 'code' && message.codeData?.code) {
      copyToClipboard(message.codeData.code);
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 transition-transform duration-300 group-hover:scale-110";
    switch (message.type) {
      case 'note': return <FileText className={cn(iconClass, "text-success")} />;
      case 'tasks': return <CheckSquare className={cn(iconClass, "text-warning")} />;
      case 'credentials': return <Shield className={cn(iconClass, "text-accent")} />;
      case 'links': return <Globe className={cn(iconClass, "text-primary")} />;
      case 'code': return <Terminal className={cn(iconClass, "text-info")} />;
      case 'file': return <Zap className={cn(iconClass, "text-purple-400")} />;
      case 'audio': return <Music className={cn(iconClass, "text-pink-400")} />;
      case 'voice': return <Mic className={cn(iconClass, "text-rose-400")} />;
      case 'location': return <Database className={cn(iconClass, "text-emerald-400")} />;
      default: return <FileText className={iconClass} />;
    }
  };

  const handleUpdateDescription = async () => {
    if (!message.id) return;
    try {
      await updateMessage(message.id, { description: tempDescription.trim() });
      setIsAddingDescription(false);
      onUpdate();
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
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
      default: return '';
    }
  };

  const handleTogglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!message.id) return;
    try {
      await updateMessage(message.id, { pinned: !message.pinned });
      onUpdate();
      // toast removed to avoid noise when pinning from message list
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const getBorderColor = () => {
    // If a custom color is set, it takes precedence
    if (message.color && message.color !== 'none') {
      switch (message.color) {
        case 'red': return 'border-red-500 bg-red-500/10 dark:bg-red-500/20 shadow-none !important pointer-events-auto';
        case 'orange': return 'border-orange-500 bg-orange-500/10 dark:bg-orange-500/20 shadow-none !important pointer-events-auto';
        case 'yellow': return 'border-yellow-500 bg-yellow-500/10 dark:bg-yellow-500/20 shadow-none !important pointer-events-auto';
        case 'green': return 'border-green-500 bg-green-500/10 dark:bg-green-500/20 shadow-none !important pointer-events-auto';
        case 'emerald': return 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 shadow-none !important pointer-events-auto';
        case 'teal': return 'border-teal-500 bg-teal-500/10 dark:bg-teal-500/20 shadow-none !important pointer-events-auto';
        case 'blue': return 'border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 shadow-none !important pointer-events-auto';
        case 'indigo': return 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 shadow-none !important pointer-events-auto';
        case 'purple': return 'border-purple-500 bg-purple-500/10 dark:bg-purple-500/20 shadow-none !important pointer-events-auto';
        case 'pink': return 'border-pink-500 bg-pink-500/10 dark:bg-pink-500/20 shadow-none !important pointer-events-auto';
        case 'rose': return 'border-rose-500 bg-rose-500/10 dark:bg-rose-500/20 shadow-none !important pointer-events-auto';
        case 'slate': return 'border-slate-500 bg-slate-500/10 dark:bg-slate-500/20 shadow-none !important pointer-events-auto';
        case 'cyan': return 'border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/20 shadow-none !important pointer-events-auto';
        case 'amber': return 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 shadow-none !important pointer-events-auto';
        default: return 'border-border/30 shadow-none !important';
      }
    }

    switch (message.type) {
      case 'note': return 'border-success/50 bg-success/5 dark:bg-success/10 shadow-none !important pointer-events-auto';
      case 'tasks': return 'border-warning/50 bg-warning/5 dark:bg-warning/10 shadow-none !important pointer-events-auto';
      case 'credentials': return 'border-accent/50 bg-accent/5 dark:bg-accent/10 shadow-none !important pointer-events-auto';
      case 'links': return 'border-primary/50 bg-primary/5 dark:bg-primary/10 shadow-none !important pointer-events-auto';
      case 'code': return 'border-info/50 bg-info/5 dark:bg-info/10 shadow-none !important pointer-events-auto';
      case 'file': return 'border-purple-500/50 bg-purple-500/5 dark:bg-purple-500/10 shadow-none !important pointer-events-auto';
      case 'audio': return 'border-pink-500/50 bg-pink-500/5 dark:bg-pink-500/10 shadow-none !important pointer-events-auto';
      case 'voice': return 'border-rose-500/50 bg-rose-500/5 dark:bg-rose-500/10 shadow-none !important pointer-events-auto';
      case 'location': return 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-none !important pointer-events-auto';
      default: return 'border-border/30 shadow-none !important pointer-events-auto';
    }
  };

  const handleSetColor = async (color: Message['color']) => {
    if (!message.id) return;
    try {
      await updateMessage(message.id, { color });
      onUpdate();
      setShowColorPicker(false);
    } catch (error) {
      toast({ title: t('error'), variant: 'destructive' });
    }
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const renderContent = () => {
    switch (message.type) {
      case 'note': {
        const content = message.content || '';
        const isLongNote = content.length > 200 || content.split('\n').length > 4;
        const displayContent = (!isLongNote || isExpanded) ? content : content.slice(0, 180) + '...';

        return (
          <div className="space-y-3 relative group/note pointer-events-auto z-10" dir="rtl" style={{ textAlign: 'right' }}>
            <div 
              onDoubleClick={(e) => {
                e.stopPropagation();
                setTempDescription(message.description || '');
                setIsAddingDescription(true);
              }}
              style={{ height: noteHeight ? `${noteHeight}px` : 'auto' }}
              className={cn(
                "overflow-hidden transition-[height] duration-200 pointer-events-auto relative z-[60]",
                !noteHeight && !isExpanded && "max-h-[150px]"
              )}
            >
              <div className={cn(
                "text-foreground leading-relaxed markdown-content pointer-events-auto",
                layout === 'compact' ? "text-xs line-clamp-2" : "text-sm md:text-base"
              )}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
            
            {/* Resize handle */}
            <div 
              onMouseDown={handleResizeStart}
              onTouchStart={handleResizeStart}
              className="absolute -bottom-1 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center opacity-0 group-hover/note:opacity-100 transition-opacity z-10"
            >
              <div className="w-12 h-1 bg-primary/40 rounded-full shadow-sm" />
            </div>

            {!noteHeight && isLongNote && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1 mt-1 mr-auto"
              >
                {isExpanded ? (language === 'ar' ? 'عرض أقل' : 'Show less') : (language === 'ar' ? 'عرض المزيد' : 'Show more')}
                <ChevronDown className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-180")} />
              </button>
            )}
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
            
            {/* Optional Description Section */}
            {(message.description || isAddingDescription) ? (
              <div className="mt-3 pt-3 border-t border-success/10 bg-success/5 rounded-xl p-3 relative group/desc pointer-events-auto z-[60]">
                {isAddingDescription ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      ref={descriptionRef}
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdateDescription();
                        }
                      }}
                      placeholder={language === 'ar' ? 'أضف ملاحظة فرعية...' : 'Add a sub-note...'}
                      className="w-full bg-card border border-success/30 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-success"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsAddingDescription(false); }}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateDescription(); }}
                        className="p-1.5 bg-success/20 hover:bg-success/30 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 text-success" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <p className="text-xs text-success/70 mb-1 font-medium">{language === 'ar' ? 'ملاحظة إضافية:' : 'Additional Note:'}</p>
                    <p 
                      className="text-sm text-foreground/90 leading-relaxed italic cursor-pointer select-none"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                    >
                      {message.description}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                      className="absolute top-0 end-0 p-1 opacity-0 group-hover/desc:opacity-100 hover:bg-success/10 rounded transition-all"
                    >
                      <Plus className="w-3 h-3 text-success" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTempDescription('');
                  setIsAddingDescription(true);
                }}
                className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-success transition-colors opacity-0 group-hover/note:opacity-100"
              >
                <Plus className="w-3 h-3" />
                <span>{language === 'ar' ? 'أضف وصفاً/ملاحظة فرعية' : 'Add description/sub-note'}</span>
              </button>
            )}
          </div>
        );
      }
      case 'tasks': {
        const tasks = message.tasks || [];
        const title = tasks.length > 0 ? tasks[0].text : '';
        const actualTasks = tasks.slice(1);
        const completedCount = actualTasks.filter(t => t.completed).length;
        const totalCount = actualTasks.length;
        const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        return (
          <div className="space-y-3">
            {title && (
              <h3 className="text-base font-semibold text-foreground border-b border-warning/20 pb-2">
                {title}
              </h3>
            )}
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
            {actualTasks.map((task, index) => (
              <div
                key={index + 1}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleTask(index + 1);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] pointer-events-auto relative z-[60]",
                  layout === 'compact' ? "p-1.5 gap-2" : "p-3 gap-3",
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
            <div className="pointer-events-auto relative z-[50]">
              <AddTaskInput messageId={message.id!} onUpdate={onUpdate} />
            </div>
            {/* Optional Description Section for Tasks */}
            {(message.description || isAddingDescription) ? (
              <div className="mt-3 pt-3 border-t border-warning/10 bg-warning/5 rounded-xl p-3 relative group/desc pointer-events-auto z-[60]">
                {isAddingDescription ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      ref={descriptionRef}
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdateDescription();
                        }
                      }}
                      placeholder={language === 'ar' ? 'أضف ملاحظة فرعية للمهام...' : 'Add a sub-note for tasks...'}
                      className="w-full bg-card border border-warning/30 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-warning"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsAddingDescription(false); }}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateDescription(); }}
                        className="p-1.5 bg-warning/20 hover:bg-warning/30 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 text-warning" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <p className="text-xs text-warning/70 mb-1 font-medium">{language === 'ar' ? 'ملاحظة إضافية:' : 'Additional Note:'}</p>
                    <p 
                      className="text-sm text-foreground/90 leading-relaxed italic cursor-pointer select-none"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                    >
                      {message.description}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                      className="absolute top-0 end-0 p-1 opacity-0 group-hover/desc:opacity-100 hover:bg-warning/10 rounded transition-all"
                    >
                      <Plus className="w-3 h-3 text-warning" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTempDescription('');
                  setIsAddingDescription(true);
                }}
                className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-warning transition-colors opacity-0 group-hover:opacity-100"
              >
                <Plus className="w-3 h-3" />
                <span>{language === 'ar' ? 'أضف وصفاً/ملاحظة فرعية' : 'Add description/sub-note'}</span>
              </button>
            )}
            {/* Optional Description Section for Credentials */}
            {(message.description || isAddingDescription) ? (
              <div className="mt-3 pt-3 border-t border-accent/10 bg-accent/5 rounded-xl p-3 relative group/desc animate-fade-in">
                {isAddingDescription ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      placeholder={language === 'ar' ? 'أضف ملاحظة فرعية للبيانات...' : 'Add a sub-note for credentials...'}
                      className="w-full bg-card border border-accent/30 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsAddingDescription(false); }}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateDescription(); }}
                        className="p-1.5 bg-accent/20 hover:bg-accent/30 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 text-accent" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <p className="text-xs text-accent/70 mb-1 font-medium">{language === 'ar' ? 'ملاحظة إضافية:' : 'Additional Note:'}</p>
                    <p 
                      className="text-sm text-foreground/90 leading-relaxed italic cursor-pointer select-none"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                    >
                      {message.description}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                      className="absolute top-0 end-0 p-1 opacity-0 group-hover/desc:opacity-100 hover:bg-accent/10 rounded transition-all"
                    >
                      <Plus className="w-3 h-3 text-accent" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTempDescription('');
                  setIsAddingDescription(true);
                }}
                className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
              >
                <Plus className="w-3 h-3" />
                <span>{language === 'ar' ? 'أضف وصفاً/ملاحظة فرعية' : 'Add description/sub-note'}</span>
              </button>
            )}
          </div>
        );
      }
      case 'credentials': {
        const cred = credential;
        if (!cred) return null;
        return (
          <div className="space-y-2 font-mono text-sm">
            <div className="pb-2 border-b border-border">
              <span className="text-xs px-3 py-1.5 rounded-full bg-accent/20 text-accent font-medium">
                {cred.credType?.toUpperCase() || 'OTHER'}
              </span>
            </div>
            <div className={cn(
              "flex items-center justify-between gap-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors",
              layout === 'compact' ? "p-1.5" : "p-2.5"
            )}>
              <span className="text-muted-foreground text-xs min-w-[60px]">{t('userLabel')}</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-foreground truncate max-w-[180px]">{cred.username}</span>
                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(cred.username); }} className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors">
                  <Copy className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
            <div className={cn(
              "flex items-center justify-between gap-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors",
              layout === 'compact' ? "p-1.5" : "p-2.5"
            )}>
              <span className="text-muted-foreground text-xs min-w-[60px]">{t('passLabel')}</span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="text-foreground font-mono">{showPassword ? cred.password : '••••••••'}</span>
                <button onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }} className="p-1.5 hover:bg-warning/20 rounded-lg transition-colors">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 text-warning" /> : <Eye className="w-3.5 h-3.5 text-warning" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(cred.password); }} className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors">
                  <Copy className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
            {cred.host && (
              <div className={cn(
                "flex items-center justify-between gap-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors",
                layout === 'compact' ? "p-1.5" : "p-2.5"
              )}>
                <span className="text-muted-foreground text-xs min-w-[60px]">{t('hostLabel')}</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="text-foreground truncate max-w-[180px]">{cred.host}</span>
                  <button onClick={(e) => { e.stopPropagation(); copyToClipboard(cred.host!); }} className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors">
                    <Copy className="w-3.5 h-3.5 text-primary" />
                  </button>
                </div>
              </div>
            )}
            {cred.url && (
              <div className={cn(
                "flex items-center justify-between gap-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors",
                layout === 'compact' ? "p-1.5" : "p-2.5"
              )}>
                <span className="text-muted-foreground text-xs min-w-[60px]">{t('urlLabel')}</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[150px]" onClick={(e) => e.stopPropagation()}>
                    {cred.url}
                  </a>
                  <button onClick={(e) => { e.stopPropagation(); copyToClipboard(cred.url!); }} className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors">
                    <Copy className="w-3.5 h-3.5 text-primary" />
                  </button>
                </div>
              </div>
            )}
            {/* Optional Description Section for Credentials */}
            {(message.description || isAddingDescription) ? (
              <div className="mt-3 pt-3 border-t border-accent/10 bg-accent/5 rounded-xl p-3 relative group/desc">
                {isAddingDescription ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      ref={descriptionRef}
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdateDescription();
                        }
                      }}
                      placeholder={language === 'ar' ? 'أضف ملاحظة فرعية للبيانات...' : 'Add a sub-note for credentials...'}
                      className="w-full bg-card border border-accent/30 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsAddingDescription(false); }}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateDescription(); }}
                        className="p-1.5 bg-accent/20 hover:bg-accent/30 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 text-accent" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <p className="text-xs text-accent/70 mb-1 font-medium">{language === 'ar' ? 'ملاحظة إضافية:' : 'Additional Note:'}</p>
                    <p 
                      className="text-sm text-foreground/90 leading-relaxed italic cursor-pointer select-none"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                    >
                      {message.description}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                      className="absolute top-0 end-0 p-1 opacity-0 group-hover/desc:opacity-100 hover:bg-accent/10 rounded transition-all"
                    >
                      <Plus className="w-3 h-3 text-accent" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTempDescription('');
                  setIsAddingDescription(true);
                }}
                className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
              >
                <Plus className="w-3 h-3" />
                <span>{language === 'ar' ? 'أضف وصفاً/ملاحظة فرعية' : 'Add description/sub-note'}</span>
              </button>
            )}
          </div>
        );
      }
      case 'links': {
        return (
          <div className="space-y-2">
            {message.links?.map((link, index) => {
              let faviconUrl: string | undefined;
              try {
                const urlObj = new URL(link.url);
                faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
              } catch {
                faviconUrl = undefined;
              }
              return (
                <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className={cn(
                  "flex items-center gap-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-all group active:scale-[0.98]",
                  layout === 'compact' ? "p-1.5 gap-2" : "p-3 gap-3"
                )}>
                  <div className={cn(
                    "rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors overflow-hidden",
                    layout === 'compact' ? "w-8 h-8" : "w-10 h-10"
                  )}>
                    {faviconUrl ? (
                      <img src={faviconUrl} alt="" className="w-6 h-6 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('fallback-icon'); }} />
                    ) : (
                      <ExternalLink className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium truncate text-sm">{link.title || link.url}</p>
                    {link.title && <p className="text-xs text-muted-foreground truncate">{link.url}</p>}
                  </div>
                </a>
              );
            })}
            {/* Optional Description Section for Links */}
            {(message.description || isAddingDescription) ? (
              <div className="mt-3 pt-3 border-t border-primary/10 bg-primary/5 rounded-xl p-3 relative group/desc animate-fade-in">
                {isAddingDescription ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      ref={descriptionRef}
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdateDescription();
                        }
                      }}
                      placeholder={language === 'ar' ? 'أضف ملاحظة فرعية للروابط...' : 'Add a sub-note for links...'}
                      className="w-full bg-card border border-primary/30 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsAddingDescription(false); }}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateDescription(); }}
                        className="p-1.5 bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <p className="text-xs text-primary/70 mb-1 font-medium">{language === 'ar' ? 'ملاحظة إضافية:' : 'Additional Note:'}</p>
                    <p 
                      className="text-sm text-foreground/90 leading-relaxed italic cursor-pointer select-none"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                    >
                      {message.description}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                      className="absolute top-0 end-0 p-1 opacity-0 group-hover/desc:opacity-100 hover:bg-primary/10 rounded transition-all"
                    >
                      <Plus className="w-3 h-3 text-primary" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTempDescription('');
                  setIsAddingDescription(true);
                }}
                className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
              >
                <Plus className="w-3 h-3" />
                <span>{language === 'ar' ? 'أضف وصفاً/ملاحظة فرعية' : 'Add description/sub-note'}</span>
              </button>
            )}
          </div>
        );
      }
      case 'code': {
        const codeData = message.codeData;
        if (!codeData) return null;
        return (
          <div className="space-y-3">
            <div className="relative group/code">
              <div className="absolute top-2 end-2 flex gap-2 z-10">
                <LanguageSelector language={codeData.language || 'javascript'} messageId={message.id!} codeData={codeData} onUpdate={onUpdate} />
                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(codeData.code); }} className="p-1.5 bg-muted/80 hover:bg-muted rounded-md transition-colors">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <div 
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setTempDescription(message.description || '');
                  setIsAddingDescription(true);
                }}
                className="pt-8 border border-info/20 rounded-xl overflow-hidden bg-[#0d1117]">
                <CodeHighlight code={codeData.code} language={codeData.language || 'text'} />
              </div>
            </div>
            {codeData.explanation && (
              <div className="p-3 rounded-xl bg-info/5 border border-info/20">
                <p className="text-xs text-muted-foreground mb-1">{t('explanation')}</p>
                <p className="text-sm text-foreground">{codeData.explanation}</p>
              </div>
            )}
            {codeData.tags && codeData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {codeData.tags.map((tag, index) => (
                  <span key={index} className="px-2.5 py-1 text-xs font-medium bg-info/10 text-info rounded-lg">#{tag}</span>
                ))}
              </div>
            )}
            {/* Optional Description Section for Code */}
            {(message.description || isAddingDescription) ? (
              <div className="mt-3 pt-3 border-t border-info/10 bg-info/5 rounded-xl p-3 relative group/desc">
                {isAddingDescription ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      ref={descriptionRef}
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdateDescription();
                        }
                      }}
                      placeholder={language === 'ar' ? 'أضف ملاحظة فرعية للكود...' : 'Add a sub-note for code...'}
                      className="w-full bg-card border border-info/30 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-info"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsAddingDescription(false); }}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateDescription(); }}
                        className="p-1.5 bg-info/20 hover:bg-info/30 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 text-info" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <p className="text-xs text-info/70 mb-1 font-medium">{language === 'ar' ? 'ملاحظة إضافية:' : 'Additional Note:'}</p>
                    <p 
                      className="text-sm text-foreground/90 leading-relaxed italic cursor-pointer select-none"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                    >
                      {message.description}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                      className="absolute top-0 end-0 p-1 opacity-0 group-hover/desc:opacity-100 hover:bg-info/10 rounded transition-all"
                    >
                      <Plus className="w-3 h-3 text-info" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTempDescription('');
                  setIsAddingDescription(true);
                }}
                className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-info transition-colors opacity-0 group-hover:opacity-100"
              >
                <Plus className="w-3 h-3" />
                <span>{language === 'ar' ? 'أضف وصفاً/ملاحظة فرعية' : 'Add description/sub-note'}</span>
              </button>
            )}
          </div>
        );
      }
      case 'audio':
      case 'voice': {
        return (
          <div className="space-y-3 bg-pink-500/5 dark:bg-pink-500/10 p-4 rounded-2xl border border-pink-500/20 shadow-none !important">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                {message.type === 'audio' ? <Music className="w-5 h-5 text-pink-400" /> : <Mic className="w-5 h-5 text-rose-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.content}</p>
                <div className="h-1.5 w-full bg-pink-500/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full w-1/3 bg-pink-400 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-pink-400/60 font-mono">
              <span>0:00</span>
              <span>--:--</span>
            </div>
          </div>
        );
      }
      case 'location': {
        return (
          <div className="space-y-3 bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 shadow-none !important">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{message.content}</p>
              </div>
            </div>
            {message.description && (
              <p className="text-xs text-muted-foreground italic border-t border-emerald-500/10 pt-2">
                {message.description}
              </p>
            )}
          </div>
        );
      }
      case 'file': {
        const fileData = message.fileData;
        if (!fileData) return null;
        const isTextFile = fileData.type === 'text/plain' || fileData.name.endsWith('.txt') || fileData.type === 'text/csv';
        const downloadFile = () => {
          const link = document.createElement('a');
          if (isTextFile) {
            const blob = new Blob([fileData.content], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
          } else {
            link.href = fileData.content;
          }
          link.download = fileData.name;
          link.click();
        };
        return (
          <div className="space-y-3">
            <div className={cn(
              "flex items-center gap-3 rounded-xl bg-purple-500/5 border border-purple-500/20",
              layout === 'compact' ? "p-1.5 gap-2" : "p-3 gap-3"
            )}>
              <div className={cn(
                "rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0",
                layout === 'compact' ? "w-8 h-8" : "w-10 h-10"
              )}>
                <File className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium truncate text-sm">{fileData.name}</p>
                <p className="text-xs text-muted-foreground">{(fileData.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={downloadFile} className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors">
                <Download className="w-4 h-4 text-purple-400" />
              </button>
            </div>
            {isTextFile && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border max-h-48 overflow-y-auto">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {fileData.content.length > 2000 ? fileData.content.slice(0, 2000) + '...' : fileData.content}
                </pre>
              </div>
            )}
            {/* Optional Description Section for Files */}
            {(message.description || isAddingDescription) ? (
              <div className="mt-3 pt-3 border-t border-purple-500/10 bg-purple-500/5 rounded-xl p-3 relative group/desc animate-fade-in">
                {isAddingDescription ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      ref={descriptionRef}
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleUpdateDescription();
                        }
                      }}
                      placeholder={language === 'ar' ? 'أضف ملاحظة فرعية للملف...' : 'Add a sub-note for file...'}
                      className="w-full bg-card border border-purple-500/30 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsAddingDescription(false); }}
                        className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUpdateDescription(); }}
                        className="p-1.5 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4 text-purple-400" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <p className="text-xs text-purple-400/70 mb-1 font-medium">{language === 'ar' ? 'ملاحظة إضافية:' : 'Additional Note:'}</p>
                    <p className="text-sm text-foreground/90 leading-relaxed italic">
                      {message.description}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTempDescription(message.description || '');
                        setIsAddingDescription(true);
                      }}
                      className="absolute top-0 end-0 p-1 opacity-0 group-hover/desc:opacity-100 hover:bg-purple-500/10 rounded transition-all"
                    >
                      <Plus className="w-3 h-3 text-purple-400" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTempDescription('');
                  setIsAddingDescription(true);
                }}
                className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Plus className="w-3 h-3" />
                <span>{language === 'ar' ? 'أضف وصفاً/ملاحظة فرعية' : 'Add description/sub-note'}</span>
              </button>
            )}
          </div>
        );
      }
      case 'audio':
      case 'voice': {
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center bg-white/10",
                message.type === 'audio' ? "text-pink-400" : "text-rose-400"
              )}>
                {message.type === 'audio' ? <Music className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium truncate">
                  {message.content || (language === 'ar' ? 'ملف صوتي' : 'Audio file')}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-current opacity-50" />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">0:00 / 0:00</span>
                </div>
              </div>
            </div>
            {message.description && (
              <p className="text-sm text-muted-foreground italic px-2">
                {message.description}
              </p>
            )}
          </div>
        );
      }
      case 'location': {
        return (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 min-h-[100px] bg-emerald-500/5 flex flex-col items-center justify-center gap-2 p-4">
              <Database className="w-8 h-8 text-emerald-400 opacity-50" />
              <p className="text-sm text-emerald-400/70 font-medium text-center">
                {message.content || (language === 'ar' ? 'بيانات إضافية' : 'Additional Data')}
              </p>
            </div>
            {message.description && (
              <p className="text-sm text-muted-foreground italic px-2">
                {message.description}
              </p>
            )}
          </div>
        );
      }
      default: return null;
    }
  };

  return (
    <div 
      data-card-type={message.type}
      data-card-id={message.id}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).setAttribute('data-active-card', 'true');
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).removeAttribute('data-active-card');
      }}
      className={cn(
        "group relative glass-panel rounded-2xl p-4 md:p-6 transition-none",
        getBorderColor(),
        isResizing && "cursor-ns-resize select-none",
        "shadow-none hover:shadow-none !important",
        "cursor-pointer pointer-events-auto relative z-[10]",
        message.color === 'red' && "bg-red-500/10 border-red-500/50",
        message.color === 'orange' && "bg-orange-500/10 border-orange-500/50",
        message.color === 'yellow' && "bg-yellow-500/10 border-yellow-500/50",
        message.color === 'green' && "bg-green-500/10 border-green-500/50",
        message.color === 'emerald' && "bg-emerald-500/10 border-emerald-500/50",
        message.color === 'teal' && "bg-teal-500/10 border-teal-500/50",
        message.color === 'blue' && "bg-blue-500/10 border-blue-500/50",
        message.color === 'indigo' && "bg-indigo-500/10 border-indigo-500/50",
        message.color === 'purple' && "bg-purple-500/10 border-purple-500/50",
        message.color === 'pink' && "bg-pink-500/10 border-pink-500/50",
        message.color === 'rose' && "bg-rose-500/10 border-rose-500/50",
        message.color === 'slate' && "bg-slate-500/10 border-slate-500/50",
        message.color === 'cyan' && "bg-cyan-500/10 border-cyan-500/50",
        message.color === 'amber' && "bg-amber-500/10 border-amber-500/50"
      )}
      onClick={handleCardClick}
    >
      <div className={cn(
        "absolute top-0 left-0 w-1.5 h-full opacity-100",
        (!message.color || message.color === 'none') ? (
          message.type === 'note' ? "bg-success" :
          message.type === 'tasks' ? "bg-warning" :
          message.type === 'credentials' ? "bg-accent" :
          message.type === 'links' ? "bg-primary" :
          message.type === 'code' ? "bg-info" :
          message.type === 'file' ? "bg-purple-500" :
          message.type === 'audio' ? "bg-pink-400" :
          message.type === 'voice' ? "bg-rose-400" :
          message.type === 'location' ? "bg-emerald-400" : ""
        ) : (
          message.color === 'red' ? "bg-red-500" :
          message.color === 'orange' ? "bg-orange-500" :
          message.color === 'yellow' ? "bg-yellow-500" :
          message.color === 'green' ? "bg-green-500" :
          message.color === 'emerald' ? "bg-emerald-500" :
          message.color === 'teal' ? "bg-teal-500" :
          message.color === 'blue' ? "bg-blue-500" :
          message.color === 'indigo' ? "bg-indigo-500" :
          message.color === 'purple' ? "bg-purple-500" :
          message.color === 'pink' ? "bg-pink-500" :
          message.color === 'rose' ? "bg-rose-500" :
          message.color === 'slate' ? "bg-slate-500" :
          message.color === 'cyan' ? "bg-cyan-500" :
          message.color === 'amber' ? "bg-amber-500" : ""
        )
      )} />

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("pointer-events-auto z-[11]",
            "w-8 h-8 rounded-lg flex items-center justify-center",
            message.type === 'note' && "bg-success/10",
            message.type === 'tasks' && "bg-warning/10",
            message.type === 'credentials' && "bg-accent/10",
            message.type === 'audio' && "bg-pink-500/10",
            message.type === 'voice' && "bg-rose-500/10",
            message.type === 'location' && "bg-emerald-500/10",
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
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 relative z-20 pointer-events-auto">
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
              className={cn(
                "p-2 rounded-xl transition-all opacity-50 group-hover:opacity-100 hover:bg-muted",
                showColorPicker && "opacity-100 bg-muted"
              )}
              title={t('color') || 'اللون'}
            >
              <Palette className="w-4 h-4" />
            </button>
            {showColorPicker && (
              <div className="absolute top-full right-0 mt-2 p-3 bg-card border border-border rounded-2xl shadow-2xl z-50 grid grid-cols-4 gap-2 min-w-[140px]">
                {['none', 'red', 'orange', 'yellow', 'green', 'emerald', 'teal', 'blue', 'indigo', 'purple', 'pink', 'rose', 'slate'].map((color) => (
                  <button
                    key={color}
                    onClick={(e) => { e.stopPropagation(); handleSetColor(color as any); }}
                    className={cn(
                      "w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-125",
                      color === 'none' && "bg-transparent flex items-center justify-center",
                      color === 'red' && "bg-red-500",
                      color === 'orange' && "bg-orange-500",
                      color === 'yellow' && "bg-yellow-500",
                      color === 'green' && "bg-green-500",
                      color === 'emerald' && "bg-emerald-500",
                      color === 'teal' && "bg-teal-500",
                      color === 'blue' && "bg-blue-500",
                      color === 'indigo' && "bg-indigo-500",
                      color === 'purple' && "bg-purple-500",
                      color === 'pink' && "bg-pink-500",
                      color === 'rose' && "bg-rose-500",
                      color === 'slate' && "bg-slate-500"
                    )}
                  >
                    {color === 'none' && <X className="w-3 h-3 text-muted-foreground" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleTogglePin}
            className={cn(
              "p-2 rounded-xl transition-all opacity-50 group-hover:opacity-100 hover:bg-muted",
              message.pinned && "opacity-100 text-warning"
            )}
            title={message.pinned ? t('unpin') || 'إلغاء التثبيت' : t('pin') || 'تثبيت'}
          >
            {message.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(message.id!); }}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-50 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {renderContent()}
      {selectedImage && (
        <ImagePreviewModal image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
};

const ImagePreviewModal: React.FC<{ image: string; onClose: () => void }> = ({ image, onClose }) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full">
          <X className="w-6 h-6" />
        </button>
        <img src={image} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl cursor-pointer" onClick={onClose} />
        <p className="text-center text-white/60 text-sm mt-3">اضغط ESC أو انقر للإغلاق</p>
      </div>
    </div>
  );
};

export default MessageCard;
