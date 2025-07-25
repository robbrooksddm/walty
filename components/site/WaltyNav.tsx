/* components/site/WaltyNav.tsx – tighter 64 px top row */
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, User, ShoppingBag, Crown } from "lucide-react";
import BasketPopover from "./BasketPopover";
import { useBasket } from "@/lib/useBasket";

const dropdownLabels = ["Birthday for", "Age", "Style", "Interests", "Sample", "Sample", "Sample", "Sample", "Sample"];

export default function WaltyNav() {
  /* show shadow when scrolled */
  useEffect(() => {
    const nav = document.getElementById("waltyNav");
    const toggle = () => nav?.classList.toggle("shadow-md", window.scrollY > 8);
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  const basketRef = useRef<HTMLButtonElement | null>(null);
  const [basketOpen, setBasketOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const { items } = useBasket();
  const itemCount = items.reduce((t, it) => t + it.qty, 0);

  return (
    <header
      id="waltyNav"
      className="sticky top-0 z-50 bg-[--walty-cream] transition-shadow duration-200"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* ── row A : 64 px tall ─────────────────────────────── */}
        <div className="flex h-20 items-center gap-6">
          {/* logo 140 × 48 */}
          <Link href="/" className="shrink-0">
            <Image src="/images/Walty Primary Logo.png" alt="Walty" width={134} height={46} priority />
          </Link>

          {/* search – 44 px tall */}
          <div className="relative hidden md:block w-[500px]">
            <input
              className="w-full h-12 rounded-full pl-14 pr-5 bg-white/70
                         border-2 border-[--walty-teal]
                         placeholder:text-slate-500 text-[15px]/[22px] outline-none"
              placeholder="Search birthday cards…"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 stroke-[--walty-teal]" />
          </div>

          {/* orange icons – 34 px */}
          <nav className="flex items-center gap-16 text-[14px] font-sans ml-auto">
            <Link href="/premium" className="flex flex-col items-center gap-1 hover:text-[--walty-teal]">
              <Crown className="w-[30px] h-[30px] stroke-[--walty-orange]" />
              Premium
            </Link>
            <Link href="/account" className="flex flex-col items-center gap-1 hover:text-[--walty-teal]">
              <User className="w-[30px] h-[30px] stroke-[--walty-orange]" />
              Account
            </Link>
            <button
              ref={basketRef}
              onClick={() => setBasketOpen((o) => !o)}
              className="relative flex flex-col items-center gap-1 hover:text-[--walty-teal]"
            >
              <ShoppingBag className="w-[30px] h-[30px] stroke-[--walty-orange]" />
              {mounted && itemCount > 0 && (
                <span
                  className="absolute -top-1 -right-2 rounded-full bg-[--walty-orange] text-[--walty-cream] text-[10px] leading-none px-1"
                >
                  {itemCount}
                </span>
              )}
              Basket
            </button>
          </nav>
          <BasketPopover anchor={basketRef.current} open={basketOpen} onClose={() => setBasketOpen(false)} />
        </div>

        {/* ── row B : filters ──────────────────────────────── */}
        {mounted && (
          <nav className="overflow-x-auto whitespace-nowrap">
            <ul className="flex gap-14 py-2 font-serif text-[17px] font-semibold">
              {dropdownLabels.map((label) => (
                <li key={label}>
                  <button className="flex items-center gap-1 hover:text-[--walty-orange]">
                    {label} <span className="translate-y-[1px]">▾</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* full-width divider */}
      <div className="border-t border-[rgba(0,91,85,.18)]" />
    </header>
  );
}
