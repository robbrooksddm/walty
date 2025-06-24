"use client";
import { useEffect, useState } from "react";

export function useAddressAssignments() {
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.localStorage.getItem("addressAssignments") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("addressAssignments", JSON.stringify(assignments));
    } catch {
      // ignore
    }
  }, [assignments]);

  const assign = (itemId: string, addrId: string) => {
    setAssignments((prev) => ({ ...prev, [itemId]: addrId }));
  };

  return { assignments, assign };
}
