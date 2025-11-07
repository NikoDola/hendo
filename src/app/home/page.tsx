import "../globals.css"
import Contact from "@/components/client/Contact";
import Newsletter from "@/components/pages/Newsletter";
import Hero from "@/components/client/Hero";
import MusicStore from "@/app/music/page";

export default function Home() {
  return (
    <main>
      <Hero />
      <MusicStore />
      <Newsletter />
      <Contact />
    </main>
  );
}

