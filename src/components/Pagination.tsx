import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  compact?: boolean;
  className?: string;
}

const getPages = (page: number, totalPages: number): (number | 'gap')[] => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | 'gap')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) pages.push('gap');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('gap');
  pages.push(totalPages);
  return pages;
};

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  totalItems,
  compact = false,
  className,
}) => {
  const { isRTL, language } = useLanguage();

  if (totalPages <= 1) return null;

  // In RTL the "previous" arrow visually points to the right
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;
  const FirstIcon = isRTL ? ChevronsRight : ChevronsLeft;
  const LastIcon = isRTL ? ChevronsLeft : ChevronsRight;

  const go = (p: number) => onPageChange(Math.min(totalPages, Math.max(1, p)));

  const btn =
    'flex items-center justify-center rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed';
  const size = compact ? 'w-7 h-7' : 'w-9 h-9';

  return (
    <div
      className={cn('flex flex-col items-center gap-2 animate-fade-in', className)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-1.5">
        {!compact && (
          <button className={cn(btn, size)} onClick={() => go(1)} disabled={page === 1}>
            <FirstIcon className="w-4 h-4" />
          </button>
        )}
        <button className={cn(btn, size)} onClick={() => go(page - 1)} disabled={page === 1}>
          <PrevIcon className="w-4 h-4" />
        </button>

        {getPages(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="px-1 text-muted-foreground/60 select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => go(p)}
              className={cn(
                btn,
                size,
                'text-sm font-medium',
                p === page &&
                  'bg-primary text-primary-foreground border-primary/40 shadow-lg shadow-primary/20 scale-105 hover:bg-primary hover:text-primary-foreground'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          className={cn(btn, size)}
          onClick={() => go(page + 1)}
          disabled={page === totalPages}
        >
          <NextIcon className="w-4 h-4" />
        </button>
        {!compact && (
          <button
            className={cn(btn, size)}
            onClick={() => go(totalPages)}
            disabled={page === totalPages}
          >
            <LastIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {!compact && (
        <p className="text-[11px] text-muted-foreground">
          {language === 'ar'
            ? `صفحة ${page} من ${totalPages}${totalItems ? ` • ${totalItems} عنصر` : ''}`
            : `Page ${page} of ${totalPages}${totalItems ? ` • ${totalItems} items` : ''}`}
        </p>
      )}
    </div>
  );
};

export default Pagination;
