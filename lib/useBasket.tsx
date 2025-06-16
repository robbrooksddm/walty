"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface BasketItem {
  sku: string;
  qty: number;
}

interface BasketContextValue {
  items: BasketItem[];
  addItem: (sku: string) => void;
}

const BasketContext = createContext<BasketContextValue>({
  items: [],
  addItem: () => {},
});

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("basket");
      return stored ? JSON.parse(stored) : [];
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

  const addItem = (sku: string) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.sku === sku);
      if (existing) {
        return prev.map((it) =>
          it.sku === sku ? { ...it, qty: it.qty + 1 } : it
        );
      }
      return [...prev, { sku, qty: 1 }];
    });
  };

  return (
    <BasketContext.Provider value={{ items, addItem }}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  return useContext(BasketContext);
}
