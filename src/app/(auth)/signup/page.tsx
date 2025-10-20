"use client";


import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerCustomer } from "@/lib/shopify/storefront";
import { useShopifyAuth } from "@/context/ShopifyAuthContext";
import { initiateGoogleAuth } from "@/lib/shopify/googleAuth";

export default function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    acceptsMarketing: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { login } = useShopifyAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
      await registerCustomer({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        acceptsMarketing: formData.acceptsMarketing
      });

      // Show success message about email verification
      setSuccess(true);
      setError("");
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    try {
      initiateGoogleAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google signup failed");
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

        <div className="inputWrapper">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="acceptsMarketing"
              checked={formData.acceptsMarketing}
              onChange={handleChange}
              style={{ margin: 0 }}
            />
            <span>Subscribe to our newsletter for updates and special offers</span>
          </label>
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            color: 'green',
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '0.5rem'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0ea5e9' }}>Account Created Successfully! 🎉</h3>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              We've sent a verification email to <strong>{formData.email}</strong>
            </p>
            <p style={{ margin: '0 0 0.5rem 0' }}>
              Please check your email and click the verification link to activate your account.
            </p>
            <p style={{ margin: '0', fontSize: '0.9rem', color: '#64748b' }}>
              Once verified, you can <Link href="/login" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>login here</Link>
            </p>
          </div>
        )}

        <button type="submit" disabled={isLoading || success}>
          {isLoading ? "Creating Account..." : success ? "Account Created!" : "Signup"}
        </button>

        <div className="orWrapper">
          <div className="hrLine" />
          <p>or</p>
          <div className="hrLine" />
        </div>

        <button type="button" className="googleButton" onClick={handleGoogleSignup}>
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
