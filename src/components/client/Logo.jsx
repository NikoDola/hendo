"use client"
import { useEffect, useRef } from "react"
import "./Logo.css"

export default function Logo() {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapperRef.current
    if (!wrap) return

    const letters = Array.from(wrap.querySelectorAll<HTMLSpanElement>(".letter"))
    const colors = [
      "hsl(317 100% 54%)",
      "hsl(190 100% 50%)",
      "hsl(120 100% 45%)",
      "hsl(50 100% 50%)",
      "hsl(280 100% 60%)",
      "hsl(0 100% 60%)",
      "hsl(30 100% 55%)"
    ]

    const handlers = letters.map((el, i) => {
      const activate = () => {
        el.style.color = colors[i]
        el.style.transform = "translateY(-1rem)"
      }
      const deactivate = () => {
        el.style.color = "white"
        el.style.transform = "translateY(0)"
      }

      // Mouse
      el.addEventListener("mouseenter", activate)
      el.addEventListener("mouseleave", deactivate)

      // Touch / hold
      el.addEventListener("touchstart", activate)
      el.addEventListener("touchend", deactivate)
      el.addEventListener("touchcancel", deactivate)

      return { el, activate, deactivate }
    })

    return () => {
      handlers.forEach(({ el, activate, deactivate }) => {
        el.removeEventListener("mouseenter", activate)
        el.removeEventListener("mouseleave", deactivate)
        el.removeEventListener("touchstart", activate)
        el.removeEventListener("touchend", deactivate)
        el.removeEventListener("touchcancel", deactivate)
      })
    }
  }, [])

  return (
    <div ref={wrapperRef} className="logoWrapper">
      <span className="letter">T</span>
      <span className="letter">.</span>
      <span className="letter">H</span>
      <span className="letter">E</span>
      <span className="letter">N</span>
      <span className="letter">D</span>
      <span className="letter">O</span>
    </div>
  )
}
