import "./globals.css"
import Contact from "@/components/client/Contact";
import Newsletter from "@/components/pages/Newsletter";
import Hero from "@/components/client/Hero"
export default function Home() {
  return (
    <main >
      <Hero />
      <Newsletter />
      <Contact />
    </main>

  );
}