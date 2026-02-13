"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Category } from "@/lib/types";
import { useState, useCallback } from "react";

interface ExpenseFiltersProps {
  categories: Category[];
}

export function ExpenseFilters({ categories }: ExpenseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
      router.push(`/expenses?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = () => {
    updateFilters("search", search);
  };

  const clearFilters = () => {
    setSearch("");
    router.push("/expenses");
  };

  const hasFilters = searchParams.get("search") || searchParams.get("category_id") || searchParams.get("date_from") || searchParams.get("date_to");

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
      <div className="flex gap-2 flex-1 w-full sm:w-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button variant="secondary" onClick={handleSearch} className="shrink-0">
          Search
        </Button>
      </div>

      <Select
        value={searchParams.get("category_id") || ""}
        onChange={(e) => updateFilters("category_id", e.target.value)}
        className="w-full sm:w-[180px]"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </Select>

      <Input
        type="date"
        value={searchParams.get("date_from") || ""}
        onChange={(e) => updateFilters("date_from", e.target.value)}
        className="w-full sm:w-[160px]"
        placeholder="From date"
      />

      <Input
        type="date"
        value={searchParams.get("date_to") || ""}
        onChange={(e) => updateFilters("date_to", e.target.value)}
        className="w-full sm:w-[160px]"
        placeholder="To date"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
