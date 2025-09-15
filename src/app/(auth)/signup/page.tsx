import "@/components/pages/Auth.css";
import Link from "next/link";

export default function Signup() {
  return (
    <section className="section-regular">
      <form className="authWrapper">
        <div className="inputWrapper">
          <label>Email</label>
          <input placeholder="Enter your email" />
        </div>
        <div className="inputWrapper">
          <label>Password</label>
          <input placeholder="Enter your Password" />
        </div>
        <div className="inputWrapper">
          <label>Repeat Password</label>
          <input placeholder="Repeat your Password" />
        </div>
        <button>Signup</button>
        <div className="orWrapper">
          <div className="hrLine" />
          <p>or</p>
          <div className="hrLine" />
        </div>
        <button className="googleButton">
          <div className="googleIcon"></div>
          Signup with Google
        </button>
        <div className="orSignupWrapper">
          <p className="italic"> Already have an account? <Link className="underline" href={"/login"}>login</Link></p>
        </div>
      </form>
    </section>
  );
}
