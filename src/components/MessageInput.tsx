import React, { useState } from 'react';
import { Send, FileText, CheckSquare, Key, Link2, Code, Loader2 } from 'lucide-react';
import { MessageType } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface MessageInputProps {
  onSend: (type: MessageType, content: string) => Promise<void>;
  loading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, loading }) => {
  const [type, setType] = useState<MessageType>('note');
  const [content, setContent] = useState('');
  const { t, isRTL } = useLanguage();

  const typeConfig = {
    note: { icon: FileText, label: t('notes'), color: 'text-success', bgColor: 'bg-success/20', borderColor: 'border-success/30' },
    tasks: { icon: CheckSquare, label: t('tasks'), color: 'text-warning', bgColor: 'bg-warning/20', borderColor: 'border-warning/30' },
    credentials: { icon: Key, label: t('credentials'), color: 'text-accent', bgColor: 'bg-accent/20', borderColor: 'border-accent/30' },
    links: { icon: Link2, label: t('links'), color: 'text-primary', bgColor: 'bg-primary/20', borderColor: 'border-primary/30' },
    code: { icon: Code, label: t('code'), color: 'text-info', bgColor: 'bg-info/20', borderColor: 'border-info/30' },
  };

  const config = typeConfig[type];

  const handleSend = async () => {
    if (!content.trim() || loading) return;
    await onSend(type, content);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // For tasks, Shift+Enter sends, Enter creates new line
    // For others, Enter sends
    if (type === 'tasks') {
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
      // Normal Enter allows new lines in tasks
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'note':
        return t('addNote');
      case 'tasks':
        return t('addTasks');
      case 'credentials':
        return t('addCredentials');
      case 'links':
        return t('addLinks');
      case 'code':
        return t('addCode');
    }
  };

  return (
    <div className="border-t border-border bg-card/95 backdrop-blur-md p-3 md:p-4">
      <div className="max-w-3xl mx-auto">
        {/* Type Selector - Horizontal Pills */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
          {(Object.entries(typeConfig) as [MessageType, typeof config][]).map(([key, cfg]) => {
            const TypeIcon = cfg.icon;
            const isActive = type === key;
            return (
              <button
                key={key}
                onClick={() => setType(key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-all border",
                  isActive 
                    ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor}` 
                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                )}
              >
                <TypeIcon className="w-4 h-4" />
                <span className="font-medium">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Area - Textarea with Send Button aligned */}
        <div className={cn("flex gap-3 items-stretch", isRTL && "flex-row-reverse")}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            rows={2}
            dir="auto"
            className={cn(
              "flex-1 bg-secondary/80 border-2 rounded-2xl px-4 py-3 text-foreground placeholder:text-muted-foreground resize-none transition-all focus:outline-none min-h-[60px]",
              config.borderColor,
              "focus:ring-2 focus:ring-primary/20"
            )}
          />

          {/* Send Button - Aligned to match textarea height */}
          <button
            onClick={handleSend}
            disabled={loading || !content.trim()}
            className={cn(
              "px-5 rounded-2xl transition-all flex items-center justify-center flex-shrink-0",
              content.trim() 
                ? "gradient-primary text-primary-foreground hover:opacity-90 shadow-lg" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className={cn("w-5 h-5", isRTL && "rotate-180")} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
