"use client";

import { usePathname } from "next/navigation";
import WaltyNav from "./WaltyNav";

export default function WaltyNavWrapper() {
  const pathname = usePathname() || "";

  const hide =
    pathname.startsWith("/admin") ||
    /^\/cards\/[^/]+\/customise/.test(pathname);

  if (hide) return null;

  return <WaltyNav />;
}