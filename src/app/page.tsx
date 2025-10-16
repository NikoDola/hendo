import "./globals.css"
import Contact from "@/components/pages/Contact";
import Newsletter from "@/components/pages/Newsletter";
import Hero2 from "@/components/client/Hero2"
export default function Home() {
  return (
    <main >
      <Hero2 />
      <Newsletter />
      <Contact />
    </main>

  );
}