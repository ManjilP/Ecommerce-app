"use client";
import React, { useState } from "react";
import { Heart, ShoppingBag, Star, ImageIcon } from "lucide-react";

interface Product {
  id: number;
  name: string;
  sku?: string;
  category: string;
  price: number | string;
  image?: string;
  salePrice?: number;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
}

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  addingToWishlist?: boolean;
  onAddToCart?: (product: Product) => void;
  onToggleWishlist?: (productId: number) => void;
}

export default function ProductCard({
  product,
  isWishlisted = false,
  addingToWishlist = false,
  onAddToCart,
  onToggleWishlist,
}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);

  const inStock = product.inStock !== false;
  const rating = product.rating ?? null;
  const salePrice = product.salePrice ?? null;
  const price = parseFloat(String(product.price));

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl border overflow-hidden flex flex-col transition-all duration-300"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
        boxShadow: hovered ? "0 20px 48px rgba(0,0,0,0.15)" : "var(--card-shadow)",
        transform: hovered ? "translateY(-5px)" : "translateY(0)",
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: "200px", background: "var(--card-2)" }}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-4 transition-transform duration-500"
            style={{ transform: hovered ? "scale(1.08)" : "scale(1)" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={40} color="var(--border-strong)" />
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={() => onToggleWishlist?.(product.id)}
          disabled={addingToWishlist}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-md"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        >
          <Heart
            size={14}
            fill={isWishlisted ? "#ff3b30" : "none"}
            color={isWishlisted ? "#ff3b30" : "var(--text-3)"}
          />
        </button>

        {/* Sale badge */}
        {salePrice && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow">
            -{Math.round(((price - salePrice) / price) * 100)}%
          </div>
        )}

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
            <span className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold text-sm">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#0071e3" }}>
          {product.category}
        </span>

        <h3 className="font-semibold leading-tight line-clamp-2" style={{ fontSize: "15px", color: "var(--text)" }}>
          {product.name}
        </h3>

        {/* Stars */}
        {rating !== null && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={13}
                className={i < Math.floor(rating) ? "text-yellow-400 fill-current" : ""}
                style={{ color: i < Math.floor(rating) ? "#fbbf24" : "var(--border-strong)" }}
              />
            ))}
            {product.reviews && (
              <span className="text-xs ml-1" style={{ color: "var(--text-3)" }}>
                ({product.reviews})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mt-1">
          {salePrice ? (
            <>
              <span className="font-bold text-base text-red-500">
                Rs. {salePrice.toFixed(2)}
              </span>
              <span className="text-sm line-through" style={{ color: "var(--text-3)" }}>
                Rs. {price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="font-bold text-base" style={{ color: "var(--text)" }}>
              Rs. {price.toFixed(2)}
            </span>
          )}
          {inStock && (
            <span className="ml-auto text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
              In Stock
            </span>
          )}
        </div>

        {/* Button */}
        <button
          onClick={() => onAddToCart?.(product)}
          disabled={!inStock}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200"
          style={{
            background: inStock ? "rgba(0,113,227,0.85)" : "var(--card-2)",
            color: inStock ? "#fff" : "var(--text-3)",
            backdropFilter: inStock ? "blur(12px)" : "none",
            border: inStock ? "1px solid rgba(0,113,227,0.4)" : "1px solid var(--border)",
            boxShadow: inStock ? "0 4px 20px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)" : "none",
            cursor: inStock ? "pointer" : "not-allowed",
          }}
          onMouseEnter={e => { if (inStock) e.currentTarget.style.background = "rgba(0,113,227,1)"; }}
          onMouseLeave={e => { if (inStock) e.currentTarget.style.background = "rgba(0,113,227,0.85)"; }}
        >
          <ShoppingBag size={15} />
          {inStock ? "Order Now" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}
