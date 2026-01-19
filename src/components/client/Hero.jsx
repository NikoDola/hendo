"use client";
import { useRef, useEffect } from "react";
import "./Hero.css";
import Image from "next/image";
import Link from "next/link";

const getOffsetRem = () => {
  if (typeof window !== "undefined") {
    if (window.matchMedia("(max-width: 1000px)").matches) {
      return 5; // mobile
    }
  }
  return 10; // desktop
};

export default function Hero() {
  const fatherRef = useRef(null);
  const childRef = useRef(null);

  useEffect(() => {
    const father = fatherRef.current;
    const child = childRef.current;
    if (!father || !child) return;

    let OFFSET_REM = getOffsetRem();
    let OFFSET_PX = OFFSET_REM * 16;

    const onScroll = () => {
      const fatherRect = father.getBoundingClientRect();
      const childRect = child.getBoundingClientRect();

      // lock at bottom of father
      if (fatherRect.bottom <= childRect.height + OFFSET_PX) {
        child.style.position = "absolute";
        child.style.bottom = "0";
        child.style.top = "auto";
        child.style.left = "0";
        child.style.width = "100%";
      }
      // fixed inside viewport with offset
      else if (fatherRect.top <= -OFFSET_PX) {
        child.style.position = "fixed";
        child.style.top = `${OFFSET_REM}rem`;
        child.style.bottom = "auto";
        child.style.left = "0";
        child.style.width = "100%";
      }
    };

    const onResize = () => {
      OFFSET_REM = getOffsetRem();
      OFFSET_PX = OFFSET_REM * 16;
      onScroll();
    };

    // sync on load
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={fatherRef} className="hrsWrapper">
      <div ref={childRef} className="hrsHeadlineWrapper">
        <h1 data-text="LEVEL UP" className="hrsHeadline">LEVEL UP</h1>
        <p className="hrsJapan">レベルアップ</p>
      </div>

      <div className="hrsCtaWrapper">
        <p className="hrsDescription">
          Welcome to the Dreamstation. <br></br>A portal into the mind of T. HENDO where
          imagination becomes frequency, and sound becomes a world of its own.
        </p>
        <Link href="/about"><button>Read More</button></Link>
      </div>

      <div className="hrsImgWrapper">
        <Image
          src="/images/hendo/bg.webp"
          width={1000}
          height={300}
          alt="hendo background"
          className="bgImg"
          priority
        />
        <Image
          src="/images/hendo/hendo2025.webp"
          width={1000}
          height={300}
          alt="hendo"
          className="hendoImage"
          priority
        />
      </div>
    </div>
  );
}
