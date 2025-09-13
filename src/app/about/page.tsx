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

      img.onload = () => {
        // Wait a tiny bit to ensure first paint is done before showing
        setTimeout(() => setLoaded(true), 50);
      };
    }
  }, []);

  return (
    <section className="section-full aboutSection">
      <div className="aboutTextWrapper">
        <h1 className="aboutHeadline">
          Waves <br /> Beyond 5D
        </h1>
        <p className="aboutBodyText">
          My beats are more than sound—they’re portals. Born from the limitless
          depths of the subconscious and the expansive 5D realm, they channel
          otherworldly inspiration into living, breathing soundscapes. Each
          rhythm weaves raw imagination with untamed creativity, shattering
          boundaries and opening doors to entirely new sonic dimensions. This is
          music as transcendence—crafted with unrivaled sonic mastery—where
          every pulse lifts you higher, ignites euphoria, and transforms the
          ordinary into the extraordinary.
        </p>
      </div>

      <div className="imageWrapper">
        {/** ✅ Only render when loaded = true */}
        {loaded && (
          <div
            className="imageBackground animate"
            style={{
              backgroundImage: `url(${hendoImage.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          ></div>
        )}
      </div>
    </section>
  );
}
