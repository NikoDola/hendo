import "@/components/pages/Auth.css";
import Link from "next/link";

export default function Login() {
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
        <button>Login</button>
        <div className="orWrapper">
          <div className="hrLine" />
          <p>or</p>
          <div className="hrLine" />
        </div>
        <button className="googleButton">
          <div className="googleIcon"></div>
          Login with Google
        </button>
        <div className="orSignupWrapper">
          <p className="italic"> Don&apos;t have an account? <Link className="underline" href={"/signup"}>signup</Link></p>
        </div>
      </form>
    </section>
  );
}
