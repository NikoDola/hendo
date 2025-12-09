import type { Metadata } from "next";
import "@/app/globals.css";
import localFont from "next/font/local";
import { MouseProvider } from "@/context/context";
import ConditionalNavbar from "@/components/client/ConditionalNavbar";
import ConditionalFooter from "@/components/client/ConditionalFooter";
import { ColorProvider } from "@/components/client/ColorProvider";
import BackgroundEffects from "@/components/client/BackgroundEffects";
import { UserAuthProvider } from "@/context/UserAuthContext";
import { ColorToggleProvider } from "@/context/ColorToggleContext";
import { CartProvider } from "@/context/CartContext";
import { Roboto } from "next/font/google";


const lemonMilk = localFont({
  src: [
    { path: "../../public/fonts/LEMONMILK-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/LEMONMILK-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  preload: true,
  variable: "--font-lemonmilk",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"], // choose the weights you need
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "T.Hendo - Premium Music Beats & Rights",
  description: "Discover and purchase exclusive music tracks with full rights. Premium beats for your creative projects.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "black" }} className={`${lemonMilk.variable} antialiased relative`}>
        <ColorToggleProvider>
          <ColorProvider>
            <BackgroundEffects />
            <MouseProvider>
              <UserAuthProvider>
                <CartProvider>
                  <ConditionalNavbar />
                  <div className="mainContent">
                    {children}
                  </div>
                  <ConditionalFooter />
                </CartProvider>
              </UserAuthProvider>
            </MouseProvider>
          </ColorProvider>
        </ColorToggleProvider>
      </body>
    </html>
  );
}
