"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type MousePosition = { x: number; y: number }

const MouseContext = createContext<MousePosition | null>(null)

export function MouseProvider({ children }: { children: ReactNode }) {
  const [pos, setPos] = useState<MousePosition>({ x: 0, y: 0 })

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMove)
    return () => window.removeEventListener("mousemove", handleMove)
  }, [])

  return <MouseContext.Provider value={pos}>{children}</MouseContext.Provider>
}

export function useMouse() {
  const ctx = useContext(MouseContext)
  if (!ctx) throw new Error("useMouse must be used inside MouseProvider")
  return ctx
}
