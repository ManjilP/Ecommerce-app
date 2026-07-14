"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getWishlist, addToWishlist, removeFromWishlist } from "@/lib/api";

interface WishlistContextValue {
  wishlistMap: Record<number, number>;
  count: number;
  refresh: () => void;
  toggle: (productId: number) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue>({
  wishlistMap: {},
  count: 0,
  refresh: () => {},
  toggle: async () => {},
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistMap, setWishlistMap] = useState<Record<number, number>>({});

  const refresh = useCallback(() => {
    if (!sessionStorage.getItem("access_token")) return;
    getWishlist()
      .then((res) => {
        const items: { id: number; product: number | { id: number } }[] = Array.isArray(res.data)
          ? res.data
          : res.data.results ?? [];
        const map: Record<number, number> = {};
        items.forEach((item) => {
          const productId = typeof item.product === "object" ? item.product.id : item.product;
          map[productId] = item.id;
        });
        setWishlistMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (productId: number) => {
    if (!sessionStorage.getItem("access_token")) return;
    try {
      if (wishlistMap[productId]) {
        await removeFromWishlist(wishlistMap[productId]);
        setWishlistMap((prev) => { const next = { ...prev }; delete next[productId]; return next; });
      } else {
        const res = await addToWishlist(productId);
        setWishlistMap((prev) => ({ ...prev, [productId]: res.data.id }));
      }
    } catch {}
  };

  const count = Object.keys(wishlistMap).length;

  return (
    <WishlistContext.Provider value={{ wishlistMap, count, refresh, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
