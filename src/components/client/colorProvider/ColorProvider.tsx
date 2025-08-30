"use client";

import React, { useEffect, useRef, useState } from "react";

const colors = [
  "hsl(317 100% 54%)", // neon pink
  "hsl(190 100% 50%)", // neon cyan
  "hsl(120 100% 45%)", // neon green
  "hsl(50 100% 50%)",  // neon yellow
  "hsl(280 100% 60%)", // neon purple
  "hsl(0 100% 60%)",   // neon red
  "hsl(30 100% 55%)"   // neon orange
];


export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [i, setI] = useState(0);
  const palRef = useRef(colors);

  useEffect(() => {
    const id = setInterval(() => {
      setI((prev) => (prev + 1) % palRef.current.length);
    }, 3000); // change every 1s
    return () => clearInterval(id);
  }, []);

  const color = palRef.current[i];

  return (
    <div style={{ "--theme-color": color } as React.CSSProperties}>
      {children}
    </div>
  );
}
