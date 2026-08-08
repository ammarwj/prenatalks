"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIFE_STAGE_OPTIONS } from "@/lib/validations/article";
import type { Category } from "@/lib/types";

export function ArticleFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    updateParam("search", search);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={handleSearchSubmit} className="min-w-[220px] flex-1">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul artikel..."
            className="h-11 rounded-full pl-10"
          />
        </div>
      </form>

      <Select
        value={searchParams.get("life_stage") ?? "all"}
        onValueChange={(v) => updateParam("life_stage", v === "all" ? "" : v)}
      >
        <SelectTrigger className="h-11 w-[170px] rounded-full">
          <SelectValue placeholder="Tahap kehidupan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua tahap</SelectItem>
          {LIFE_STAGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("category") ?? "all"}
        onValueChange={(v) => updateParam("category", v === "all" ? "" : v)}
      >
        <SelectTrigger className="h-11 w-[170px] rounded-full">
          <SelectValue placeholder="Kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua kategori</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.slug}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("trimester") ?? "all"}
        onValueChange={(v) => updateParam("trimester", v === "all" ? "" : v)}
      >
        <SelectTrigger className="h-11 w-[150px] rounded-full">
          <SelectValue placeholder="Trimester" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua trimester</SelectItem>
          <SelectItem value="1">Trimester 1</SelectItem>
          <SelectItem value="2">Trimester 2</SelectItem>
          <SelectItem value="3">Trimester 3</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
