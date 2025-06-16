"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface BasketItem {
  sku: string;
  qty: number;
}

interface BasketContextValue {
  items: BasketItem[];
  addItem: (sku: string) => void;
  removeItem: (sku: string) => void;
  updateQty: (sku: string, qty: number) => void;
}

const BasketContext = createContext<BasketContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
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

  const removeItem = (sku: string) => {
    setItems((prev) => prev.filter((it) => it.sku !== sku));
  };

  const updateQty = (sku: string, qty: number) => {
    setItems((prev) =>
      prev.map((it) => (it.sku === sku ? { ...it, qty } : it))
    );
  };

  return (
    <BasketContext.Provider value={{ items, addItem, removeItem, updateQty }}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  return useContext(BasketContext);
}
