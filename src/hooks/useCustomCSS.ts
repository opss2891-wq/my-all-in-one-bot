import { useState, useEffect, useCallback } from 'react';

export interface CustomCSSEntry {
  id: string;
  name: string;
  css: string;
  enabled: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'custom_css_entries';
const STYLE_ELEMENT_ID = 'custom-css-styles';

const getStyleElement = (): HTMLStyleElement => {
  let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ELEMENT_ID;
    document.head.appendChild(el);
  }
  return el;
};

const applyCSS = (entries: CustomCSSEntry[]) => {
  const el = getStyleElement();
  el.textContent = entries
    .filter(e => e.enabled)
    .map(e => `/* ${e.name} */\n${e.css}`)
    .join('\n\n');
};

export const useCustomCSS = () => {
  const [entries, setEntries] = useState<CustomCSSEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    applyCSS(entries);
  }, [entries]);

  // Apply on mount
  useEffect(() => {
    applyCSS(entries);
  }, []);

  const addEntry = useCallback((name: string, css: string) => {
    const entry: CustomCSSEntry = {
      id: crypto.randomUUID(),
      name: name.trim() || 'بدون اسم',
      css,
      enabled: true,
      createdAt: Date.now(),
    };
    setEntries(prev => [...prev, entry]);
    return entry;
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const toggleEntry = useCallback((id: string) => {
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, enabled: !e.enabled } : e))
    );
  }, []);

  const updateEntry = useCallback((id: string, css: string) => {
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, css } : e))
    );
  }, []);

  return { entries, addEntry, removeEntry, toggleEntry, updateEntry };
};
