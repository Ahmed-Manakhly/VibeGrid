"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

interface CodeBlockViewerProps {
  language: string;
  code: string;
}

// Simple, secure syntax tokenizing helper that outputs React elements safely without dangerouslySetInnerHTML
type TokenType = 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'tag' | 'plain';

interface CodeToken {
  type: TokenType;
  content: string;
}

function tokenizeCode(code: string, language: string): CodeToken[] {
  const normalizedLang = (language || '').toLowerCase();
  
  if (normalizedLang === 'plaintext') {
    return [{ type: 'plain', content: code }];
  }

  const tokens: CodeToken[] = [];
  
  // Lexer patterns
  const isHtmlXml = ['html', 'jsx', 'tsx', 'xml'].includes(normalizedLang);
  
  // Regex matcher rules
  const commentRegex = normalizedLang === 'html'
    ? /<!--[\s\S]*?-->/g
    : /\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*/g;
    
  const stringRegex = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g;
  const numberRegex = /\b\d+(?:\.\d+)?\b/g;
  
  const keywordsList = new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'export',
    'from', 'default', 'class', 'extends', 'async', 'await', 'try', 'catch', 'throw', 'new', 'typeof',
    'interface', 'type', 'public', 'private', 'protected', 'readonly', 'implements', 'enum',
    'def', 'self', 'lambda', 'with', 'as', 'pass', 'raise', 'print', 'import', 'from',
    'select', 'from', 'where', 'insert', 'into', 'update', 'delete', 'join', 'left', 'right', 'on', 'group', 'by', 'order', 'limit',
    'package', 'func', 'go', 'struct', 'val', 'fun', 'null', 'undefined', 'true', 'false', 'boolean', 'string', 'number', 'void', 'any'
  ]);

  // Combine patterns
  const tokenRegex = isHtmlXml
    ? /(<!--[\s\S]*?-->)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(<\/?[\w:-]+(?:\s+[\w:-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*\/?>)|(\b\d+(?:\.\d+)?\b)/g
    : /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_]\w*\b)|([{}()\[\];,.:+\-*\/=<>!&|]+)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'plain', content: code.slice(lastIndex, match.index) });
    }

    const [matchedStr, comment, str, numOrTag, word, op] = match;

    if (comment) {
      tokens.push({ type: 'comment', content: matchedStr });
    } else if (str) {
      tokens.push({ type: 'string', content: matchedStr });
    } else if (isHtmlXml && numOrTag && numOrTag.startsWith('<')) {
      tokens.push({ type: 'tag', content: matchedStr });
    } else if (numOrTag && !isHtmlXml && !isNaN(Number(numOrTag))) {
      tokens.push({ type: 'number', content: matchedStr });
    } else if (word && keywordsList.has(word)) {
      tokens.push({ type: 'keyword', content: matchedStr });
    } else if (op) {
      tokens.push({ type: 'operator', content: matchedStr });
    } else {
      tokens.push({ type: 'plain', content: matchedStr });
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < code.length) {
    tokens.push({ type: 'plain', content: code.slice(lastIndex) });
  }

  return tokens;
}

export function CodeBlockViewer({ language, code }: CodeBlockViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const displayLanguage = language ? language.toUpperCase() : "PLAINTEXT";
  const tokens = tokenizeCode(code, language);

  return (
    <div className="my-3 rounded-xl border border-border/80 bg-slate-950 text-slate-100 overflow-hidden shadow-md font-mono text-xs sm:text-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs select-none">
        <span className="font-bold tracking-wider text-primary/90 text-[11px] uppercase">
          {displayLanguage}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-[11px]"
        >
          {copied ? (
            <>
              <CheckIcon className="size-3.5 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <CopyIcon className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code body with horizontal scrolling */}
      <div className="p-4 overflow-x-auto max-h-[450px] scrollbar-thin scrollbar-thumb-slate-700">
        <pre className="font-mono leading-relaxed whitespace-pre tab-4">
          <code>
            {tokens.map((token, index) => {
              switch (token.type) {
                case 'keyword':
                  return <span key={index} className="text-purple-400 font-semibold">{token.content}</span>;
                case 'string':
                  return <span key={index} className="text-emerald-300">{token.content}</span>;
                case 'comment':
                  return <span key={index} className="text-slate-500 italic">{token.content}</span>;
                case 'number':
                  return <span key={index} className="text-amber-400">{token.content}</span>;
                case 'operator':
                  return <span key={index} className="text-cyan-400">{token.content}</span>;
                case 'tag':
                  return <span key={index} className="text-sky-400 font-medium">{token.content}</span>;
                case 'plain':
                default:
                  return <span key={index}>{token.content}</span>;
              }
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}
