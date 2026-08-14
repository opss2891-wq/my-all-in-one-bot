import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, FileText, CheckSquare, Key, Link2, Code, File } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Message, Conversation, searchAllMessages, getConversations, getArchivedConversations } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface GlobalSearchDialogProps {
  onSelectMessage: (conversationId: string) => void;
}

const GlobalSearchDialog: React.FC<GlobalSearchDialogProps> = ({ onSelectMessage }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    const loadConversations = async () => {
      const [convs, archived] = await Promise.all([
        getConversations(user!.uid),
        getArchivedConversations(user!.uid)
      ]);
      setConversations([...convs, ...archived]);
    };
    if (open) loadConversations();
  }, [open]);

  useEffect(() => {
    const searchDebounced = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const data = await searchAllMessages(user!.uid, query);
          setResults(data);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(searchDebounced);
  }, [query]);

  const getConversationTitle = (conversationId?: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    return conv?.title || 'Unknown';
  };

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'note': return FileText;
      case 'tasks': return CheckSquare;
      case 'credentials': return Key;
      case 'links': return Link2;
      case 'code': return Code;
      case 'file': return File;
      default: return FileText;
    }
  };

  const getMessagePreview = (message: Message) => {
    switch (message.type) {
      case 'note':
        return message.content?.slice(0, 100) || '';
      case 'tasks':
        return message.tasks?.map(t => t.text).join(', ').slice(0, 100) || '';
      case 'credentials':
        return `${message.credential?.username}@${message.credential?.host || message.credential?.url || ''}`;
      case 'links':
        return message.links?.map(l => l.title).join(', ').slice(0, 100) || '';
      case 'code':
        return message.codeData?.explanation?.slice(0, 100) || message.codeData?.code?.slice(0, 100) || '';
      case 'file':
        return message.fileData?.name || '';
      default:
        return '';
    }
  };

  const handleSelect = (message: Message) => {
    if (message.conversationId) {
      onSelectMessage(message.conversationId);
      setOpen(false);
      setQuery('');
      setResults([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-3 w-full rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-all font-medium">
          <Search className="w-5 h-5" />
          <span>{t('globalSearch')}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('globalSearch')}</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground",
            isRTL ? "right-3" : "left-3"
          )} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchAll')}
            className={cn(
              "w-full py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50",
              isRTL ? "pr-11 pl-10" : "pl-11 pr-10"
            )}
            autoFocus
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); }}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded-lg transition-colors",
                isRTL ? "left-2" : "right-2"
              )}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : results.length === 0 && query.length >= 2 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('noResults')}</p>
            </div>
          ) : (
            results.map((message) => {
              const Icon = getMessageIcon(message.type);
              return (
                <button
                  key={message.id}
                  onClick={() => handleSelect(message)}
                  className="w-full text-start p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">
                        {getMessagePreview(message)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('foundIn')}: {getConversationTitle(message.conversationId)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearchDialog;
