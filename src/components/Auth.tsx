import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, KeyRound } from 'lucide-react';

const Auth: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { language } = useLanguage();
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
      desc: 'Enter your 4-digit PIN to access your secure vault.',
      placeholder: 'Enter PIN',
      login: 'Access Vault',
      loading: 'Accessing...',
    },
    ar: {
      title: 'DataBot',
      desc: 'أدخل رمز PIN المكون من 4 أرقام للوصول إلى خزنتك الآمنة.',
      placeholder: 'أدخل الرمز',
      login: 'دخول الخزنة',
      loading: 'جاري الدخول...',
    }
  };

  const content = language === 'ar' ? t.ar : t.en;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden px-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-md border-border/40 bg-card/60 backdrop-blur-xl shadow-elevated relative z-10 overflow-hidden animate-slide-up">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse-glow" />
        
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg animate-float">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              {content.title}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground max-w-[280px] mx-auto">
              {content.desc}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-6 rounded-xl bg-muted/30 border border-border/50 space-y-4">
            <div className="flex items-center gap-3 text-primary justify-center">
              <Lock className="h-5 w-5" />
              <h3 className="font-semibold">{language === 'ar' ? 'رمز الحماية' : 'Security PIN'}</h3>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative">
                <Input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="bg-background/50 text-center text-2xl tracking-[1em] h-14"
                  required
                  autoFocus
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50" />
              </div>
              
              {error && (
                <div className="text-xs text-center text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-md h-12 text-lg"
              >
                {content.login}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="absolute bottom-6 left-0 w-full text-center text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] pointer-events-none">
        Powered by DataBot Security
      </div>
    </div>
  );
};

export default Auth;