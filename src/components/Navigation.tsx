import React from 'react';
import { MessageCircle, FileText, CheckSquare, Key } from 'lucide-react';

interface NavigationProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeSection, onNavigate }) => {
  const navItems = [
    { id: 'chat', icon: MessageCircle, label: 'Home' },
    { id: 'notes', icon: FileText, label: 'Notes' },
    { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
    { id: 'credentials', icon: Key, label: 'Credentials' },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-2 flex gap-1 shadow-lg">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              activeSection === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
