import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';

const AuthLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(175, 80%, 50%)" />
        <stop offset="100%" stopColor="hsl(195, 80%, 45%)" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <path 
      d="M50 5L15 20V45C15 67.2 29.9 87.7 50 95C70.1 87.7 85 67.2 85 45V20L50 5Z" 
      stroke="url(#logo-grad)" 
      strokeWidth="4" 
      className="animate-pulse"
      filter="url(#glow)"
    />
    <circle cx="50" cy="45" r="12" stroke="url(#logo-grad)" strokeWidth="3" />
    <path d="M50 57V68M45 73H55" stroke="url(#logo-grad)" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const AnimatedBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden bg-[#0a0c10] pointer-events-none">
    <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
    <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20">
      <div className="absolute inset-0 border-[1px] border-primary/30 rounded-full animate-spin-slow" />
      <div className="absolute inset-20 border-[1px] border-accent/20 rounded-full animate-reverse-spin" />
      <div className="absolute inset-40 border-[1px] border-primary/10 rounded-full animate-spin-slow" style={{ animationDuration: '20s' }} />
    </div>
  </div>
);

const Auth: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { language, isRTL } = useLanguage();
  const { loginWithPin } = useAuth();
  const navigate = useNavigate();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (pin === '4419') {
      loginWithPin();
      navigate('/');
    } else {
      setError(language === 'ar' ? 'رمز الدخول غير صحيح' : 'Invalid PIN');
      setPin('');
    }
  };

  const t = {
    en: {
      title: 'DataBot',
      subtitle: 'Secure Information Management',
      desc: 'Authentication Required',
      placeholder: '••••',
      login: 'Decrypt & Access',
      securityStatus: 'Encrypted Session Active',
    },
    ar: {
      title: 'داتا بوت',
      subtitle: 'إدارة البيانات الآمنة',
      desc: 'مطلوب التحقق من الهوية',
      placeholder: '••••',
      login: 'فك التشفير والدخول',
      securityStatus: 'جلسة مشفرة نشطة',
    }
  };

  const content = language === 'ar' ? t.ar : t.en;

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden px-4 font-sans selection:bg-primary/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <AnimatedBackground />
      
      <div className="w-full max-w-[440px] relative z-10 animate-fade-in">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <AuthLogo className="w-24 h-24 relative z-10 drop-shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white mb-2">
            {content.title}
          </h1>
          <p className="text-primary/70 font-medium text-sm uppercase tracking-widest">
            {content.subtitle}
          </p>
        </div>

        <Card className="border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <CardContent className="p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-tighter mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                {content.securityStatus}
              </div>
              <h2 className="text-xl font-bold text-white/90">{content.desc}</h2>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-25 group-focus-within:opacity-100 transition duration-500" />
                <div className="relative">
                  <Input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    placeholder={content.placeholder}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="bg-black/40 border-white/10 text-center text-3xl font-bold tracking-[0.8em] h-20 rounded-2xl text-white placeholder:text-white/10 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    required
                    autoFocus
                  />
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20 group-focus-within:text-primary/50 transition-colors" />
                </div>
              </div>
              
              {error && (
                <div className="text-sm font-medium text-center text-red-400 bg-red-500/10 py-3 px-4 rounded-xl border border-red-500/20 animate-in fade-in zoom-in duration-300">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transition-all active:scale-[0.98] group"
              >
                <span className="flex items-center justify-center gap-2">
                  {content.login}
                  <Lock className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* System Info */}
        <div className="mt-8 flex items-center justify-between text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-2">
          <span>v4.0.0 Stable</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Secure Cloud Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;