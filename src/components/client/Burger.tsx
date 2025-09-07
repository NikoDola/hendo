// Burger.tsx
"use client"
import "./Burger.css"
type BurgerProps = {
  fun: () => boolean
  open?: boolean
}
export default function Burger({ fun, open = false}: BurgerProps) {
  return (
    <div
      aria-label="Toggle menu"
      aria-expanded={open}
      onClick={() => { fun() }}
      className={`burger ${open ? "is-open" : ""}`}
    >
      {open ? "x" : "="}
    </div>
  )
}
