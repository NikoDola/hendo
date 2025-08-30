"use client"
import Logo from "./Logo";
import Link from "next/link";
import "./NavBar.css";
export default function NavBar() {
  return (
    <section className="navBarWrapper">
      <ul className="linkWrapper">
        <Link href={"/"}>Home</Link>
        <Link href={"/"}>About me</Link>
        <Link href={"/"}>Shop</Link>
      </ul>
      <Logo />
      <ul className="linkWrapper">
        <Link href={"/"}>Login</Link>
        <Link href={"/"}>Signup</Link>
      </ul>
    </section>
  );
}
