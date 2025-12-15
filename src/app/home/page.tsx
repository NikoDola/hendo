import "../globals.css"
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import HeroNiko from "@/components/client/HeroNiko";

import Link from "next/link";
import HomeMusicSectionServer from "@/components/server/HomeMusicSectionServer";

export const metadata: Metadata = {
  title: "T.Hendo - Home",
  description: "Discover premium music beats and exclusive tracks with full rights.",
};

// Lazy load below-the-fold components
const Newsletter = dynamic(() => import("@/components/pages/Newsletter"), {
  loading: () => <div style={{ minHeight: '300px' }} />,
});
const Contact = dynamic(() => import("@/components/client/Contact"), {
  loading: () => <div style={{ minHeight: '400px' }} />,
});

export default function Home() {
  return (
    <main>
      <section className="section-full mt-0" >
      <HeroNiko />
      </section>

      <section className="section-regular">
        <HomeMusicSectionServer />
        <Link href="/music" className="view-more">
          view more bits
        </Link>
      </section>
     
     <section className="section-regular">
        <Newsletter />
     </section>

         
     <section className="section-regular">
        <Contact />
     </section>
      
    
    </main>
  );
}

