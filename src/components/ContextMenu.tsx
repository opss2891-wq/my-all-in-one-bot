import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, CheckSquare, Key, Link2, Code, X, 
  PanelLeftClose, PanelLeftOpen, Eye, EyeOff, 
  Languages, Copy, Trash2, Edit2, Sparkles
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUI } from '@/contexts/UIContext';
import { cn } from '@/lib/utils';

interface Position {
  x: number;
  y: number;
}

interface ContextMenuProps {
  onNavigate?: (section: string) => void;
  onCopyCard?: () => void;
  onDeleteCard?: () => void;
  onEditCard?: () => void;
  cardType?: 'note' | 'tasks' | 'credentials' | 'links' | null;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ 
  onNavigate,
  onCopyCard,
  onDeleteCard,
  onEditCard,
  cardType 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [activeCardType, setActiveCardType] = useState<string | null>(null);
  
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { sidebarOpen, toggleSidebar, headerVisible, toggleHeader } = useUI();

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
    
    // Check if right-clicked on a card
    const cardElement = (e.target as HTMLElement).closest('[data-card-type]');
    if (cardElement) {
      setActiveCardType(cardElement.getAttribute('data-card-type'));
    } else {
      setActiveCardType(null);
    }
    
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  }, []);

  const handleClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
    };
  }, [handleContextMenu, handleClick]);

  const navigationItems = [
    { id: 'all', icon: Sparkles, label: t('all'), color: 'text-primary' },
    { id: 'note', icon: FileText, label: t('notes'), color: 'text-success' },
    { id: 'tasks', icon: CheckSquare, label: t('tasks'), color: 'text-warning' },
    { id: 'credentials', icon: Key, label: t('credentials'), color: 'text-accent' },
    { id: 'links', icon: Link2, label: t('links'), color: 'text-primary' },
    { id: 'code', icon: Code, label: t('code'), color: 'text-info' },
  ];

  if (!isOpen) return null;

  const menuWidth = 220;
  const menuHeight = activeCardType ? 400 : 320;
  const adjustedX = isRTL 
    ? Math.max(position.x - menuWidth, 10)
    : Math.min(position.x, window.innerWidth - menuWidth - 10);
  const adjustedY = Math.min(position.y, window.innerHeight - menuHeight - 10);

  return (
    <div
      className="fixed z-[100] animate-fade-in"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden min-w-[200px] backdrop-blur-xl">
        {/* Header */}
        <div className="p-3 border-b border-border bg-secondary/50 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{t('quickMenu')}</span>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Card Actions (if on a card) */}
        {activeCardType && (
          <div className="p-2 border-b border-border">
            <p className="text-xs text-muted-foreground px-2 mb-2">
              {activeCardType === 'note' && t('note')}
              {activeCardType === 'tasks' && t('tasks')}
              {activeCardType === 'credentials' && t('credentials')}
              {activeCardType === 'links' && t('links')}
            </p>
            <div className="space-y-1">
              {onCopyCard && (
                <button
                  onClick={() => { onCopyCard(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-start"
                >
                  <Copy className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{t('copy')}</span>
                </button>
              )}
              {onEditCard && (
                <button
                  onClick={() => { onEditCard(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-start"
                >
                  <Edit2 className="w-4 h-4 text-warning" />
                  <span className="text-sm text-foreground">{t('editCard')}</span>
                </button>
              )}
              {onDeleteCard && (
                <button
                  onClick={() => { onDeleteCard(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 transition-colors text-start"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{t('deleteCard')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* UI Controls */}
        <div className="p-2 border-b border-border">
          <p className="text-xs text-muted-foreground px-2 mb-2">التحكم</p>
          <div className="space-y-1">
            <button
              onClick={() => { toggleSidebar(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-start"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4 text-primary" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-primary" />
              )}
              <span className="text-sm text-foreground">{t('toggleSidebar')}</span>
            </button>
            <button
              onClick={() => { toggleHeader(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-start"
            >
              {headerVisible ? (
                <EyeOff className="w-4 h-4 text-warning" />
              ) : (
                <Eye className="w-4 h-4 text-warning" />
              )}
              <span className="text-sm text-foreground">{t('toggleHeader')}</span>
            </button>
            <button
              onClick={() => { 
                setLanguage(language === 'ar' ? 'en' : 'ar'); 
                setIsOpen(false); 
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-start"
            >
              <Languages className="w-4 h-4 text-accent" />
              <span className="text-sm text-foreground">{t('changeLanguage')}</span>
              <span className="ms-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                {language === 'ar' ? 'EN' : 'عربي'}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        {onNavigate && (
          <div className="p-2">
            <p className="text-xs text-muted-foreground px-2 mb-2">الفلاتر</p>
            <div className="grid grid-cols-2 gap-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-start"
                >
                  <item.icon className={cn("w-4 h-4", item.color)} />
                  <span className="text-sm text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContextMenu;
