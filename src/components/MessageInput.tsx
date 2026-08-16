import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, FileText, CheckSquare, Key, Link2, Code, Loader2, File, Upload, Image, X, Mic, Music, MapPin } from 'lucide-react';
import { MessageType } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface MessageInputProps {
  onSend: (type: MessageType, content: string, file?: { name: string; type: string; size: number; content: string }, images?: string[]) => Promise<void>;
  loading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, loading }) => {
  const [type, setType] = useState<MessageType>('note');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; size: number; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { t, isRTL } = useLanguage();

  // Handle paste for images
  const handleImagePaste = useCallback((e: ClipboardEvent) => {
    if (type !== 'note') return;
    
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (base64) {
               setImages(prev => [...prev, base64]);
               // Toast removed to avoid distraction
             }
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  }, [type]);

  useEffect(() => {
    document.addEventListener('paste', handleImagePaste);
    return () => document.removeEventListener('paste', handleImagePaste);
  }, [handleImagePaste]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          if (base64) {
            setImages(prev => [...prev, base64]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const typeConfig = {
    note: { icon: FileText, label: t('notes'), color: 'text-success', bgColor: 'bg-success/20', borderColor: 'border-success/30' },
    tasks: { icon: CheckSquare, label: t('tasks'), color: 'text-warning', bgColor: 'bg-warning/20', borderColor: 'border-warning/30' },
    credentials: { icon: Key, label: t('credentials'), color: 'text-accent', bgColor: 'bg-accent/20', borderColor: 'border-accent/30' },
    links: { icon: Link2, label: t('links'), color: 'text-primary', bgColor: 'bg-primary/20', borderColor: 'border-primary/30' },
    code: { icon: Code, label: t('code'), color: 'text-info', bgColor: 'bg-info/20', borderColor: 'border-info/30' },
    file: { icon: File, label: t('file') || 'ملف', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30' },
    audio: { icon: Music, label: isRTL ? 'صوت' : 'Audio', color: 'text-pink-400', bgColor: 'bg-pink-500/20', borderColor: 'border-pink-500/30' },
    voice: { icon: Mic, label: isRTL ? 'بصمة' : 'Voice', color: 'text-rose-400', bgColor: 'bg-rose-500/20', borderColor: 'border-rose-500/30' },
    location: { icon: MapPin, label: isRTL ? 'موقع' : 'Location', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/30' },
  };

  const config = typeConfig[type];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const allowedTypes = [
      'text/plain', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      return;
    }
    
    const reader = new FileReader();
    
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.type === 'text/csv') {
      reader.onload = (event) => {
        setSelectedFile({
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content: event.target?.result as string
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        setSelectedFile({
          name: file.name,
          type: file.type,
          size: file.size,
          content: event.target?.result as string // base64
        });
      };
      reader.readAsDataURL(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (type === 'file' && selectedFile) {
      await onSend(type, selectedFile.name, selectedFile);
      setSelectedFile(null);
    } else if ((content.trim() || images.length > 0) && !loading) {
      await onSend(type, content, undefined, type === 'note' ? images : undefined);
      setContent('');
      setImages([]);
    }
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
      case 'note': return t('addNote');
      case 'tasks': return t('addTasks');
      case 'credentials': return t('addCredentials');
      case 'links': return t('addLinks');
      case 'code': return t('addCode');
      case 'audio': return isRTL ? 'أضف رابط صوتي أو مسار...' : 'Add audio link or path...';
      case 'voice': return isRTL ? 'أضف ملاحظة صوتية...' : 'Add voice note...';
      case 'location': return isRTL ? 'أضف إحداثيات أو اسم الموقع...' : 'Add coordinates or location name...';
      default: return '';
    }
  };

  return (
    <div className="border-t border-white/5 bg-[#0A0A0B]/80 p-4 md:p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.8)] relative z-[150] rounded-t-[2.5rem] backdrop-blur-3xl">
      <div className="max-w-4xl mx-auto">
        {/* Type Selector - Horizontal Pills */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1 relative z-[151]">
          {(Object.entries(typeConfig) as [MessageType, typeof config][]).map(([key, cfg]) => {
            const TypeIcon = cfg.icon;
            const isActive = type === key;
            return (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setType(key);
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm whitespace-nowrap transition-all border pointer-events-auto relative z-[152]",
                  isActive 
                    ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} shadow-lg shadow-primary/10` 
                    : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10"
                )}
              >
                <TypeIcon className="w-4 h-4" />
                <span className="font-medium">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Area - Textarea with Send Button aligned */}
        <div className={cn("flex gap-3 items-stretch relative z-[151]", isRTL && "flex-row-reverse")}>
          {type === 'file' ? (
            <div className="flex-1 flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.doc,.docx,.xls,.xlsx,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 bg-white/5 border-2 border-dashed rounded-2xl px-4 py-6 text-foreground transition-all hover:bg-white/10",
                  config.borderColor
                )}
              >
                <Upload className="w-6 h-6 text-purple-400" />
                <span className="text-muted-foreground">{t('chooseFile')}</span>
              </button>
              {selectedFile && (
                <div className="flex items-center gap-2 p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <File className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-foreground flex-1 truncate">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-2">
              {/* Image Previews for Notes */}
              {type === 'note' && images.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={img} 
                        alt={`Preview ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 p-1 bg-destructive/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3 items-stretch relative z-[151]">
                {type === 'note' && (
                  <>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="px-3 rounded-2xl bg-success/10 text-success hover:bg-success/20 transition-all flex items-center justify-center"
                      title={t('addImageTooltip')}
                    >
                      <Image className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={getPlaceholder()}
                  rows={type === 'tasks' ? 5 : type === 'code' ? 8 : type === 'credentials' ? 4 : 2}
                  dir="auto"
                  className={cn(
                    "flex-1 bg-white/[0.02] border-2 rounded-[1.5rem] px-5 py-4 text-foreground placeholder:text-muted-foreground/30 resize-none transition-all focus:outline-none text-lg pointer-events-auto relative z-[151]",
                    config.borderColor,
                    "focus:ring-4 focus:ring-primary/5 shadow-2xl focus:bg-white/[0.05]",
                    type === 'code' && "font-mono text-sm",
                    (type === 'tasks' || type === 'code' || type === 'credentials') && "min-h-[150px]"
                  )}
                />
              </div>
            </div>
          )}

          {/* Send Button - Aligned to match textarea height */}
          <button
            onClick={handleSend}
            disabled={loading || (type === 'file' ? !selectedFile : (!content.trim() && images.length === 0))}
            className={cn(
              "px-6 rounded-[1.5rem] transition-all flex items-center justify-center flex-shrink-0 active:scale-95 relative z-[151] pointer-events-auto",
              (type === 'file' ? selectedFile : (content.trim() || images.length > 0))
                ? "gradient-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20" 
                : "bg-white/5 text-muted-foreground border border-white/5"
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
