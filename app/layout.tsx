import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "@/hooks/useCart";
import { ProductsProvider } from "@/hooks/useProducts";
import { WishlistProvider } from "@/hooks/useWishlist";
import { NotificationsProvider } from "@/hooks/useNotifications";
import { NotificationToasts } from "@/components/NotificationBell";
import { GoogleOAuthProvider } from "@react-oauth/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Shop. — Nepal's Trusted Online Pharmacy",
  description: "Genuine medicines, vitamins, and health products delivered across Nepal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${ibmPlexSans.variable}`}>
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <ThemeProvider>
            <ProductsProvider>
              <WishlistProvider>
                <CartProvider>
                  <NotificationsProvider>
                    <NotificationToasts />
                    {children}
                  </NotificationsProvider>
                </CartProvider>
              </WishlistProvider>
            </ProductsProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
