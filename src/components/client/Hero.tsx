"use client"
import { useEffect, useState } from "react";
import "./Hero.css";
import Image from "next/image";

export default function Hero() {
  const [opacity, setOpacity] = useState(1)

 const [scrollPercent, setScrollPercent] = useState(0);

useEffect(() => {
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (scrollTop / docHeight) * 100;
    setScrollPercent(scrolled);

    // Fade out gradually between 0% and 20%
    let newOpacity;
    if (scrolled <= 0) newOpacity = 1;
    else if (scrolled >= 30) newOpacity = 0;
    else newOpacity = 1 - scrolled / 30; // linear fade

    setOpacity(newOpacity);
  };

  window.addEventListener("scroll", handleScroll);
  handleScroll();

  return () => window.removeEventListener("scroll", handleScroll);
}, [scrollPercent]);



    

  return (
    <div className="heroWrapper">
      <div className="imageWrapper">
        <div className="imageBg"></div>
        <Image
          className="hendoImage"
          src={"/images/hendo/1.png"}
          height={300}
          width={400}
          alt="hendo image"
        />
      </div>
      <div className="textWrapper" style={{opacity: opacity}}>
        <span>L</span>
        <span>E</span>
        <span>V</span>
        <span>E</span>
        <span className="letterL">L</span>
        <span>U</span>
        <span>P</span>
      </div>
    </div>
  );
}
