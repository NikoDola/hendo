import "./HeroNiko.css";
import Link from "next/link";
import Image from "next/image";
export default function HeroSection() {
  return (
    <div className="hrsWrapper">
      <div className="hrsHeadlineWrapper">
      <h1 className="hrsHeadline">LEVEL UP</h1>
      <p className="japanLetters">レベルアップ</p>
      </div>

      <div className="bodyTextWrapper">
      <p className="bodyText">Welcome to the <br/> Dreamstation. A portal into the mind of T. HENDO—where imagination becomes frequency, and sound becomes a world of its own.</p>
      <Link href={"/about"}><button>Read more</button></Link>
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
          src={"/images/hendo/hendo2025.webp"}
          width={1000}
          height={1000}
          alt="hendoImage"
          priority
         
        />
      </div>
    </div>
  );
}
