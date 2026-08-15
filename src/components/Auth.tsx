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
      if (err.code === 'email_provider_disabled') {
        setError(translate('emailProviderDisabled') || 'Email login is disabled in settings.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      console.log("Initiating Google Sign-In via Managed Social Login...");
      setError('');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Use the exact current origin for redirect
          redirectTo: `${window.location.origin}/auth/callback`,
          // access_type and prompt are often required for consistent behavior
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) throw error;
      
      if (data?.url) {
        console.log("Redirecting to OAuth URL:", data.url);
        // Direct assignment to window.location can sometimes be more reliable
        // if the Supabase client redirect doesn't trigger immediately
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setError(translate('googleSignInError') || 'Google sign-in error. Please try again.');
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
          <div className="p-6 rounded-xl bg-muted/30 border border-border/50 space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <LogIn className="h-5 w-5" />
              <h3 className="font-semibold">{language === 'ar' ? 'تسجيل الدخول' : 'Login'}</h3>
            </div>
            
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder={content.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={content.password}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50"
                  required
                />
              </div>
              
              {error && (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-md"
                disabled={loading}
              >
                {loading ? content.loading : content.login}
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
