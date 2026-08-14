"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
}

export function CategoryPills() {
  const [categories, setCategories] = useState<Category[]>([]);
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");

  useEffect(() => {
    fetch("/api/feed/filters")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(console.error);
  }, []);

  if (categories.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
      <Link
        href="/"
        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
          !activeCategory
            ? "bg-primary text-white"
            : "bg-white/5 text-gray-300 hover:bg-white/10"
        }`}
      >
        For You
      </Link>
      
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/?category=${cat.slug}`}
          className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
            activeCategory === cat.slug
              ? "bg-primary text-white"
              : "bg-white/5 text-gray-300 hover:bg-white/10"
          }`}
        >
          {cat.emoji} {cat.name}
        </Link>
      ))}
    </div>
  );
}
