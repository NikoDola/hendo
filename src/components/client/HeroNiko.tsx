import "./HeroNiko.css";

import Image from "next/image";
export default function HeroSection() {
  return (
    <div className="hrsWrapper">
      <h1 className="hrsHeadline">LEVEL UP</h1>
      <div className="bodyTextWrapper">
      <p className="bodyText">Welcome to the DREAMSTATION. A portal into the mind of T. HENDO—where imagination becomes frequency, and sound becomes a world of its own.</p>
      <button>Read more</button>
      </div>
      <div className="hrsImageWrapper">
        <div className="bgWrapper">
          <Image
            className="bgImage"
            src={"/images/hendo/bg.webp"}
            width={1000}
            height={1000}
            alt="hendoImage"
            priority
            
          />
        </div>

        <Image
          className="hendoImage"
          src={"/images/hendo/2-hendo.webp"}
          width={1000}
          height={1000}
          alt="hendoImage"
          priority
         
        />
      </div>
    </div>
  );
}
