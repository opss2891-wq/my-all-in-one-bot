import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';

interface Translations {
  [key: string]: string;
}

const translations: Record<Language, Translations> = {
  ar: {
    // General
    appName: 'داتا بوت',
    personalStorage: 'تخزين البيانات الشخصية',
    loading: 'جاري التحميل...',
    search: 'بحث...',
    
    // Navigation
    all: 'الكل',
    notes: 'ملاحظات',
    tasks: 'المهام',
    credentials: 'بيانات الدخول',
    links: 'روابط',
    chats: 'المحادثات',
    
    // Conversations
    conversations: 'المحادثات',
    newConversation: 'محادثة جديدة',
    archive: 'الأرشيف',
    archived: 'مؤرشفة',
    rename: 'إعادة تسمية',
    unarchive: 'إلغاء الأرشفة',
    delete: 'حذف',
    noConversations: 'لا توجد محادثات',
    noArchivedConversations: 'لا توجد محادثات مؤرشفة',
    
    // Messages
    noMessages: 'لا توجد رسائل بعد',
    noResults: 'لم يتم العثور على نتائج',
    tryDifferent: 'جرب كلمات بحث مختلفة',
    startAdding: 'ابدأ بإضافة ملاحظة أو مهام أو روابط',
    scrollMore: 'انزل لتحميل المزيد...',
    
    // Input
    addNote: 'أضف ملاحظة...',
    addTasks: 'أضف مهام (سطر لكل مهمة)...',
    addCredentials: 'user:pass@host أو user:pass',
    addLinks: 'أضف روابط (سطر لكل رابط)...',
    send: 'إرسال',
    
    // Card actions
    note: 'ملاحظة',
    task: 'مهمة',
    credential: 'بيانات دخول',
    link: 'رابط',
    code: 'كود',
    copy: 'نسخ',
    copied: 'تم النسخ!',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    host: 'المضيف',
    explanation: 'الشرح',
    tags: 'التصنيفات',
    addCode: 'أضف كود...',
    
    // Context menu
    quickMenu: 'القائمة السريعة',
    toggleSidebar: 'إظهار/إخفاء القائمة الجانبية',
    toggleHeader: 'إظهار/إخفاء الهيدر',
    changeLanguage: 'تغيير اللغة',
    copyAll: 'نسخ الكل',
    editCard: 'تعديل',
    deleteCard: 'حذف',
    
    // Time
    today: 'اليوم',
    yesterday: 'أمس',
    daysAgo: 'منذ {n} أيام',
    
    // Welcome
    welcome: 'أهلاً بك!',
    createToStart: 'أنشئ محادثة جديدة للبدء',
    
    // Toasts
    addedSuccess: 'تمت الإضافة بنجاح',
    deletedSuccess: 'تم الحذف',
    nameUpdated: 'تم تحديث الاسم',
    error: 'حدث خطأ',
  },
  en: {
    // General
    appName: 'DataBot',
    personalStorage: 'Personal Data Storage',
    loading: 'Loading...',
    search: 'Search...',
    
    // Navigation
    all: 'All',
    notes: 'Notes',
    tasks: 'Tasks',
    credentials: 'Credentials',
    links: 'Links',
    chats: 'Chats',
    
    // Conversations
    conversations: 'Conversations',
    newConversation: 'New Conversation',
    archive: 'Archive',
    archived: 'Archived',
    rename: 'Rename',
    unarchive: 'Unarchive',
    delete: 'Delete',
    noConversations: 'No conversations',
    noArchivedConversations: 'No archived conversations',
    
    // Messages
    noMessages: 'No messages yet',
    noResults: 'No results found',
    tryDifferent: 'Try different search terms',
    startAdding: 'Start by adding a note, tasks, or links',
    scrollMore: 'Scroll down to load more...',
    
    // Input
    addNote: 'Add a note...',
    addTasks: 'Add tasks (one per line)...',
    addCredentials: 'user:pass@host or user:pass',
    addLinks: 'Add links (one per line)...',
    send: 'Send',
    
    // Card actions
    note: 'Note',
    task: 'Task',
    credential: 'Credential',
    link: 'Link',
    code: 'Code',
    copy: 'Copy',
    copied: 'Copied!',
    username: 'Username',
    password: 'Password',
    host: 'Host',
    explanation: 'Explanation',
    tags: 'Tags',
    addCode: 'Add code...',
    
    // Context menu
    quickMenu: 'Quick Menu',
    toggleSidebar: 'Toggle Sidebar',
    toggleHeader: 'Toggle Header',
    changeLanguage: 'Change Language',
    copyAll: 'Copy All',
    editCard: 'Edit',
    deleteCard: 'Delete',
    
    // Time
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: '{n} days ago',
    
    // Welcome
    welcome: 'Welcome!',
    createToStart: 'Create a new conversation to start',
    
    // Toasts
    addedSuccess: 'Added successfully',
    deletedSuccess: 'Deleted',
    nameUpdated: 'Name updated',
    error: 'An error occurred',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
