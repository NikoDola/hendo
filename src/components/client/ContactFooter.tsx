"use client";

import { useState, useEffect } from "react";
import "@/components/client/ContactFooter.css";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");

  // Load reCAPTCHA script on mount
  useEffect(() => {
    if (!document.querySelector("#recaptcha-script")) {
      const script = document.createElement("script");
      script.id = "recaptcha-script";
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent page refresh
    e.stopPropagation(); // Stop event bubbling

    // Reset status
    setStatus("loading");
    setStatusMessage("");

    // Basic validation
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus("error");
      setStatusMessage("Please fill in all fields");
      return;
    }

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string,
        { action: "contact" }
      );

      // Send to API route which handles email sending via Firebase/Resend and saves to Firestore
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setStatusMessage(
          data.message ||
            "Thank you for your message! We will get back to you soon."
        );
        // Clear form
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
        setStatusMessage(
          data.error || "Something went wrong. Please try again."
        );
      }
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus("error");
      setStatusMessage("Failed to send message. Please try again later!");
    }
  };

  return (
    <section className="contactWrapperCfr section-regular " id="contactFr">
      <div className="headlineWrapperCfr">
        <h2 className="contactHeadlineCfr" data-text="Dreamstation hotline"> Dreamstation hotline </h2>
        <h4>straight to HQ</h4>
      </div>
      <form className="formWrapperFr" onSubmit={handleSubmit}>
          <div className="nameEmailCfr">
            <div className="inputWrapperCfr">
            <label>Name *</label>
            <input
              className="inputCfr"
              placeholder="Enter your name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={status === "loading"}
            />
          </div>
          <div className="inputWrapperCfr inputWrapperEmailCfr">
            <label>Email *</label>
            <input
              className="inputCfr"
              placeholder="Enter your email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
            />
          </div>
        </div>
        <div className="inputWrapperFr">
          <label>Message *</label>
          <textarea
            className="inputCfr"
            placeholder="Enter your message"
            rows={6}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={status === "loading"}
          ></textarea>
        </div>

        {statusMessage && (
          <div
            className={`contactStatusMessage ${
              status === "success" ? "contactStatusSuccess" : status === "error" ? "contactStatusError" : ""
            }`}
          >
            {statusMessage}
          </div>
        )}
      <div className="button__termsWrapperCfr">
                <p className="my-recaptcha-disclaimer">
          This site is protected by reCAPTCHA and the Google
          <br />
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
          {" and "}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </a>
          {" apply."}
        </p>
                <button
          type="submit"
          disabled={status === "loading"}
          className="submitButtonCfr"
        >
          {status === "loading" ? "Sending..." : "Submit"}
        </button>
      </div>


      </form>
    </section>
  );
}
