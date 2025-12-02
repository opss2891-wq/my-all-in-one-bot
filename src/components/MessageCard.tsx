import React, { useState } from 'react';
import { Trash2, Copy, FileText, CheckSquare, Square, Key, Link2, Code, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Message, updateMessage } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { playTaskSound, playCopySound } from '@/hooks/useSound';
import HighlightText from './HighlightText';
import CodeHighlight from './CodeHighlight';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, language } = useLanguage();

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
    }
  };

  const getTypeLabel = () => {
    switch (message.type) {
      case 'note': return t('note');
      case 'tasks': return t('tasks');
      case 'credentials': return t('credentials');
      case 'links': return t('links');
      case 'code': return t('code');
    }
  };

  const getBorderColor = () => {
    switch (message.type) {
      case 'note': return 'border-success/30 hover:border-success/50';
      case 'tasks': return 'border-warning/30 hover:border-warning/50';
      case 'credentials': return 'border-accent/30 hover:border-accent/50';
      case 'links': return 'border-primary/30 hover:border-primary/50';
      case 'code': return 'border-info/30 hover:border-info/50';
    }
  };

  const renderContent = () => {
    switch (message.type) {
      case 'note':
        const noteIsArabic = isArabicText(message.content || '');
        return (
          <div 
            className="cursor-pointer active:scale-[0.99] transition-transform"
            style={{ textAlign: noteIsArabic ? 'right' : 'left', direction: noteIsArabic ? 'rtl' : 'ltr' }}
          >
            <HighlightText 
              text={message.content || ''} 
              searchQuery={searchQuery}
              className="text-foreground whitespace-pre-wrap block text-sm md:text-base leading-relaxed"
            />
          </div>
        );

      case 'tasks':
        const completedCount = message.tasks?.filter(t => t.completed).length || 0;
        const totalCount = message.tasks?.length || 0;
        const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-success/70 to-success transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-medium tabular-nums">{completedCount}/{totalCount}</span>
            </div>
            {message.tasks?.map((task, index) => (
              <div
                key={index}
                onClick={() => handleToggleTask(index)}
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
          </div>
        );

      case 'credentials':
        const cred = message.credential;
        if (!cred) return null;
        return (
          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
              <span className="text-muted-foreground text-xs">{t('username')}</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground truncate max-w-[150px] md:max-w-[200px]">{cred.username}</span>
                <button 
                  onClick={() => copyToClipboard(cred.username, t('username'))} 
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
              <span className="text-muted-foreground text-xs">{t('password')}</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-mono">
                  {showPassword ? cred.password : '••••••••'}
                </span>
                <button 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
                <button 
                  onClick={() => copyToClipboard(cred.password, t('password'))} 
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            {cred.host && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                <span className="text-muted-foreground text-xs">{t('host')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground truncate max-w-[150px] md:max-w-[200px]">{cred.host}</span>
                  <button 
                    onClick={() => copyToClipboard(cred.host!, t('host'))} 
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}
            {cred.url && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50">
                <span className="text-muted-foreground text-xs">URL</span>
                <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[180px]">
                  {cred.url}
                </a>
              </div>
            )}
            <div className="pt-1">
              <span className="text-xs px-3 py-1.5 rounded-full bg-accent/20 text-accent font-medium">
                {cred.credType?.toUpperCase() || 'OTHER'}
              </span>
            </div>
          </div>
        );

      case 'links':
        return (
          <div className="space-y-2">
            {message.links?.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-all group active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate text-sm">{link.title || link.url}</p>
                  {link.title && (
                    <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                  )}
                </div>
              </a>
            ))}
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
                <span className="px-2 py-1 text-[10px] font-mono bg-info/20 text-info rounded-md uppercase">
                  {codeData.language || 'text'}
                </span>
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
    </div>
  );
};

export default MessageCard;
