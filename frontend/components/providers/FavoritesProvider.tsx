"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { PropertyCard } from "@/lib/types";

const STORAGE_KEY = "happyhouse:favorites";

interface FavoritesContextValue {
  favorites: PropertyCard[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (property: PropertyCard) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<PropertyCard[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {
      // corrupted or inaccessible storage — start fresh rather than crash
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return; // don't overwrite storage with [] before the initial read completes
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, loaded]);

  function isFavorite(id: number) {
    return favorites.some((f) => f.id === id);
  }

  function toggleFavorite(property: PropertyCard) {
    setFavorites((prev) =>
      prev.some((f) => f.id === property.id)
        ? prev.filter((f) => f.id !== property.id)
        : [...prev, property]
    );
  }

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
