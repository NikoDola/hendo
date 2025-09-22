"use client";

import "@/components/pages/Form.css";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginCustomer } from "@/lib/shopify/storefront";
import { useShopifyAuth } from "@/context/ShopifyAuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useShopifyAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const accessToken = await loginCustomer(email, password);
      login(accessToken.accessToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="section-regular">
      <form className="formWrapper" onSubmit={handleSubmit}>
        <div className="inputWrapper">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="inputWrapper">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>

        <div className="orWrapper">
          <div className="hrLine" />
          <p>or</p>
          <div className="hrLine" />
        </div>

        <button type="button" className="googleButton">
          <div className="googleIcon"></div>
          Login with Google
        </button>

        <div className="orWrapper">
          <p className="italic"> Don&apos;t have an account? <Link className="underline" href={"/signup"}>signup</Link></p>
        </div>
      </form>
    </section>
  );
}
