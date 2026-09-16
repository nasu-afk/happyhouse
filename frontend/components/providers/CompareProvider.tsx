"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { PropertyCard } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

const STORAGE_KEY = "happyhouse:compare";
const MAX_COMPARE = 3;

interface CompareContextValue {
  compareList: PropertyCard[];
  isComparing: (id: number) => boolean;
  toggleCompare: (property: PropertyCard) => void;
  clearCompare: () => void;
  maxCompare: number;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<PropertyCard[]>([]);
  const [loaded, setLoaded] = useState(false);
  const toast = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompareList(JSON.parse(raw));
    } catch {
      // corrupted or inaccessible storage — start fresh rather than crash
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList));
  }, [compareList, loaded]);

  function isComparing(id: number) {
    return compareList.some((p) => p.id === id);
  }

  function toggleCompare(property: PropertyCard) {
    setCompareList((prev) => {
      if (prev.some((p) => p.id === property.id)) {
        return prev.filter((p) => p.id !== property.id);
      }
      if (prev.length >= MAX_COMPARE) {
        toast(`You can compare up to ${MAX_COMPARE} properties at a time.`, "error");
        return prev;
      }
      return [...prev, property];
    });
  }

  function clearCompare() {
    setCompareList([]);
  }

  return (
    <CompareContext.Provider value={{ compareList, isComparing, toggleCompare, clearCompare, maxCompare: MAX_COMPARE }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
