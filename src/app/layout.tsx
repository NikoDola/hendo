import type { Metadata } from "next";
import "@/app/globals.css";
import localFont from "next/font/local";
import { MouseProvider } from "@/context/context";
// import NavBar from "@/components/client/NavBar";
import LiquidEther from "@/components/client/backgrounds/LiquidEther";
// import LiquidChrome from "@/components/client/LiquidEther";


const lemonMilk = localFont({
  src: [
    { path: "../../public/fonts/LEMONMILK-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/LEMONMILK-LightItalic.woff2", weight: "300", style: "italic" },
    { path: "../../public/fonts/LEMONMILK-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/LEMONMILK-MediumItalic.woff2", weight: "500", style: "italic" },
    { path: "../../public/fonts/LEMONMILK-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/LEMONMILK-BoldItalic.woff2", weight: "700", style: "italic" },
  ],
  display: "swap",
  preload: true,
  variable: "--font-lemonmilk",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "T.HENDO",
  description: "Dark vibes, heavy drops & energy that shakes the room. T.Hendo is here to bend sound, break limits, and turn every beat into a story you feel in your bones.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${lemonMilk.variable} antialiased relative`}>



        <div style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 0, pointerEvents: 'auto' }}>
          {/* <LiquidChrome
    baseColor={[0.1, 0.1, 0.1]}
    speed={1}
    amplitude={0.6}
    interactive={true}
  /> */}
          <LiquidEther
            colors={['#5227FF', '#FF9FFC', '#B19EEF']}
            mouseForce={50}
            cursorSize={15}
            isViscous={false}
            viscous={20}
            iterationsViscous={16}
            iterationsPoisson={16}
            resolution={0.1}
            isBounce={false}
            autoDemo={false}
            autoSpeed={1}
            autoIntensity={1.5}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>
        <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'none' }}>
          <MouseProvider>
            <div style={{ pointerEvents: 'auto' }}>
              {/* <NavBar /> */}
            </div>
            <div style={{
              pointerEvents: 'auto',
              minHeight: '100vh',
              position: 'relative'
            }}>
              {children}
            </div>
          </MouseProvider>
        </div>
      </body>
    </html>
  );
}
