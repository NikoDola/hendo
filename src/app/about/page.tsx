"use client";
import { useState, useEffect } from "react";
import hendoImage from "../../../public/images/test2.png";
import "@/components/pages/about.css";

export default function About() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (hendoImage?.src) {
      const img = new Image();
      img.src = hendoImage.src;
      img.onload = () => setLoaded(true);
    }
  }, []);

  return (
    <section className="section-full aboutSection">
      <div className="aboutTextWrapper">
        <h1 className="aboutHeadline">
          Welcome to the<br/>DREAMSTATION.
        </h1>

        {/* Glass box */}
        <div className="glass-effect aboutContentBox">
          <p>
            A portal into the mind of T. HENDO where imagination becomes frequency,
            and sound becomes a world of its own.
          </p>

          <p>
            Here, he channels the dream-capsules of virtual energy of his childhood
            games, music, art, pixels, fantasy and fuses it with modern vibrations
            of R&amp;B, Rap, Rock, Pop, and any genre he dares to explore.
            Every beat carries the unmistakable rhythm of Chicago.
          </p>

          <blockquote className="aboutQuote">
            It&apos;s my passion to build complex, dreamy soundscapes that make people feel.
            To sing, rap, groove, and escape. I create to uplift, inspire,
            and give the world something dope to experience.
          </blockquote>
        </div>

        <div className="aboutFooter">
          <h2>LEVEL UP.</h2>
        </div>
      </div>

      {loaded && (
        <div
          className="imageBackground"
          style={{
            backgroundImage: `url(${hendoImage.src})`,
          }}
        />
      )}
    </section>
  );
}
