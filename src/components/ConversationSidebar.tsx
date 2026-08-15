import React, { useState, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Search,
  Pin,
  PinOff,
  Palette,
  Tag,
  LogOut,
  LayoutList,
  LayoutGrid,
  Columns
} from 'lucide-react';
import { Conversation, ConversationColor } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUI } from '@/contexts/UIContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import GlobalSearchDialog from './GlobalSearchDialog';

const colorClasses: Record<ConversationColor, string> = {
  none: '',
  red: 'border-l-4 border-l-red-500',
  orange: 'border-l-4 border-l-orange-500',
  yellow: 'border-l-4 border-l-yellow-500',
  green: 'border-l-4 border-l-green-500',
  blue: 'border-l-4 border-l-blue-500',
  purple: 'border-l-4 border-l-purple-500',
  pink: 'border-l-4 border-l-pink-500',
};

const colorDots: Record<ConversationColor, string> = {
  none: 'bg-muted-foreground/30',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
};

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
  onPinConversation: (id: string) => void;
  onUnpinConversation: (id: string) => void;
  onSetColor: (id: string, color: ConversationColor) => void;
  onSetLabel: (id: string, label: string) => void;
  onToggleArchived: () => void;
  onClose?: () => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps & { className?: string }> = ({
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
  onPinConversation,
  onUnpinConversation,
  onSetColor,
  onSetLabel,
  onToggleArchived,
  onClose,
  className,
}) => {
  // Add a ref or ID to the main div
  const sidebarId = "conversation-sidebar";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [labelEditId, setLabelEditId] = useState<string | null>(null);
  const [labelValue, setLabelValue] = useState('');
  const { t, isRTL, language } = useLanguage();
  const { logout, user } = useAuth();
  const { layout, setLayout } = useUI();

  const colors: ConversationColor[] = ['none', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

  const baseConversations = showArchived ? archivedConversations : conversations;
  
  const displayedConversations = useMemo(() => {
    let filtered = baseConversations;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = baseConversations.filter(conv => 
        conv.title.toLowerCase().includes(query)
      );
    }
    // Sort: pinned first, then by updatedAt
    return [...filtered].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [baseConversations, searchQuery]);

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

  const CloseBtnIcon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <div id={sidebarId} className={cn(
      "h-full flex flex-col bg-card border-x border-border transition-all duration-300 relative",
      (editingId || labelEditId) ? "translate-x-0 opacity-100" : "group-[.dropdown-open]:translate-x-0 group-[.dropdown-open]:opacity-100",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border safe-area-top">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-foreground flex-1">{t('conversations')}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted transition-colors md:hidden"
          >
            <CloseBtnIcon className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={onCreateConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>{t('newConversation')}</span>
        </button>
        
        {/* Global Search */}
        <div className="mt-3">
          <GlobalSearchDialog onSelectMessage={onSelectConversation} />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
            isRTL ? "right-3" : "left-3"
          )} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchConversations')}
            className={cn(
              "w-full py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all",
              isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded-lg transition-colors",
                isRTL ? "left-2" : "right-2"
              )}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Toggle Archived */}
      <div className="px-3 py-2 border-b border-border">
        <button
          onClick={onToggleArchived}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all",
            showArchived 
              ? "bg-accent/20 text-accent" 
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <Archive className="w-4.5 h-4.5" />
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
          <div className={cn(
            "gap-2",
            layout === 'grid' ? "grid grid-cols-2" : "flex flex-col"
          )}>
            {displayedConversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group relative flex cursor-pointer transition-all border border-transparent",
                  layout === 'grid' 
                    ? "flex-col items-center text-center p-3 rounded-2xl" 
                    : layout === 'compact'
                      ? "items-center gap-2 p-1.5 rounded-lg"
                      : "items-center gap-3 p-3 rounded-xl",
                  currentConversationId === conv.id
                    ? "bg-primary/15 border-primary/30"
                    : "hover:bg-muted/80 active:scale-[0.98]",
                  conv.color && colorClasses[conv.color]
                )}
                onClick={() => !editingId && !labelEditId && onSelectConversation(conv.id!)}
              >
                <div id={sidebarId} className={cn(
                  "rounded-xl flex items-center justify-center flex-shrink-0 relative transition-all",
                  layout === 'grid' ? "w-12 h-12 mb-2" : layout === 'compact' ? "w-7 h-7" : "w-10 h-10",
                  currentConversationId === conv.id ? "bg-primary/20" : "bg-muted"
                )}>
                  <MessageSquare className={cn(
                    "transition-all",
                    layout === 'grid' ? "w-6 h-6" : layout === 'compact' ? "w-3.5 h-3.5" : "w-5 h-5",
                    currentConversationId === conv.id ? "text-primary" : "text-muted-foreground"
                  )} />
                  {conv.pinned && (
                    <Pin className="w-3 h-3 text-warning absolute -top-1 -right-1" />
                  )}
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
                  ) : labelEditId === conv.id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Input
                        value={labelValue}
                        onChange={(e) => setLabelValue(e.target.value)}
                        placeholder={t('setLabel')}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onSetLabel(conv.id!, labelValue);
                            setLabelEditId(null);
                            setLabelValue('');
                          }
                          if (e.key === 'Escape') {
                            setLabelEditId(null);
                            setLabelValue('');
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          onSetLabel(conv.id!, labelValue);
                          setLabelEditId(null);
                          setLabelValue('');
                        }} 
                        className="p-1.5 hover:bg-success/20 rounded-lg"
                      >
                        <Check className="w-4 h-4 text-success" />
                      </button>
                      <button 
                        onClick={() => {
                          setLabelEditId(null);
                          setLabelValue('');
                        }} 
                        className="p-1.5 hover:bg-destructive/20 rounded-lg"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={cn(
                        "font-medium truncate text-foreground",
                        layout === 'compact' ? "text-xs" : "text-sm",
                        conv.pinned && "flex items-center gap-1",
                        layout === 'grid' && "text-center w-full"
                      )}>
                        {conv.title}
                      </p>
                      {layout !== 'compact' && (
                        <div className={cn("flex items-center gap-2", layout === 'grid' && "justify-center")}>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(conv.updatedAt)}
                        </p>
                        {conv.label && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                            {conv.label}
                          </span>
                        )}
                      </div>
                      )}
                    </>
                  )}
                </div>

                {!editingId && !labelEditId && (
                  <DropdownMenu onOpenChange={(open) => {
                    // Prevent sidebar from closing when dropdown is open on mobile/responsive
                    if (open) {
                      // We can add a data attribute or class to the sidebar to indicate a dropdown is open
                      document.getElementById('conversation-sidebar')?.classList.add('dropdown-open');
                    } else {
                      document.getElementById('conversation-sidebar')?.classList.remove('dropdown-open');
                    }
                  }}>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <button className={cn(
                        "p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all",
                        layout === 'grid' && "absolute top-1 right-1 p-1"
                      )}>
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                      <DropdownMenuItem onSelect={() => startEditing(conv)} className="gap-2">
                        <Edit2 className="w-4 h-4" />
                        {t('rename')}
                      </DropdownMenuItem>
                      {conv.pinned ? (
                        <DropdownMenuItem onSelect={() => onUnpinConversation(conv.id!)} className="gap-2">
                          <PinOff className="w-4 h-4" />
                          {t('unpin')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => onPinConversation(conv.id!)} className="gap-2">
                          <Pin className="w-4 h-4" />
                          {t('pin')}
                        </DropdownMenuItem>
                      )}
                      
                      {/* Color submenu */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="gap-2">
                          <Palette className="w-4 h-4" />
                          {t('setColor')}
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="bg-card border-border">
                          {colors.map((color) => (
                            <DropdownMenuItem
                              key={color}
                              onSelect={(e) => {
                                e.preventDefault();
                                onSetColor(conv.id!, color);
                              }}
                              className="gap-2"
                            >
                              <span className={cn("w-4 h-4 rounded-full", colorDots[color])} />
                              {color === 'none' ? t('noColor') : color}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      
                      {/* Label */}
                      <DropdownMenuItem 
                        onSelect={() => {
                          setLabelEditId(conv.id!);
                          setLabelValue(conv.label || '');
                        }} 
                        className="gap-2"
                      >
                        <Tag className="w-4 h-4" />
                        {t('setLabel')}
                      </DropdownMenuItem>
                      
                      {showArchived ? (
                        <DropdownMenuItem onSelect={() => onUnarchiveConversation(conv.id!)} className="gap-2">
                          <ArchiveRestore className="w-4 h-4" />
                          {t('unarchive')}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => onArchiveConversation(conv.id!)} className="gap-2">
                          <Archive className="w-4 h-4" />
                          {t('archive')}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onSelect={() => onDeleteConversation(conv.id!)}
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

      <div className="p-4 border-t mt-auto">
        <div className="flex items-center justify-between gap-2 mb-2 px-2">
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-medium truncate">{user?.email}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={logout}
            className="text-muted-foreground hover:text-destructive shrink-0"
            title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationSidebar;
