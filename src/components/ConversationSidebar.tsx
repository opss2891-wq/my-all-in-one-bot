import React, { useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Archive, 
  Trash2, 
  MoreVertical,
  ArchiveRestore,
  Edit2,
  Check,
  X,
  ChevronRight
} from 'lucide-react';
import { Conversation } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface ConversationSidebarProps {
  conversations: Conversation[];
  archivedConversations: Conversation[];
  currentConversationId: string | null;
  showArchived: boolean;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onArchiveConversation: (id: string) => void;
  onUnarchiveConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onToggleArchived: () => void;
  onClose?: () => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  archivedConversations,
  currentConversationId,
  showArchived,
  onSelectConversation,
  onCreateConversation,
  onArchiveConversation,
  onUnarchiveConversation,
  onDeleteConversation,
  onRenameConversation,
  onToggleArchived,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { t, isRTL, language } = useLanguage();

  const displayedConversations = showArchived ? archivedConversations : conversations;

  const startEditing = (conv: Conversation) => {
    setEditingId(conv.id!);
    setEditTitle(conv.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return t('today');
    if (days === 1) return t('yesterday');
    if (days < 7) return t('daysAgo', { n: days });
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  const CloseIcon = ChevronRight;

  return (
    <div className="h-full flex flex-col bg-card border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border safe-area-top">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-foreground flex-1">{t('conversations')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted transition-colors md:hidden"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={onCreateConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>{t('newConversation')}</span>
        </button>
      </div>

      {/* Toggle Archived */}
      <div className="px-3 py-2 border-b border-border">
        <button
          onClick={onToggleArchived}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all",
            showArchived 
              ? "bg-accent/20 text-accent" 
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <Archive className="w-5 h-5" />
          <span className="font-medium">{t('archive')}</span>
          <span className="ms-auto bg-muted px-2 py-0.5 rounded-full text-xs">
            {archivedConversations.length}
          </span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3">
        {displayedConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {showArchived ? t('noArchivedConversations') : t('noConversations')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedConversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                  currentConversationId === conv.id
                    ? "bg-primary/15 border border-primary/30"
                    : "hover:bg-muted/80 active:scale-[0.98]"
                )}
                onClick={() => !editingId && onSelectConversation(conv.id!)}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  currentConversationId === conv.id ? "bg-primary/20" : "bg-muted"
                )}>
                  <MessageSquare className={cn(
                    "w-5 h-5",
                    currentConversationId === conv.id ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                
                <div className="flex-1 min-w-0">
                  {editingId === conv.id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                      <button onClick={saveEdit} className="p-1.5 hover:bg-success/20 rounded-lg">
                        <Check className="w-4 h-4 text-success" />
                      </button>
                      <button onClick={cancelEdit} className="p-1.5 hover:bg-destructive/20 rounded-lg">
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate text-foreground">
                        {conv.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(conv.updatedAt)}
                      </p>
                    </>
                  )}
                </div>

                {!editingId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-card border-border">
                      <DropdownMenuItem onClick={() => startEditing(conv)} className="gap-2">
                        <Edit2 className="w-4 h-4" />
                        {t('rename')}
                      </DropdownMenuItem>
                      {showArchived ? (
                        <DropdownMenuItem onClick={() => onUnarchiveConversation(conv.id!)} className="gap-2">
                          <ArchiveRestore className="w-4 h-4" />
                          {t('unarchive')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onArchiveConversation(conv.id!)} className="gap-2">
                          <Archive className="w-4 h-4" />
                          {t('archive')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => onDeleteConversation(conv.id!)}
                        className="text-destructive focus:text-destructive gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar;
