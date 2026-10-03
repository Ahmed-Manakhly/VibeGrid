"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

interface CodeBlockViewerProps {
  language: string;
  code: string;
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
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
