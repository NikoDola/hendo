import "./Hero2.css";
import Image from "next/image";

export default function Hero2() {
  return (
    <div className="heroWrapper">
      <div className="heroTextWrapper">
        <h1 className="headlineText">Level Up</h1>
        
      </div>
      <div className="HeroimageWrapper">
        <Image 
        className="bgImage"
        src={"/images/hendo/1-bg.webp"}
        width={1000} 
        height={1000} 
        alt="hendo image" 
        />
      </div>
    </div>
  );
}
