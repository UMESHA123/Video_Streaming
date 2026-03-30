"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => {
    setQuery("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center w-full">
      <div className="relative flex-1 flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos..."
          className="w-full bg-surface-DEFAULT border border-surface-border rounded-l-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-gray-500 focus:outline-none transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="bg-surface-hover hover:bg-surface-border border border-l-0 border-surface-border rounded-r-full px-5 py-2 transition-colors"
        title="Search"
      >
        <Search className="w-4 h-4 text-gray-400" />
      </button>
    </form>
  );
}
