import "../globals.css"
import Contact from "@/components/client/Contact";
import Newsletter from "@/components/pages/Newsletter";
import Hero from "@/components/client/Hero";
import HomeMusicSection from "@/components/HomeMusicSection";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="section-regular">
        <Hero />
      </section>

      <section className="section-regular">
        <HomeMusicSection />
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

