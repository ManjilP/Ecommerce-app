"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getCart, addToCart, updateCartItem, removeCartItem } from "@/lib/api";

export interface CartItem {
  id: number;
  product: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  loading: boolean;
  refresh: () => void;
  addItem: (productId: number, quantity?: number, optimisticInfo?: { name: string; price: number; image?: string }) => Promise<void>;
  updateQty: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  count: 0,
  subtotal: 0,
  loading: false,
  refresh: () => {},
  addItem: async () => {},
  updateQty: async () => {},
  removeItem: async () => {},
});

// GET /api/cart/ response shape isn't documented in swagger — normalize defensively
function normalizeCart(data: unknown): CartItem[] {
  const raw = (data as { items?: unknown[]; cart_items?: unknown[] })?.items
    ?? (data as { cart_items?: unknown[] })?.cart_items
    ?? (Array.isArray(data) ? data : []);

  return (raw as Record<string, unknown>[]).map((it) => {
    const product = it.product as Record<string, unknown> | number | undefined;
    const productObj = typeof product === "object" && product !== null ? product : undefined;
    return {
      id: it.id as number,
      product: (productObj?.id as number) ?? (product as number) ?? (it.product_id as number),
      name: (productObj?.name as string) ?? (it.product_name as string) ?? (it.name as string) ?? "",
      price: parseFloat(String(productObj?.price ?? it.price ?? 0)),
      image: (productObj?.image as string) ?? (it.image as string),
      quantity: (it.quantity as number) ?? 1,
    };
  });
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!sessionStorage.getItem("access_token")) return;
    setLoading(true);
    getCart()
      .then((r) => setItems(normalizeCart(r.data)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = async (productId: number, quantity = 1, optimisticInfo?: { name: string; price: number; image?: string }) => {
    if (!sessionStorage.getItem("access_token")) {
      window.location.href = "/login";
      return;
    }
    const previousItems = items;
    setItems((prev) => {
      const existing = prev.find((i) => i.product === productId);
      if (existing) {
        return prev.map((i) => (i.product === productId ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [
        ...prev,
        {
          id: -Date.now(),
          product: productId,
          name: optimisticInfo?.name ?? "",
          price: optimisticInfo?.price ?? 0,
          image: optimisticInfo?.image,
          quantity,
        },
      ];
    });
    try {
      await addToCart(productId, quantity);
      refresh();
    } catch {
      setItems(previousItems);
    }
  };

  const updateQty = async (itemId: number, quantity: number) => {
    const previousItems = items;
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
    try {
      await updateCartItem(itemId, quantity);
      refresh();
    } catch {
      setItems(previousItems);
    }
  };

  const removeItem = async (itemId: number) => {
    const previousItems = items;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await removeCartItem(itemId);
      refresh();
    } catch {
      setItems(previousItems);
    }
  };

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, loading, refresh, addItem, updateQty, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
