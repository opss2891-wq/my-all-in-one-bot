// Gemini API helper for generating content
const API_KEYS = [
  'AIzaSyD7jSzV7S-XwRa8L90KVBxM08g7LSMDeGk',
  'AIzaSyCTYH7rvcxwjemRqYO1_zy6fftpXtJ7x7s',
  'AIzaSyCwYAwZIqKE_727iTqIbYWLBvrt8ebW-0k',
  'AIzaSyC2uWuYocXExJfqQxeBaV90ZIvdx1EibCc',
  'AIzaSyDa-Ad3iE6JwBMy5mg9me2vfXbrdI3bLQo',
];

let currentKeyIndex = 0;

const getNextApiKey = () => {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
};

export const generateWithGemini = async (prompt: string): Promise<string> => {
  const apiKey = getNextApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  } catch (error) {
    console.error('Gemini API error:', error);
    return '';
  }
};

export const generateLinkTitle = async (url: string): Promise<string> => {
  const prompt = `أعطني عنوان قصير ومناسب باللغة العربية لهذا الرابط (بدون علامات ترقيم إضافية، فقط العنوان):
${url}

إذا كان الرابط API أو خدمة تقنية، اكتب اسم الخدمة ووصف قصير.
الرد يجب أن يكون سطر واحد فقط، بدون شرح إضافي.`;

  const title = await generateWithGemini(prompt);
  return title || extractTitleFromUrl(url);
};

export const extractTitleFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    if (pathParts.length > 0) {
      return `${hostname} - ${pathParts[0]}`;
    }
    return hostname;
  } catch {
    return url.substring(0, 50);
  }
};

export const detectCredentialType = async (content: string): Promise<string> => {
  const prompt = `حدد نوع بيانات الاعتماد هذه (اختر واحد فقط):
${content}

الخيارات: ftp, ssh, hosting, admin, cpanel, database, other
الرد يجب أن يكون كلمة واحدة فقط من الخيارات.`;

  const type = await generateWithGemini(prompt);
  const validTypes = ['ftp', 'ssh', 'hosting', 'admin', 'cpanel', 'database', 'other'];
  return validTypes.includes(type.toLowerCase()) ? type.toLowerCase() : 'other';
};

// Parse and format credentials using AI
export const parseCredentials = async (content: string): Promise<{
  username: string;
  password: string;
  host?: string;
  url?: string;
  credType: string;
} | null> => {
  const prompt = `حلل بيانات الاعتماد التالية واستخرج منها:
- اسم المستخدم (username)
- كلمة المرور (password)
- الخادم/السيرفر (host) إن وجد
- الرابط (url) إن وجد
- نوع البيانات (ftp, ssh, hosting, admin, cpanel, database, other)

البيانات:
${content}

أجب بالتنسيق التالي فقط (بدون أي نص إضافي):
USERNAME: [اسم المستخدم]
PASSWORD: [كلمة المرور]
HOST: [الخادم أو فارغ]
URL: [الرابط أو فارغ]
TYPE: [النوع]`;

  const result = await generateWithGemini(prompt);
  
  const usernameMatch = result.match(/USERNAME:\s*(.+)/i);
  const passwordMatch = result.match(/PASSWORD:\s*(.+)/i);
  const hostMatch = result.match(/HOST:\s*(.+)/i);
  const urlMatch = result.match(/URL:\s*(.+)/i);
  const typeMatch = result.match(/TYPE:\s*(\w+)/i);
  
  if (!usernameMatch || !passwordMatch) return null;
  
  const validTypes = ['ftp', 'ssh', 'hosting', 'admin', 'cpanel', 'database', 'other'];
  const credType = typeMatch?.[1]?.toLowerCase() || 'other';
  
  return {
    username: usernameMatch[1].trim(),
    password: passwordMatch[1].trim(),
    host: hostMatch?.[1]?.trim() !== '' && hostMatch?.[1]?.trim() !== 'فارغ' ? hostMatch[1].trim() : undefined,
    url: urlMatch?.[1]?.trim() !== '' && urlMatch?.[1]?.trim() !== 'فارغ' ? urlMatch[1].trim() : undefined,
    credType: validTypes.includes(credType) ? credType : 'other'
  };
};

// Fetch link metadata (title and thumbnail)
export const fetchLinkMetadata = async (url: string): Promise<{ title: string; thumbnail?: string }> => {
  try {
    // Try to get title from AI
    const title = await generateLinkTitle(url);
    
    // Extract favicon as thumbnail
    const urlObj = new URL(url);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    
    return {
      title: title || extractTitleFromUrl(url),
      thumbnail: faviconUrl
    };
  } catch {
    return {
      title: extractTitleFromUrl(url),
      thumbnail: undefined
    };
  }
};

export const explainCode = async (code: string): Promise<{ explanation: string; language: string; tags: string[] }> => {
  const prompt = `حلل هذا الكود وأعطني:
1. شرح قصير (سطر أو سطرين) باللغة العربية
2. لغة البرمجة (مثل: javascript, python, html, css, sql, etc)
3. 2-3 تاجات وصفية باللغة الإنجليزية

الكود:
${code}

أجب بالتنسيق التالي فقط:
EXPLANATION: [الشرح]
LANGUAGE: [اللغة]
TAGS: [tag1, tag2, tag3]`;

  const result = await generateWithGemini(prompt);
  
  const explanationMatch = result.match(/EXPLANATION:\s*(.+)/i);
  const languageMatch = result.match(/LANGUAGE:\s*(\w+)/i);
  const tagsMatch = result.match(/TAGS:\s*(.+)/i);
  
  return {
    explanation: explanationMatch?.[1]?.trim() || 'كود برمجي',
    language: languageMatch?.[1]?.toLowerCase() || 'text',
    tags: tagsMatch?.[1]?.split(',').map(t => t.trim()).filter(Boolean) || []
  };
};
