"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { BrandSettings } from "@/lib/types";

const EMPTY_BRAND: BrandSettings = {
  brand_logo: null,
  brand_favicon: null,
  brand_hero: null,
};

const BrandContext = createContext<BrandSettings>(EMPTY_BRAND);

/**
 * Menyalurkan aset identitas situs ke komponen client.
 *
 * Nilainya diambil **sekali di root layout** (Server Component) dan dioper
 * ke bawah lewat context, bukan di-fetch tiap komponen: `Logo` muncul di
 * hampir setiap halaman, dan satu permintaan per pemasangan logo akan
 * membanjiri backend demi satu URL yang jarang berubah.
 *
 * Nilai bawaannya sengaja "kosong" alih-alih melempar bila provider absen —
 * konsumennya sudah punya aset statis cadangan, jadi tidak ada yang rusak.
 */
export function BrandProvider({
  value,
  children,
}: {
  value: BrandSettings;
  children: ReactNode;
}) {
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandSettings {
  return useContext(BrandContext);
}
