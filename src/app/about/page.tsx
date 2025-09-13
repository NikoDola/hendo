"use client";
import hendoImage from "../../../public/images/test2.png";
import "@/components/pages/about.css";

export default function About() {
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
        <div
          className="imageBackground"
          style={{
            backgroundImage: `url(${hendoImage})`,
          }}
        ></div>
      </div>
    </section>
  );
}
