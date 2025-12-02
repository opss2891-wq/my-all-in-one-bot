import React, { useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import php from 'highlight.js/lib/languages/php';
import sql from 'highlight.js/lib/languages/sql';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import java from 'highlight.js/lib/languages/java';
import 'highlight.js/styles/github-dark.css';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('php', php);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('java', java);

interface CodeHighlightProps {
  code: string;
  language?: string;
  className?: string;
}

const CodeHighlight: React.FC<CodeHighlightProps> = ({ code, language = 'text', className = '' }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      // Remove any previous highlighting
      codeRef.current.removeAttribute('data-highlighted');
      
      // Only highlight if language is supported
      const supportedLangs = ['javascript', 'typescript', 'python', 'php', 'sql', 'css', 'html', 'xml', 'json', 'bash', 'java'];
      if (supportedLangs.includes(language.toLowerCase())) {
        hljs.highlightElement(codeRef.current);
      }
    }
  }, [code, language]);

  return (
    <pre className={`rounded-xl overflow-x-auto p-4 ${className}`}>
      <code 
        ref={codeRef} 
        className={`language-${language} block leading-relaxed`}
        dir="ltr"
        style={{ 
          textAlign: 'left', 
          fontSize: '1rem',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Consolas', 'Monaco', monospace",
          fontWeight: 400,
          letterSpacing: '0.02em'
        }}
      >
        {code}
      </code>
    </pre>
  );
};

export default CodeHighlight;
