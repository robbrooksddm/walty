"use client";
import Image from "next/image";
import Link from "next/link";
import { Search, Bell, User, ShoppingBag } from "lucide-react";
import { useEffect } from "react";

export default function WaltyNav() {
  useEffect(() => {
    const nav = document.getElementById("waltyNav");
    const t = () => nav && nav.classList.toggle("shadow-md", window.scrollY > 8);
    t();
    window.addEventListener("scroll", t, { passive: true });
    return () => window.removeEventListener("scroll", t);
  }, []);

  return (
    <header
      id="waltyNav"
      className="sticky top-0 z-50 transition-shadow duration-200 bg-[--walty-cream]"
    >
      {/* TOP ROW */}
      <div className="mx-auto max-w-7xl flex items-center gap-6 px-4 py-3">
        <Link href="/">
          <Image
            src="/images/logo-pill-teal.svg"
            alt="Walty"
            width={112}
            height={38}
          />
        </Link>
        <div className="relative flex-1 max-w-xl hidden md:block">
          <input
            className="w-full h-10 rounded-full pl-12 pr-4 bg-white/70 border-[2px] border-[--walty-teal] placeholder:text-slate-500 font-sans text-[16px]/[24px] outline-none"
            placeholder="Search birthday cards…"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 stroke-[--walty-teal]" />
        </div>
        <nav className="flex items-center gap-6 ml-auto text-xs font-sans">
          <Link href="/reminders" className="hidden sm:flex flex-col items-center">
            <Bell className="w-6 h-6 stroke-[--walty-teal] hover:stroke-[--walty-orange]" />
            Reminders
          </Link>
          <Link href="/account" className="hidden sm:flex flex-col items-center">
            <User className="w-6 h-6 stroke-[--walty-teal] hover:stroke-[--walty-orange]" />
            Account
          </Link>
          <Link href="/basket" className="flex flex-col items-center">
            <ShoppingBag className="w-6 h-6 stroke-[--walty-teal] hover:stroke-[--walty-orange]" />
            Basket
          </Link>
        </nav>
      </div>

      {/* BIRTHDAY FILTER RAIL */}
      <nav className="border-t border-[rgba(0,91,85,.2)] overflow-x-auto whitespace-nowrap">
        <ul className="mx-auto max-w-7xl flex gap-8 px-4 py-3 font-serif text-[17px] font-bold">
          {["Recipient", "Age", "Style", "Interests"].map((l) => (
            <li key={l}>
              <button className="flex items-center gap-1 hover:text-[--walty-orange]">
                {l} ▾
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
