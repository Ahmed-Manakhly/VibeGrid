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
    <div className="flex flex-wrap gap-2 pb-4">
      <Link
        href="/"
        className={`topic-pill ${!activeCategory ? "topic-pill-active" : "bg-card"}`}
      >
        For You
      </Link>
      
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/?category=${cat.slug}`}
          className={`topic-pill ${activeCategory === cat.slug ? "topic-pill-active" : "bg-card"}`}
        >
          {cat.emoji} {cat.name}
        </Link>
      ))}
    </div>
  );
}
