"use client";
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShoppingBag, X } from "lucide-react";
import { getCart, addToCart, updateCartItem, removeCartItem, getSavedItems, saveForLater as apiSaveForLater, moveToCart as apiMoveToCart, deleteSavedItem } from "@/lib/api";

export interface CartItem {
  id: number;
  product: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  stock?: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  loading: boolean;
  refresh: () => void;
  addItem: (productId: number, quantity?: number, optimisticInfo?: { name: string; price: number; image?: string; stock?: number }) => Promise<void>;
  updateQty: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  mergeGuestCart: () => Promise<void>;
  savedItems: CartItem[];
  saveItemForLater: (item: CartItem) => Promise<void>;
  moveSavedToCart: (item: CartItem) => Promise<void>;
  removeSavedItem: (id: number) => Promise<void>;
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
  mergeGuestCart: async () => {},
  savedItems: [],
  saveItemForLater: async () => {},
  moveSavedToCart: async () => {},
  removeSavedItem: async () => {},
});

const GUEST_CART_KEY = "guest_cart";

const isAuthed = () => typeof window !== "undefined" && !!sessionStorage.getItem("access_token");

function readGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartItem[]) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota / serialization errors */
  }
}

function clearGuestCart() {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    /* ignore */
  }
}

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

interface CartToast {
  key: number;
  name: string;
  image?: string;
  quantity: number;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<CartToast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((info: { name: string; image?: string; quantity: number }) => {
    setToast({ ...info, key: Date.now() });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const refresh = useCallback(() => {
    // Guests keep their cart in localStorage until they log in
    if (!isAuthed()) {
      setItems(readGuestCart());
      setSavedItems([]);
      return;
    }
    setLoading(true);
    getCart()
      .then((r) => setItems(normalizeCart(r.data)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    // Saved-for-later list (server-side; logged-in only)
    getSavedItems()
      .then((r) => setSavedItems(normalizeCart(r.data)))
      .catch(() => setSavedItems([]));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addItem = async (productId: number, quantity = 1, optimisticInfo?: { name: string; price: number; image?: string; stock?: number }) => {
    const stock = optimisticInfo?.stock;
    // Don't let a product be added beyond what the backend has in stock
    const cap = (qty: number) => (typeof stock === "number" ? Math.min(qty, stock) : qty);
    if (typeof stock === "number" && stock <= 0) return;

    showToast({ name: optimisticInfo?.name ?? "Item", image: optimisticInfo?.image, quantity });

    const buildItem = (): CartItem => ({
      id: -Date.now(),
      product: productId,
      name: optimisticInfo?.name ?? "",
      price: optimisticInfo?.price ?? 0,
      image: optimisticInfo?.image,
      quantity: cap(quantity),
      stock,
    });

    // Guest: persist to localStorage so the cart survives until (and through) login
    if (!isAuthed()) {
      setItems((prev) => {
        const existing = prev.find((i) => i.product === productId);
        const next = existing
          ? prev.map((i) => (i.product === productId ? { ...i, quantity: cap(i.quantity + quantity), stock: stock ?? i.stock } : i))
          : [...prev, buildItem()];
        writeGuestCart(next);
        return next;
      });
      return;
    }

    const previousItems = items;
    setItems((prev) => {
      const existing = prev.find((i) => i.product === productId);
      if (existing) {
        return prev.map((i) => (i.product === productId ? { ...i, quantity: cap(i.quantity + quantity), stock: stock ?? i.stock } : i));
      }
      return [...prev, buildItem()];
    });
    try {
      await addToCart(productId, quantity);
      refresh();
    } catch {
      setItems(previousItems);
    }
  };

  const updateQty = async (itemId: number, quantity: number) => {
    // Clamp against the item's known stock so you can't exceed what's available
    const clampToStock = (i: CartItem, q: number) =>
      typeof i.stock === "number" ? Math.min(q, i.stock) : q;

    if (!isAuthed()) {
      setItems((prev) => {
        const next = prev.map((i) => (i.id === itemId ? { ...i, quantity: clampToStock(i, quantity) } : i));
        writeGuestCart(next);
        return next;
      });
      return;
    }
    const target = items.find((i) => i.id === itemId);
    const capped = target ? clampToStock(target, quantity) : quantity;
    const previousItems = items;
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: capped } : i)));
    try {
      await updateCartItem(itemId, capped);
      refresh();
    } catch {
      setItems(previousItems);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!isAuthed()) {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== itemId);
        writeGuestCart(next);
        return next;
      });
      return;
    }
    const previousItems = items;
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await removeCartItem(itemId);
      refresh();
    } catch {
      setItems(previousItems);
    }
  };

  // Push the guest (localStorage) cart to the server after login, then reload from server.
  const mergeGuestCart = useCallback(async () => {
    if (!isAuthed()) return;
    const guestItems = readGuestCart();
    if (guestItems.length) {
      // Add sequentially so backend quantity-merge stays predictable
      for (const it of guestItems) {
        try {
          await addToCart(it.product, it.quantity);
        } catch {
          /* skip items that fail (e.g. out of stock); keep going */
        }
      }
      clearGuestCart();
    }
    refresh();
  }, [refresh]);

  // ── Save for later (logged-in users only; the list lives on the server) ──
  const saveItemForLater = async (item: CartItem) => {
    if (!isAuthed()) return;
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setSavedItems((prev) => (prev.some((s) => s.product === item.product) ? prev : [...prev, item]));
    try {
      await apiSaveForLater(item.product);
    } finally {
      refresh();
    }
  };

  const moveSavedToCart = async (item: CartItem) => {
    if (!isAuthed()) return;
    setSavedItems((prev) => prev.filter((s) => s.id !== item.id));
    setItems((prev) => (prev.some((i) => i.product === item.product) ? prev : [...prev, item]));
    try {
      await apiMoveToCart(item.product);
    } finally {
      refresh();
    }
  };

  const removeSavedItem = async (id: number) => {
    setSavedItems((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteSavedItem(id);
    } finally {
      refresh();
    }
  };

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, count, subtotal, loading, refresh, addItem, updateQty, removeItem, mergeGuestCart, savedItems, saveItemForLater, moveSavedToCart, removeSavedItem }}>
      {children}
      <AddedToCartToast toast={toast} onClose={() => setToast(null)} />
    </CartContext.Provider>
  );
}

function AddedToCartToast({ toast, onClose }: { toast: CartToast | null; onClose: () => void }) {
  const hasValidImage = !!toast?.image && /^(https?:\/\/|\/)/.test(toast.image);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.key}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="fixed bottom-5 right-5 z-[120] w-[min(92vw,360px)]"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card shadow-2xl p-3 pr-2.5">
            <div className="w-12 h-12 rounded-xl bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
              {hasValidImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={toast.image} alt={toast.name} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag size={20} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Check size={13} /> Added to cart
              </p>
              <p className="text-sm font-medium text-foreground truncate">{toast.name}</p>
            </div>
            <button
              onClick={() => { window.dispatchEvent(new CustomEvent("open-cart")); onClose(); }}
              className="flex-shrink-0 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              View Cart
            </button>
            <button
              onClick={onClose}
              aria-label="Dismiss"
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const useCart = () => useContext(CartContext);
