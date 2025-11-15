import "../globals.css"
import Contact from "@/components/client/Contact";
import Newsletter from "@/components/pages/Newsletter";
import Hero from "@/components/client/Hero";
import HomeMusicSection from "@/components/HomeMusicSection";

export default function Home() {
  return (
    <main>
      <section className="section-regular">
        <Hero />
      </section>

      <section className="section-full">
        <HomeMusicSection />
            <button className="flex align-centerr">view more</button>
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

