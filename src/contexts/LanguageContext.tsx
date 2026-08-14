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
    pin: 'تثبيت',
    unpin: 'إلغاء التثبيت',
    noConversations: 'لا توجد محادثات',
    noArchivedConversations: 'لا توجد محادثات مؤرشفة',
    setColor: 'تعيين اللون',
    setLabel: 'تعيين التصنيف',
    noColor: 'بدون لون',
    globalSearch: 'بحث شامل',
    searchAll: 'بحث في جميع المحادثات...',
    foundIn: 'وُجد في',
    file: 'ملف',
    
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
    
    // Theme
    darkMode: 'الوضع المظلم',
    lightMode: 'الوضع الفاتح',
    toggleTheme: 'تبديل الوضع',
    
    // Search
    searchConversations: 'بحث في المحادثات...',
    
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
    previous: 'Previous',
    next: 'Next',
    add: 'Add',
    
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
    pin: 'Pin',
    unpin: 'Unpin',
    noConversations: 'No conversations',
    noArchivedConversations: 'No archived conversations',
    setColor: 'Set Color',
    setLabel: 'Set Label',
    noColor: 'No Color',
    globalSearch: 'Global Search',
    searchAll: 'Search all conversations...',
    foundIn: 'Found in',
    file: 'File',
    
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
    chooseFile: 'Choose file (txt, doc, docx, xls, xlsx, csv)',
    addImageTooltip: 'Add image (or Ctrl+V)',
    
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
    addNewTask: 'Add new task',
    taskPlaceholder: 'Type new task...',
    
    // Credentials labels
    userLabel: 'User',
    passLabel: 'Pass',
    hostLabel: 'Host',
    portLabel: 'Port',
    urlLabel: 'URL',

    // Settings
    settings: 'Settings',
    apiKeys: 'API Keys',
    customCss: 'Custom CSS',
    addApiKeyPlaceholder: 'Enter new API key...',
    checkAllKeys: 'Check all keys',
    noKeys: 'No keys added',
    apiKeyInfo: 'Keys will be used in rotation. If a key fails, it will automatically skip to the next.',
    keyAddedSuccess: 'Key added successfully',
    keyAddedInvalid: 'Key is invalid but added',
    keyDeleted: 'Key deleted',
    keyExistsError: 'Key already exists or is empty',

    // Context Menu
    quickMenu: 'Quick Menu',
    toggleSidebar: 'Toggle Sidebar',
    toggleHeader: 'Toggle Header',
    changeLanguage: 'Change Language',
    copyAll: 'Copy All',
    editCard: 'Edit',
    deleteCard: 'Delete',
    menuNavigation: 'Conversation Navigation',
    menuControls: 'Controls',
    menuFilters: 'Filters',

    // Theme
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    toggleTheme: 'Toggle Theme',
    
    // Search
    searchConversations: 'Search conversations...',
    
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
    imageAdded: 'Image added successfully',
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
