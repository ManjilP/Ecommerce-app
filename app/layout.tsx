import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shop. — Nepal's Trusted Online Pharmacy",
  description: "Genuine medicines, vitamins, and health products delivered across Nepal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cormorant.variable}>
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <ThemeProvider>{children}</ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
