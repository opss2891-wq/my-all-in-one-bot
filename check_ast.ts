import * as fs from 'fs';
import * as path from 'path';
import * as acorn from 'acorn';
import ts from 'typescript';

function walk(dir: string, callback: (file: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      if (file !== 'node_modules') walk(filepath, callback);
    } else if (stats.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      callback(filepath);
    }
  }
}

walk('src', (file) => {
  console.log(`Checking ${file}...`);
  try {
    const code = fs.readFileSync(file, 'utf-8');
    // For TS files, we need to transpile to JS first because acorn doesn't support TS
    const js = ts.transpileModule(code, {
      compilerOptions: {
        jsx: ts.JsxEmit.React,
        target: ts.ScriptTarget.ESNext
      }
    }).outputText;
    
    acorn.parse(js, {
      ecmaVersion: 'latest',
      sourceType: 'module'
    });
  } catch (err: any) {
    console.error(`FAILED: ${file}`);
    console.error(err.message);
    if (err.message.includes('Maximum call stack size exceeded')) {
        process.exit(1);
    }
  }
});
