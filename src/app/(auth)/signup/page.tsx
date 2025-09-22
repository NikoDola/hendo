"use client";

import "@/components/pages/Form.css";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerCustomer } from "@/lib/shopify/storefront";
import { useShopifyAuth } from "@/context/ShopifyAuthContext";

export default function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { login } = useShopifyAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const customerData = await registerCustomer({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        acceptsMarketing: false
      });

      // After successful registration, automatically log them in
      const { loginCustomer } = await import("@/lib/shopify/storefront");
      const accessToken = await loginCustomer(formData.email, formData.password);
      login(accessToken.accessToken);
      router.push("/dashboard");
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="section-regular">
      <form className="formWrapper" onSubmit={handleSubmit}>
        <div className="inputWrapper">
          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="inputWrapper">
          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="inputWrapper">
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="inputWrapper">
          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter your Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="inputWrapper">
          <label>Repeat Password</label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Repeat your Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating Account..." : "Signup"}
        </button>

        <div className="orWrapper">
          <div className="hrLine" />
          <p>or</p>
          <div className="hrLine" />
        </div>

        <button type="button" className="googleButton">
          <div className="googleIcon"></div>
          Signup with Google
        </button>

        <div className="orWrapper">
          <p className="italic"> Already have an account? <Link className="underline" href={"/login"}>login</Link></p>
        </div>
      </form>
    </section>
  );
}
