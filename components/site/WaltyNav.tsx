/* components/site/WaltyNav.tsx – tighter 64 px top row */
"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, User, ShoppingBag, Crown } from "lucide-react";

export default function WaltyNav() {
  /* show shadow when scrolled */
  useEffect(() => {
    const nav = document.getElementById("waltyNav");
    const toggle = () => nav?.classList.toggle("shadow-md", window.scrollY > 8);
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });
    return () => window.removeEventListener("scroll", toggle);
  }, []);

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
            <Image src="/images/Walty logo.png" alt="Walty" width={140} height={48} priority />
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
            {[
              { href: "/premium", label: "Premium", Icon: Crown },
              { href: "/account", label: "Account", Icon: User },
              { href: "/basket",  label: "Basket",  Icon: ShoppingBag },
            ].map(({ href, label, Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-1 hover:text-[--walty-teal]"
              >
                <Icon className="w-[30px] h-[30px] stroke-[--walty-orange]" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* ── row B : filters ──────────────────────────────── */}
        <nav className="overflow-x-auto whitespace-nowrap">
          <ul className="flex gap-14 py-2 font-serif text-[17px] font-semibold">
            {["Birthday for", "Age", "Style", "Interests","Sample", "Sample", "Sample", "Sample", "Sample"].map((label) => (
              <li key={label}>
                <button className="flex items-center gap-1 hover:text-[--walty-orange]">
                  {label} <span className="translate-y-[1px]">▾</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* full-width divider */}
      <div className="border-t border-[rgba(0,91,85,.18)]" />
    </header>
  );
}
