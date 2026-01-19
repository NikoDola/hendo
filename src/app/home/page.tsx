"use effect"
import "../globals.css"
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Hero from "@/components/client/Hero.jsx"
import Contact from "@/components/client/Contact";


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


export default function Home() {
  
  return (
    <main>
      <section className="section-full hrsWrapper" >
    <Hero />
      </section>
      <section className="section-regular secondSection">
        <HomeMusicSectionServer />
        <Link href="/music" className="view-more">
          view more beats
        </Link>
      </section>
      <section className="section-regular">
        <Newsletter />
      </section>
    </main>
  );
}

