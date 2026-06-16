import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";

const raleway = Raleway({ variable: "--font-raleway", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Inventory Manager",
  description: "Professional Inventory & Order Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={raleway.variable}>
      <body>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <ThemeProvider>{children}</ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
