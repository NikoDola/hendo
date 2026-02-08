import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Hero from "@/components/client/Hero.jsx"
import Contact from "@/components/client/Contact";


import Link from "next/link";
import HomeMusicSectionServer from "@/components/server/HomeMusicSectionServer";

export const metadata: Metadata = {
  title: "T.Hendo - Home",
  description: "Discover premium music beats and exclusive tracks with full rights.",
  openGraph: {
    title: "T.Hendo - Home",
    description: "Discover premium music beats and exclusive tracks with full rights.",
    url: 'https://thelegendofhendo.com', 
    siteName: 'T.Hendo Music',
    images: [
      {
        // This points to the file you just put in the public folder
        url: 'https://thelegendofhendo.com/hendo-og.jpg', 
        width: 1200,
        height: 630,
        alt: 'T.Hendo Music Beats',
      },
    ],
    type: 'website',
  },
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

