import React, { useState, useEffect } from 'react';
import { Settings, Key, Check, X, Eye, EyeOff, Loader2, Palette } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import CustomCSSSection from '@/components/CustomCSSSection';

interface ApiKey {
  id: string;
  key: string;
  isValid: boolean | null;
  isChecking: boolean;
}

const API_KEYS_STORAGE_KEY = 'gemini_api_keys';

const SettingsDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState('');
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const { t } = useLanguage();

  // Load keys from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(API_KEYS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setApiKeys(parsed.map((key: string) => ({
          id: crypto.randomUUID(),
          key,
          isValid: null,
          isChecking: false,
        })));
      } catch {
        setApiKeys([]);
      }
    }
  }, []);

  // Save keys to localStorage
  const saveKeys = (keys: ApiKey[]) => {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys.map(k => k.key)));
  };

  // Validate API key
  const validateKey = async (apiKey: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello' }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  };

  // Check all keys
  const checkAllKeys = async () => {
    const updatedKeys = [...apiKeys];
    for (let i = 0; i < updatedKeys.length; i++) {
      updatedKeys[i].isChecking = true;
      setApiKeys([...updatedKeys]);
      
      const isValid = await validateKey(updatedKeys[i].key);
      updatedKeys[i].isValid = isValid;
      updatedKeys[i].isChecking = false;
      setApiKeys([...updatedKeys]);
    }
  };

  // Add new key
  const addKey = async () => {
    if (!newKey.trim() || apiKeys.some(k => k.key === newKey.trim())) {
      toast({ title: t('keyExistsError'), variant: 'destructive' });
      return;
    }

    const newApiKey: ApiKey = {
      id: crypto.randomUUID(),
      key: newKey.trim(),
      isValid: null,
      isChecking: true,
    };

    const updatedKeys = [...apiKeys, newApiKey];
    setApiKeys(updatedKeys);
    setNewKey('');

    // Validate the new key
    const isValid = await validateKey(newApiKey.key);
    newApiKey.isValid = isValid;
    newApiKey.isChecking = false;
    setApiKeys([...updatedKeys]);
    saveKeys(updatedKeys);

    toast({ 
      title: isValid ? t('keyAddedSuccess') : t('keyAddedInvalid'),
      variant: isValid ? 'default' : 'destructive'
    });
  };

  // Remove key
  const removeKey = (id: string) => {
    const updatedKeys = apiKeys.filter(k => k.id !== id);
    setApiKeys(updatedKeys);
    saveKeys(updatedKeys);
    toast({ title: t('keyDeleted') });
  };

  // Toggle key visibility
  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="w-5 h-5" />
            {t('settings')}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="api" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="api" className="flex items-center gap-1.5 text-xs">
              <Key className="w-3.5 h-3.5" />
              {t('apiKeys')}
            </TabsTrigger>
            <TabsTrigger value="css" className="flex items-center gap-1.5 text-xs">
              <Palette className="w-3.5 h-3.5" />
              {t('customCss')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="mt-4">
            <div className="space-y-4">
              {/* Existing Keys */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {apiKeys.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    {t('noKeys')}
                  </div>
                ) : (
                  apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border transition-all",
                        apiKey.isValid === true && "border-success/30 bg-success/5",
                        apiKey.isValid === false && "border-destructive/30 bg-destructive/5",
                        apiKey.isValid === null && "border-border bg-muted/30"
                      )}
                    >
                      <div className="flex-shrink-0">
                        {apiKey.isChecking ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : apiKey.isValid === true ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : apiKey.isValid === false ? (
                          <X className="w-4 h-4 text-destructive" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-muted-foreground/20" />
                        )}
                      </div>
                      <div className="flex-1 font-mono text-sm truncate">
                        {showKeys[apiKey.id]
                          ? apiKey.key
                          : `${apiKey.key.substring(0, 10)}...${apiKey.key.slice(-4)}`}
                      </div>
                      <button onClick={() => toggleKeyVisibility(apiKey.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                        {showKeys[apiKey.id] ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <button onClick={() => removeKey(apiKey.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder={t('addApiKeyPlaceholder')}
                  className="flex-1 font-mono text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addKey()}
                />
                <button
                  onClick={addKey}
                  disabled={!newKey.trim()}
                  className={cn(
                    "px-4 py-2 rounded-xl font-medium transition-colors",
                    newKey.trim()
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {t('add')}
                </button>
              </div>

              {apiKeys.length > 0 && (
                <button onClick={checkAllKeys} className="w-full py-2 text-sm text-primary hover:bg-primary/10 rounded-xl transition-colors">
                  {t('checkAllKeys')}
                </button>
              )}

              <p className="text-xs text-muted-foreground text-center">
                {t('apiKeyInfo')}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="css" className="mt-4">
            <CustomCSSSection />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
