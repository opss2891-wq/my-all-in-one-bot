import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, FileText, CheckSquare, Key, Link2, Code, Loader2, File, Upload, Image, X, Mic, Music, Database, Plus } from 'lucide-react';
import { MessageType, TaskItem, CredentialData, LinkItem, CodeData } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface MessageInputProps {
  onSend: (
    type: MessageType, 
    content: string, 
    file?: { name: string; type: string; size: number; content: string }, 
    images?: string[],
    tasks?: TaskItem[],
    credential?: CredentialData,
    links?: LinkItem[],
    codeData?: CodeData
  ) => Promise<void>;
  loading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, loading }) => {
  const [type, setType] = useState<MessageType>('note');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; size: number; content: string } | null>(null);
  const [tasks, setTasks] = useState<string[]>(['']);
  const [credential, setCredential] = useState<CredentialData>({
    username: '',
    password: '',
    host: '',
    url: '',
    credType: 'other'
  });
  const [links, setLinks] = useState<LinkItem[]>([{ title: '', url: '' }]);
  const [codeData, setCodeData] = useState<CodeData>({ code: '', language: 'javascript', explanation: '' });
  const [location, setLocation] = useState({ lat: '', lng: '', address: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { t, isRTL } = useLanguage();

  const [noteHeight, setNoteHeight] = useState<number | null>(null);

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
    location: { icon: Database, label: isRTL ? 'بيانات' : 'Data', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-500/30' },
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
    if (loading) return;

    try {
      if (type === 'file' && selectedFile) {
        await onSend(type, selectedFile.name, selectedFile);
        setSelectedFile(null);
      } else if (type === 'tasks') {
        const filteredTasks = tasks.filter(t => t.trim() !== '').map(t => ({ text: t, completed: false }));
        if (filteredTasks.length === 0) return;
        await onSend(type, filteredTasks[0].text, undefined, undefined, filteredTasks);
        setTasks(['']);
      } else if (type === 'credentials') {
        if (!credential.username && !credential.password) return;
        await onSend(type, credential.host || credential.username || 'Credential', undefined, undefined, undefined, credential);
        setCredential({ username: '', password: '', host: '', url: '', credType: 'other' });
      } else if (type === 'links') {
        const filteredLinks = links.filter(l => l.url.trim() !== '');
        if (filteredLinks.length === 0) return;
        await onSend(type, filteredLinks[0].title || filteredLinks[0].url, undefined, undefined, undefined, undefined, filteredLinks);
        setLinks([{ title: '', url: '' }]);
      } else if (type === 'code') {
        if (!codeData.code.trim()) return;
        await onSend(type, codeData.code.substring(0, 50), undefined, undefined, undefined, undefined, undefined, codeData);
        setCodeData({ code: '', language: 'javascript', explanation: '' });
      } else if (type === 'location') {
        if (!location.lat || !location.lng) return;
        const locContent = `${location.address || 'Location'}: ${location.lat}, ${location.lng}`;
        await onSend(type, locContent);
        setLocation({ lat: '', lng: '', address: '' });
      } else if ((content.trim() || images.length > 0)) {
        await onSend(type, content, undefined, type === 'note' ? images : undefined);
        setContent('');
        setImages([]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: isRTL ? 'خطأ في الإرسال' : 'Error sending', variant: 'destructive' });
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
    if (isRTL) {
      switch (type) {
        case 'note': return 'اكتب ملاحظة جديدة...';
        case 'tasks': return 'اكتب المهمة (السطر الأول هو العنوان)...';
        case 'credentials': return 'أضف بيانات اعتماد (اسم مستخدم، كلمة مرور)...';
        case 'links': return 'أضف رابطاً...';
        case 'code': return 'أضف كود برمجي...';
        case 'audio': return 'اكتب وصفاً للتسجيل أو رابط...';
        case 'voice': return 'سجل ملاحظة صوتية...';
        case 'location': return 'أضف بيانات إضافية أو ملاحظات...';
        default: return 'اكتب شيئاً...';
      }
    }
    switch (type) {
      case 'note': return t('addNote');
      case 'tasks': return t('addTasks');
      case 'credentials': return t('addCredentials');
      case 'links': return t('addLinks');
      case 'code': return t('addCode');
      case 'audio': return 'Add audio link or path...';
      case 'voice': return 'Add voice note...';
      case 'location': return 'Add additional data or notes...';
      default: return '';
    }
  };

  return (
    <div className="border-t border-white/5 bg-[#0A0A0B]/95 p-4 md:p-6 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.9)] relative z-[999] rounded-t-[2.5rem] backdrop-blur-3xl pointer-events-auto">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        {/* Type Selector - Horizontal Pills */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 -mx-1 px-1 relative z-[1001] pointer-events-auto scrollbar-hide">
          {(Object.entries(typeConfig) as [MessageType, typeof config][]).map(([key, cfg]) => {
            const TypeIcon = cfg.icon;
            const isActive = type === key;
            return (
              <button
                key={key}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setType(key);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] uppercase tracking-wider whitespace-nowrap transition-all border-2 pointer-events-auto relative z-[1002] font-black cursor-pointer",
                  isActive 
                    ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} shadow-xl shadow-primary/10 scale-105 -translate-y-0.5` 
                    : "bg-white/5 text-muted-foreground border-white/5 hover:bg-white/10 hover:border-white/10"
                )}
              >

                <TypeIcon className="w-4 h-4 pointer-events-none" />
                <span className="font-medium pointer-events-none">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Area - Conditional Forms based on Type */}
        <div className={cn("flex gap-3 items-stretch relative z-[1001] pointer-events-auto", isRTL && "flex-row-reverse")}>
          {type === 'file' ? (
            <div className="flex-1 flex flex-col gap-2 animate-fade-in">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex-1 flex items-center justify-center gap-3 bg-white/5 border-2 border-dashed rounded-2xl px-4 py-8 text-foreground transition-all hover:bg-white/10",
                  config.borderColor
                )}
              >
                <Upload className="w-8 h-8 text-purple-400" />
                <div className="flex flex-col items-start">
                  <span className="font-bold text-lg">{isRTL ? 'رفع ملف' : 'Upload File'}</span>
                  <span className="text-sm text-muted-foreground">{isRTL ? 'اختر ملفاً من جهازك' : 'Choose a file from your device'}</span>
                </div>
              </button>
              {selectedFile && (
                <div className="flex items-center gap-3 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <File className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-white/10 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : type === 'tasks' ? (
            <div className="flex-1 flex flex-col gap-3 animate-fade-in">
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-3 custom-scrollbar cyber-card-inner p-4">
                {tasks.map((task, idx) => (
                  <div key={idx} className="flex gap-2 items-center animate-fade-in group">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      idx === 0 ? "bg-warning" : "bg-warning/30"
                    )} />
                    <input
                      type="text"
                      value={task}
                      onChange={(e) => {
                        const newTasks = [...tasks];
                        newTasks[idx] = e.target.value;
                        setTasks(newTasks);
                      }}
                      placeholder={idx === 0 ? (isRTL ? 'عنوان القائمة...' : 'List title...') : (isRTL ? 'مهمة جديدة...' : 'New task...')}
                      className={cn(
                        "flex-1 cyber-form-input",
                        idx === 0 ? "font-bold text-lg border-warning/20" : "text-sm border-white/5"
                      )}
                    />
                    {tasks.length > 1 && (
                      <button 
                        onClick={() => setTasks(tasks.filter((_, i) => i !== idx))}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => setTasks([...tasks, ''])}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-warning/20 rounded-2xl text-warning hover:bg-warning/5 transition-all text-sm font-bold uppercase tracking-widest mt-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>{isRTL ? 'إضافة مهمة' : 'Add Task'}</span>
                </button>
              </div>
            </div>
          ) : type === 'credentials' ? (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
              <div className="cyber-card-inner p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-accent tracking-tighter ml-2">{isRTL ? 'المضيف' : 'HOST'}</label>
                  <input
                    type="text"
                    value={credential.host || ''}
                    onChange={(e) => setCredential({...credential, host: e.target.value})}
                    placeholder="example.com"
                    className="w-full cyber-form-input border-accent/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-accent tracking-tighter ml-2">{isRTL ? 'النوع' : 'TYPE'}</label>
                  <select
                    value={credential.credType}
                    onChange={(e) => setCredential({...credential, credType: e.target.value as any})}
                    className="w-full cyber-select border-accent/20 text-sm"
                  >
                    <option value="other">Other</option>
                    <option value="admin">Admin</option>
                    <option value="ftp">FTP</option>
                    <option value="ssh">SSH</option>
                    <option value="database">Database</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-accent tracking-tighter ml-2">{isRTL ? 'المستخدم' : 'USERNAME'}</label>
                  <input
                    type="text"
                    value={credential.username || ''}
                    onChange={(e) => setCredential({...credential, username: e.target.value})}
                    placeholder="admin"
                    className="w-full cyber-form-input border-accent/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-accent tracking-tighter ml-2">{isRTL ? 'كلمة المرور' : 'PASSWORD'}</label>
                  <input
                    type="password"
                    value={credential.password || ''}
                    onChange={(e) => setCredential({...credential, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full cyber-form-input border-accent/20"
                  />
                </div>
              </div>
            </div>
          ) : type === 'links' ? (
            <div className="flex-1 flex flex-col gap-3 animate-fade-in">
              <div className="cyber-card-inner p-4 space-y-4">
                {links.map((link, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 animate-fade-in group relative">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-primary tracking-tighter ml-2">{isRTL ? 'العنوان' : 'TITLE'}</label>
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => {
                          const newLinks = [...links];
                          newLinks[idx].title = e.target.value;
                          setLinks(newLinks);
                        }}
                        placeholder={isRTL ? 'عنوان الرابط...' : 'Link title...'}
                        className="w-full cyber-form-input border-primary/20"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-primary tracking-tighter ml-2">URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...links];
                            newLinks[idx].url = e.target.value;
                            setLinks(newLinks);
                          }}
                          placeholder="https://..."
                          className="flex-1 cyber-form-input border-primary/20"
                        />
                        {links.length > 1 && (
                          <button onClick={() => setLinks(links.filter((_, i) => i !== idx))} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => setLinks([...links, { title: '', url: '' }])} 
                  className="w-full py-3 border-2 border-dashed border-primary/20 rounded-2xl text-primary hover:bg-primary/5 transition-all text-sm font-bold uppercase tracking-widest"
                >
                  <Plus className="w-5 h-5 inline-block mr-2" />
                  <span>{isRTL ? 'إضافة رابط إضافي' : 'Add Another Link'}</span>
                </button>
              </div>
            </div>
          ) : type === 'code' ? (
            <div className="flex-1 flex flex-col gap-3 animate-fade-in">
              <div className="cyber-card-inner p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-info tracking-widest">{isRTL ? 'محرر الكود' : 'CODE EDITOR'}</label>
                  <select
                    value={codeData.language}
                    onChange={(e) => setCodeData({...codeData, language: e.target.value})}
                    className="cyber-select border-info/20 text-xs py-1.5 px-3 min-w-[120px]"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="sql">SQL</option>
                  </select>
                </div>
                <textarea
                  value={codeData.code}
                  onChange={(e) => setCodeData({...codeData, code: e.target.value})}
                  placeholder={isRTL ? '// الصق الكود هنا...' : '// Paste code here...'}
                  className="w-full bg-[#0f1115] border-2 border-info/10 rounded-2xl px-5 py-4 text-info font-mono text-sm focus:outline-none focus:border-info/30 min-h-[200px] resize-y shadow-inner"
                />
                <input
                  type="text"
                  value={codeData.explanation || ''}
                  onChange={(e) => setCodeData({...codeData, explanation: e.target.value})}
                  placeholder={isRTL ? 'شرح بسيط لما يفعله الكود...' : 'Brief explanation of what the code does...'}
                  className="w-full cyber-form-input border-info/20 text-sm"
                />
              </div>
            </div>
          ) : type === 'location' ? (
            <div className="flex-1 flex flex-col gap-3 animate-fade-in">
              <div className="cyber-card-inner p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest ml-2">{isRTL ? 'العنوان / المرجع' : 'TITLE / REFERENCE'}</label>
                  <input
                    type="text"
                    value={location.address}
                    onChange={(e) => setLocation({...location, address: e.target.value})}
                    placeholder={isRTL ? 'مثال: قاعدة بيانات المستخدمين...' : 'e.g. User Database...'}
                    className="w-full cyber-form-input border-emerald-400/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest ml-2">{isRTL ? 'البيانات' : 'DATA'}</label>
                  <textarea
                    value={location.lat}
                    onChange={(e) => setLocation({...location, lat: e.target.value})}
                    placeholder={isRTL ? 'أدخل البيانات الإضافية هنا بشكل مفصل...' : 'Enter detailed additional data here...'}
                    className="w-full cyber-form-input border-emerald-400/20 min-h-[120px] resize-y"
                  />
                </div>
              </div>
            </div>
          ) : type === 'audio' || type === 'voice' ? (
            <div className="flex-1 flex flex-col gap-3 animate-fade-in">
               <div className="flex items-center justify-center p-8 bg-rose-500/10 border-2 border-dashed border-rose-500/30 rounded-2xl">
                 <div className="flex flex-col items-center gap-4">
                   <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/20">
                     <Mic className="w-8 h-8 text-white" />
                   </div>
                   <div className="text-center">
                     <h4 className="font-bold text-lg text-rose-400">{isRTL ? 'تسجيل صوتي قيد التطوير' : 'Voice Recording Coming Soon'}</h4>
                     <p className="text-sm text-muted-foreground">{isRTL ? 'يمكنك حالياً إضافة وصف نصي للملاحظة الصوتية' : 'You can currently add a text description for the voice note'}</p>
                   </div>
                 </div>
               </div>
               <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={getPlaceholder()}
                className="flex-1 bg-white/5 border border-rose-500/30 rounded-xl px-4 py-3 text-foreground focus:outline-none min-h-[80px]"
              />
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
              
              <div className="flex gap-3 items-stretch relative z-[201]">
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
                  rows={2}
                  dir="auto"
                  className={cn(
                    "flex-1 bg-white/[0.02] border-2 rounded-[1.5rem] px-5 py-4 text-foreground placeholder:text-muted-foreground/30 resize-none transition-all focus:outline-none text-lg pointer-events-auto relative z-[201]",
                    config.borderColor,
                    "focus:ring-4 focus:ring-primary/5 shadow-2xl focus:bg-white/[0.05]"
                  )}
                />
              </div>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={loading}
            className={cn(
              "px-8 rounded-[1.8rem] transition-all flex items-center justify-center flex-shrink-0 active:scale-90 relative z-[201] pointer-events-auto group/send overflow-hidden",
              loading ? "opacity-50 cursor-not-allowed" : "gradient-primary text-primary-foreground hover:brightness-125 shadow-2xl shadow-primary/30 border-b-4 border-primary/50"
            )}
          >
            {loading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/send:translate-y-0 transition-transform duration-300" />
                <Send className={cn("w-7 h-7 relative z-10 transition-transform duration-500 group-hover/send:scale-110 group-hover/send:rotate-12", isRTL && "rotate-180 group-hover/send:-rotate-168")} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
