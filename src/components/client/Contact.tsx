"use client";

import { useState } from "react";
import "@/components/client/Contact.css"

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent page refresh
    e.stopPropagation(); // Stop event bubbling
    
    // Reset status
    setStatus('loading');
    setStatusMessage("");

    // Basic validation
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus('error');
      setStatusMessage('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setStatusMessage(data.message || 'Thank you for your message! We will get back to you soon.');
        // Clear form
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus('error');
        setStatusMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setStatus('error');
      setStatusMessage('Failed to send message. Please try again later.');
    }
  };

  return (
    <section id="contact" className="section-regular contactWrapper">
      <div>
        <h2 className="contactHeadline"> Dreamstation<br />  hotline </h2>
        <h3>straight to T. Hendo HQ</h3>
      </div>
      <form className="formWrapper" onSubmit={handleSubmit}>
        <div className="inputWrapper">
          <label>Name *</label>
          <input 
            className="input" 
            placeholder="Enter your name" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={status === 'loading'}
          />
        </div>
        <div className="inputWrapper">
          <label>Email *</label>
          <input 
            className="input" 
            placeholder="Enter your email" 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
          />
        </div>
        <div className="inputWrapper">
          <label>Message *</label>
          <textarea 
            className="input" 
            placeholder="Enter your message" 
            rows={6} 
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={status === 'loading'}
          ></textarea>
        </div>
        
        {statusMessage && (
          <div className={`contactStatusMessage ${status === 'success' ? 'contactStatusSuccess' : 'contactStatusError'}`}>
            {statusMessage}
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Sending...' : 'Submit'}
        </button>
      </form>
    </section>
  );
}
