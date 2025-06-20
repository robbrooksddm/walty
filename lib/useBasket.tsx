"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface BasketItem {
  id: string;
  slug: string;
  title: string;
  variant: string;
  image: string;
  proof: string;
  pageImages: string[];
  pages: any[];
  qty: number;
}

interface BasketContextValue {
  items: BasketItem[];
  addItem: (item: { slug: string; title: string; variant: string; image: string; proof: string; pageImages: string[]; pages: any[] }) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  updateVariant: (id: string, variant: string, proof: string, pageImages: string[], pages: any[]) => void;
}

const BasketContext = createContext<BasketContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  updateVariant: () => {},
});

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("basket");
      const parsed = stored ? JSON.parse(stored) : [];
      const map: Record<string, string> = {
        mini: "gc-mini",
        classic: "gc-classic",
        giant: "gc-large",
      };
      return Array.isArray(parsed)
        ? parsed.map((it: BasketItem) => ({
            ...it,
            proof: it.proof || '',
            pageImages: Array.isArray((it as any).pageImages) ? (it as any).pageImages : [],
            pages: Array.isArray((it as any).pages) ? (it as any).pages : [],
            variant: map[it.variant] ?? it.variant,
            id: `${it.slug}_${map[it.variant] ?? it.variant}`,
          }))
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("basket", JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  const addItem = (item: { slug: string; title: string; variant: string; image: string; proof: string; pageImages: string[]; pages: any[] }) => {
    setItems((prev) => {
      const id = `${item.slug}_${item.variant}`
      const existing = prev.find((it) => it.id === id)
      if (existing) {
        return prev.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it))
      }
      return [...prev, { id, qty: 1, ...item }]
    })
  }

  const updateVariant = (id: string, variant: string, proof: string, pageImages: string[], pages: any[]) => {
    setItems(prev => prev.map(it =>
      it.id === id
        ? { ...it, id: `${it.slug}_${variant}`, variant, proof, pageImages, pages }
        : it
    ))
  }

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  };

  const updateQty = (id: string, qty: number) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty } : it)))
  };

  return (
    <BasketContext.Provider value={{ items, addItem, removeItem, updateQty, updateVariant }}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  return useContext(BasketContext);
}
