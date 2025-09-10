"use client"
import { useEffect, useRef } from "react"
import "./Logo.css"

export default function Logo({size = "30px"}) {
  const wrapperRef = useRef(null)

  useEffect(() => {
    const wrap = wrapperRef.current
    if (!wrap) return

    const letters = Array.from(wrap.querySelectorAll(".letter"))
    const colors = [
  "hsl(317 100% 54%)",
  "hsl(190 100% 50%)",
  "hsl(120 100% 45%)", 
  "hsl(50 100% 50%)", 
  "hsl(280 100% 60%)", 
  "hsl(0 100% 60%)",   
  "hsl(30 100% 55%)" 
];

    const handlers = letters.map((el, i) => {
      const enter = () => { 
        el.style.color = colors[i] 
        el.style.transform = "translateY(-30%)"
      }
      const leave = () => { 
        el.style.color = "white" 
        el.style.transform = "translateY(0)"
      }
      el.addEventListener("mouseenter", enter)
      el.addEventListener("mouseleave", leave)
      return { el, enter, leave }
    })

    return () => {
      handlers.forEach(({ el, enter, leave }) => {
        el.removeEventListener("mouseenter", enter)
        el.removeEventListener("mouseleave", leave)
      })
    }
  }, [])

  return (
    <div ref={wrapperRef} className="logoWrapper">
      <span style={{fontSize: size}} className="letter">T</span>
      <span style={{fontSize: size}} className="letter">.</span>
      <span style={{fontSize: size}} className="letter">H</span>
      <span style={{fontSize: size}} className="letter">E</span>
      <span style={{fontSize: size}} className="letter">N</span>
      <span style={{fontSize: size}} className="letter">D</span>
      <span style={{fontSize: size}} className="letter">O</span>
    </div>
  )
}
