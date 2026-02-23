import React, { useState } from 'react';
import { Plus, Trash2, Code2, ChevronDown, ChevronUp } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useCustomCSS, CustomCSSEntry } from '@/hooks/useCustomCSS';
import { toast } from '@/hooks/use-toast';

const CustomCSSSection: React.FC = () => {
  const { entries, addEntry, removeEntry, toggleEntry, updateEntry } = useCustomCSS();
  const [newName, setNewName] = useState('');
  const [newCSS, setNewCSS] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = () => {
    if (!newCSS.trim()) {
      toast({ title: 'أدخل كود CSS', variant: 'destructive' });
      return;
    }
    addEntry(newName, newCSS.trim());
    setNewName('');
    setNewCSS('');
    setShowAddForm(false);
    toast({ title: 'تم إضافة التنسيق بنجاح' });
  };

  const handleDelete = (id: string) => {
    removeEntry(id);
    toast({ title: 'تم حذف التنسيق' });
  };

  return (
    <div className="space-y-4">
      {/* Entries List */}
      <div className="space-y-2 max-h-52 overflow-y-auto">
        {entries.length === 0 && !showAddForm ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            لا توجد تنسيقات مخصصة
          </div>
        ) : (
          entries.map((entry) => (
            <CSSEntryCard
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggleExpand={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              onToggleEnabled={() => toggleEntry(entry.id)}
              onDelete={() => handleDelete(entry.id)}
              onUpdate={(css) => updateEntry(entry.id, css)}
            />
          ))
        )}
      </div>

      {/* Add Form */}
      {showAddForm ? (
        <div className="space-y-3 p-3 rounded-xl border border-border bg-muted/20">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="اسم التنسيق (اختياري)..."
            className="text-sm"
          />
          <Textarea
            value={newCSS}
            onChange={(e) => setNewCSS(e.target.value)}
            placeholder=".my-class { color: red; }"
            className="font-mono text-xs min-h-[100px] resize-y"
            dir="ltr"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newCSS.trim()}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm font-medium transition-colors",
                newCSS.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground"
              )}
            >
              إضافة
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewCSS(''); setNewName(''); }}
              className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-primary hover:bg-primary/10 rounded-xl border border-dashed border-primary/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة تنسيق CSS جديد
        </button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        التنسيقات المفعّلة تُطبق على التطبيق بالكامل. يمكنك تعطيلها أو حذفها في أي وقت.
      </p>
    </div>
  );
};

interface CSSEntryCardProps {
  entry: CustomCSSEntry;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
  onUpdate: (css: string) => void;
}

const CSSEntryCard: React.FC<CSSEntryCardProps> = ({
  entry, expanded, onToggleExpand, onToggleEnabled, onDelete, onUpdate
}) => {
  return (
    <div className={cn(
      "rounded-xl border transition-all",
      entry.enabled ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30 opacity-60"
    )}>
      <div className="flex items-center gap-2 p-3">
        <Code2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="flex-1 text-sm font-medium truncate">{entry.name}</span>
        <Switch
          checked={entry.enabled}
          onCheckedChange={onToggleEnabled}
          className="scale-75"
        />
        <button onClick={onToggleExpand} className="p-1 hover:bg-muted rounded-lg transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        <button onClick={onDelete} className="p-1 hover:bg-destructive/10 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>
      {expanded && (
        <div className="px-3 pb-3">
          <Textarea
            value={entry.css}
            onChange={(e) => onUpdate(e.target.value)}
            className="font-mono text-xs min-h-[80px] resize-y"
            dir="ltr"
          />
        </div>
      )}
    </div>
  );
};

export default CustomCSSSection;
