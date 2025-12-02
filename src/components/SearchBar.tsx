import React from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  const { t, isRTL } = useLanguage();

  return (
    <div className="relative">
      <Search className={cn(
        "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground",
        isRTL ? "right-3" : "left-3"
      )} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('search')}
        className={cn(
          "w-full py-2.5 bg-muted/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm transition-all",
          isRTL ? "pr-10 pl-10" : "pl-10 pr-10"
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 p-1 hover:bg-background rounded-lg transition-colors",
            isRTL ? "left-3" : "right-3"
          )}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
