'use client';

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/UserAvatar';
import { getMentionSuggestionsAction, MentionCandidate } from '@/actions/user.action';
import { AtSign, Loader2 } from 'lucide-react';

export interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  postId?: string;
  onValueChange?: (val: string) => void;
}

export const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  ({ postId, value, onChange, onKeyDown, onValueChange, className, placeholder, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => internalRef.current as HTMLTextAreaElement);

    const [suggestions, setSuggestions] = useState<MentionCandidate[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionMatch, setMentionMatch] = useState<{ query: string; startIndex: number; endIndex: number } | null>(null);

    // Detect @ mention at cursor position
    const checkMention = async (text: string, cursorPosition: number) => {
      const textBeforeCursor = text.slice(0, cursorPosition);
      // Match @something right before cursor without spaces
      const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_]*)$/);

      if (match) {
        const query = match[1];
        const atIndex = textBeforeCursor.lastIndexOf('@');
        setMentionMatch({
          query,
          startIndex: atIndex,
          endIndex: cursorPosition,
        });
        setIsLoading(true);
        setIsOpen(true);

        try {
          const results = await getMentionSuggestionsAction({ query, postId });
          setSuggestions(results);
          setSelectedIndex(0);
        } catch {
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsOpen(false);
        setMentionMatch(null);
        setSuggestions([]);
      }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) onChange(e);
      if (onValueChange) onValueChange(e.target.value);
      checkMention(e.target.value, e.target.selectionStart || 0);
    };

    const handleSelectCandidate = (candidate: MentionCandidate) => {
      if (!internalRef.current || !mentionMatch) return;

      const currentValue = String(value ?? internalRef.current.value ?? '');
      const before = currentValue.slice(0, mentionMatch.startIndex);
      const after = currentValue.slice(mentionMatch.endIndex);
      const insertText = `@${candidate.username} `;
      const newValue = `${before}${insertText}${after}`;

      // Update native value & dispatch change
      const textarea = internalRef.current;
      textarea.value = newValue;

      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);

      if (onChange) {
        const syntheticEvent = {
          ...event,
          target: textarea,
          currentTarget: textarea,
        } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(syntheticEvent);
      }
      if (onValueChange) {
        onValueChange(newValue);
      }

      setIsOpen(false);
      setMentionMatch(null);

      // Restore focus and place cursor right after inserted mention
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = before.length + insertText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 10);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (isOpen && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          handleSelectCandidate(suggestions[selectedIndex]);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsOpen(false);
          return;
        }
      }

      if (onKeyDown) onKeyDown(e);
    };

    // Close popover when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (internalRef.current && !internalRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative w-full">
        <Textarea
          ref={internalRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className={className}
          placeholder={placeholder}
          {...props}
        />

        {/* Floating Mention Autocomplete Dropdown */}
        {isOpen && (
          <div className="absolute z-50 bottom-full mb-1 left-0 w-full max-w-sm rounded-xl border border-primary/25 bg-card/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 border-b border-border/40 bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1 text-primary font-semibold">
                <AtSign className="size-3" /> Mention Developer
              </span>
              <span>Use ↑↓ to navigate, Enter to select</span>
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-border/20 py-1">
              {isLoading && suggestions.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                  <span>Searching developers...</span>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  No matching developers found
                </div>
              ) : (
                suggestions.map((candidate, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectCandidate(candidate);
                      }}
                      className={`w-full px-3 py-2 flex items-center justify-between gap-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-primary/15 text-primary'
                          : 'hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          src={candidate.image}
                          name={candidate.name || candidate.username}
                          className="size-7 shrink-0 ring-1 ring-border/50"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate leading-tight">
                            {candidate.name || candidate.username}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate leading-tight">
                            @{candidate.username}
                          </p>
                        </div>
                      </div>

                      {candidate.badge && (
                        <span
                          className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full shrink-0 border ${
                            candidate.badge === 'Author'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : candidate.badge === 'Commenter'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              : candidate.badge === 'Following'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-muted/40 text-muted-foreground border-border/30'
                          }`}
                        >
                          {candidate.badge}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MentionTextarea.displayName = 'MentionTextarea';

