import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { LogIn, UserPlus, Shield, Mail, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const Auth: React.FC = () => {
  const isLogin = true; // Disabled signup toggle
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { language, isRTL, t: translate } = useLanguage();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Sign up is disabled
        throw new Error(translate('signupDisabled') || 'Registration is currently disabled.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setError(translate('googleSignInError'));
    }
  };

  const t = {
    en: {
      login: 'Login',
      signup: 'Sign Up',
      email: 'Email Address',
      password: 'Password',
      or: 'Secure access with',
      google: 'Continue with Google',
      switchLogin: 'Already have an account? Login',
      switchSignup: "Don't have an account? Create one",
      title: 'DataBot',
      desc: 'Your private digital vault for secrets and data.',
      loading: 'Processing...'
    },
    ar: {
      login: 'تسجيل الدخول',
      signup: 'إنشاء حساب',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      or: 'أو الدخول الآمن عبر',
      google: 'المتابعة بواسطة جوجل',
      switchLogin: 'لديك حساب بالفعل؟ سجل دخولك',
      switchSignup: 'ليس لديك حساب؟ أنشئ حساباً جديداً',
      title: 'DataBot',
      desc: 'خزنتك الرقمية الخاصة للبيانات والأسرار.',
      loading: 'جاري المعالجة...'
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
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-4">
              <div className="relative group">
                <div className={cn(
                  "absolute inset-y-0 flex items-center text-muted-foreground transition-colors group-focus-within:text-primary",
                  isRTL ? "right-3" : "left-3"
                )}>
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  type="email"
                  placeholder={content.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "bg-background/50 border-border/50 focus:border-primary/50 transition-all pl-10 h-11",
                    isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
                  )}
                  required
                />
              </div>

              <div className="relative group">
                <div className={cn(
                  "absolute inset-y-0 flex items-center text-muted-foreground transition-colors group-focus-within:text-primary",
                  isRTL ? "right-3" : "left-3"
                )}>
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  type="password"
                  placeholder={content.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    "bg-background/50 border-border/50 focus:border-primary/50 transition-all pl-10 h-11",
                    isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
                  )}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 font-medium transition-all hover:shadow-lg active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{content.loading}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  <span>{isLogin ? content.login : content.signup}</span>
                </div>
              )}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-card/60 px-3 text-muted-foreground font-medium">{content.or}</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full h-11 bg-background/30 border-border/50 hover:bg-background/80 transition-all"
            onClick={handleGoogleSignIn}
            aria-label={translate('signInWithGoogle')}
          >
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="font-medium tracking-tight">{translate('signInWithGoogle')}</span>
            </div>
          </Button>
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
