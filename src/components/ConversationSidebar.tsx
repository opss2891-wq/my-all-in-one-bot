import React, { useState, useMemo, useEffect } from 'react';
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
  LogOut
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
import Pagination from './Pagination';

const colorClasses: Record<ConversationColor, string> = {
  none: '',
  red: 'border-l-4 border-l-red-500 bg-red-500/5',
  orange: 'border-l-4 border-l-orange-500 bg-orange-500/5',
  yellow: 'border-l-4 border-l-yellow-500 bg-yellow-500/5',
  green: 'border-l-4 border-l-green-500 bg-green-500/5',
  emerald: 'border-l-4 border-l-emerald-500 bg-emerald-500/5',
  teal: 'border-l-4 border-l-teal-500 bg-teal-500/5',
  blue: 'border-l-4 border-l-blue-500 bg-blue-500/5',
  indigo: 'border-l-4 border-l-indigo-500 bg-indigo-500/5',
  purple: 'border-l-4 border-l-purple-500 bg-purple-500/5',
  pink: 'border-l-4 border-l-pink-500 bg-pink-500/5',
  rose: 'border-l-4 border-l-rose-500 bg-rose-500/5',
  slate: 'border-l-4 border-l-slate-500 bg-slate-500/5',
  cyan: 'border-l-4 border-l-cyan-500 bg-cyan-500/5',
  amber: 'border-l-4 border-l-amber-500 bg-amber-500/5',
};

const colorDots: Record<ConversationColor, string> = {
  none: 'bg-muted-foreground/30',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500',
  cyan: 'bg-cyan-500',
  amber: 'bg-amber-500',
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
  const [page, setPage] = useState(1);
  const CONVERSATIONS_PER_PAGE = 8;
  const { t, isRTL, language } = useLanguage();
  const { logout, user } = useAuth();

  const colors: ConversationColor[] = ['none', 'red', 'orange', 'yellow', 'green', 'emerald', 'teal', 'blue', 'indigo', 'purple', 'pink', 'rose', 'slate', 'cyan', 'amber'];

  const baseConversations = showArchived ? archivedConversations : conversations;
  
  const allDisplayedConversations = useMemo(() => {
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

  const totalPages = Math.ceil(allDisplayedConversations.length / CONVERSATIONS_PER_PAGE);
  const displayedConversations = allDisplayedConversations.slice(
    (page - 1) * CONVERSATIONS_PER_PAGE,
    page * CONVERSATIONS_PER_PAGE
  );

  // Reset page when switching between regular/archived or when searching
  useEffect(() => {
    setPage(1);
  }, [showArchived, searchQuery]);

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
      "h-full flex flex-col bg-card/40 backdrop-blur-3xl border-x border-white/5 transition-all duration-500 relative shadow-2xl",
      (editingId || labelEditId) ? "translate-x-0 opacity-100" : "group-[.dropdown-open]:translate-x-0 group-[.dropdown-open]:opacity-100",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-white/10 safe-area-top">
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
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl gradient-primary text-primary-foreground hover:opacity-90 transition-all font-medium"
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
      <div className="px-3 py-2 border-b border-white/10">
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
              "w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all",
              isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors",
                isRTL ? "left-2" : "right-2"
              )}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Toggle Archived */}
      <div className="px-3 py-2 border-b border-white/10">
        <button
          onClick={onToggleArchived}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all",
            showArchived 
              ? "bg-accent/20 text-accent border border-accent/20" 
              : "text-muted-foreground hover:bg-white/5 border border-transparent"
          )}
        >
          <Archive className="w-4.5 h-4.5" />
          <span className="font-medium">{t('archive')}</span>
          <span className="ms-auto bg-white/10 px-2 py-0.5 rounded-full text-xs">
            {archivedConversations.length}
          </span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3 cyber-grid">
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
          <div className="flex flex-col gap-2">
            {displayedConversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group relative flex items-center gap-3 p-3.5 cursor-pointer transition-all border border-white/5 rounded-[1.25rem] mb-1",
                  currentConversationId === conv.id
                    ? "bg-primary/20 border-primary/30 shadow-lg shadow-primary/5 scale-[1.02]"
                    : "hover:bg-white/5 hover:border-white/10 active:scale-[0.98]",
                  conv.color && colorClasses[conv.color]
                )}
                onClick={() => !editingId && !labelEditId && onSelectConversation(conv.id!)}
              >
                <div id={sidebarId} className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative transition-all border border-transparent overflow-hidden",
                  currentConversationId === conv.id ? "bg-primary/10 border-primary/20" : "bg-muted"
                )}>
                  <svg viewBox="0 0 100 100" className={cn(
                    "w-5 h-5 transition-all fill-none",
                    currentConversationId === conv.id ? "text-primary" : "text-muted-foreground"
                  )} xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 5L15 20V45C15 67.2 29.9 87.7 50 95C70.1 87.7 85 67.2 85 45V20L50 5Z" stroke="currentColor" strokeWidth="8" />
                  </svg>
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
                        "text-sm font-medium truncate text-foreground",
                        conv.pinned && "flex items-center gap-1"
                      )}>
                        {conv.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(conv.updatedAt)}
                        </p>
                        {conv.label && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                            {conv.label}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {!editingId && !labelEditId && (
                   <DropdownMenu onOpenChange={(open) => {
                     // Keep sidebar stable during dropdown interaction
                     const sidebar = document.getElementById(sidebarId);
                     if (open) {
                       sidebar?.classList.add('dropdown-open');
                     } else {
                       // Small delay to prevent flickering or immediate closure on selection
                       setTimeout(() => {
                         sidebar?.classList.remove('dropdown-open');
                       }, 100);
                     }
                   }}>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 glass-panel border-white/10">
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
                        <DropdownMenuSubContent className="glass-panel border-white/10">
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

      {/* Pagination for Sidebar */}
      {totalPages > 1 && (
        <div className="px-3 py-2 border-t border-border bg-card/50">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            compact
          />
        </div>
      )}

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
