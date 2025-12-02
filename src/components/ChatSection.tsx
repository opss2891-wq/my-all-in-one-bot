import React from 'react';
import { FileText, CheckSquare, Key, Sparkles } from 'lucide-react';

interface ChatSectionProps {
  onNavigate: (section: string) => void;
}

const ChatSection: React.FC<ChatSectionProps> = ({ onNavigate }) => {
  const cards = [
    {
      id: 'notes',
      title: 'Notes',
      description: 'Save your text notes',
      icon: FileText,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
    },
    {
      id: 'tasks',
      title: 'Tasks',
      description: 'Track your daily tasks',
      icon: CheckSquare,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
    },
    {
      id: 'credentials',
      title: 'Credentials',
      description: 'Hosting & FTP passwords',
      icon: Key,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/30',
    },
  ];

  return (
    <section id="chat" className="snap-section p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl mx-auto w-full text-center">
        <div className="mb-8 animate-float">
          <div className="w-20 h-20 mx-auto rounded-2xl gradient-primary flex items-center justify-center glow-primary animate-pulse-glow">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
          DataBot
        </h1>
        <p className="text-lg text-muted-foreground mb-10">
          Your Personal Data Store • Notes • Tasks • Passwords
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => onNavigate(card.id)}
              className={`p-6 rounded-2xl border ${card.borderColor} ${card.bgColor} hover:scale-105 transition-all duration-300 text-left animate-slide-up group`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <card.icon className={`w-8 h-8 ${card.color} mb-3 group-hover:scale-110 transition-transform`} />
              <h3 className="font-bold text-foreground mb-1">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </button>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          💡 Right-click anywhere for quick access
        </p>
      </div>
    </section>
  );
};

export default ChatSection;
