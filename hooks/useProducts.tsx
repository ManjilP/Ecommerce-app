"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getProducts } from "@/lib/api";
import type { RealProduct } from "@/components/product-card";

interface ProductsContextValue {
  products: RealProduct[];
  loading: boolean;
  error: string;
  refresh: () => void;
}

const ProductsContext = createContext<ProductsContextValue>({ products: [], loading: false, error: "", refresh: () => {} });

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<RealProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    getProducts()
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : res.data.results ?? []))
      .catch(() => setError("Failed to load products. Please check your connection."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <ProductsContext.Provider value={{ products, loading, error, refresh }}>{children}</ProductsContext.Provider>;
}

export const useProducts = () => useContext(ProductsContext);
