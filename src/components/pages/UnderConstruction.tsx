import "./UnderConstruction.css"
import { ColorProvider } from "../client/ColorProvider"
import Logo from "@/components/client/Logo"
export default function UnderConstruction(){
  return(
      <ColorProvider>
    <section className="section-regular underWrapper">
      <Logo />
      <span className="underConstructionText">UNDER CONSTRUCTION </span>
      <div className="newsletterWrapper">
        <input className="inputNewsletter" placeholder="Your Email"/>
        <button className="subscribe">SUBSCRIBE</button>
      </div>
    </section>
      </ColorProvider>
  )
}