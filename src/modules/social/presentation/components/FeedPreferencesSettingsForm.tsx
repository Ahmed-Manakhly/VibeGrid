'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { Check, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function FeedPreferencesSettingsForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; emoji: string | null }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [interestRes, filterRes] = await Promise.all([
          fetch('/api/social/interests'),
          fetch('/api/feed/filters'),
        ]);

        if (interestRes.ok) {
          const data = await interestRes.json();
          if (data.success && Array.isArray(data.interests)) {
            setSelectedIds(data.interests.map((i: any) => i.id));
          }
        }

        if (filterRes.ok) {
          const filterData = await filterRes.json();
          if (filterData.success && Array.isArray(filterData.categories)) {
            setCategories(filterData.categories);
          } else if (Array.isArray(filterData.categories)) {
            setCategories(filterData.categories);
          }
        }
      } catch (e) {
        console.error('Failed to load feed preferences', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch('/api/social/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: selectedIds }),
      });

      if (!res.ok) {
        throw new Error('Failed to update feed preferences');
      }

      toast.success('Feed preferences updated!');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-4 text-accent" /> Feed Preferences & Interests
          </CardTitle>
          <CardDescription>Loading topics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-accent" /> Feed Preferences & Interests
        </CardTitle>
        <CardDescription>
          Select the topics you want to prioritize in your feed and recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {categories.map((cat) => {
              const isSelected = selectedIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left flex items-center justify-between ${
                    isSelected
                      ? 'bg-accent/20 border-accent text-accent'
                      : 'bg-muted/50 border-border/60 hover:bg-muted hover:border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="truncate">
                    {cat.emoji ? <span className="mr-1.5">{cat.emoji}</span> : null}
                    {cat.name}
                  </span>
                  {isSelected && <Check className="size-4 text-accent shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
