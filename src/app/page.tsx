'use client';

import { useState } from 'react';
import './under-construction.css';

export default function UnderConstruction() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Thank you! You have been subscribed to our newsletter.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again later.');
    }
  };

  return (
    <div className="underConstructionContainer">
      <div className="underConstructionContent">
        <div className="underConstructionGlow"></div>
        
        <h1 className="underConstructionTitle">
          Coming Soon
        </h1>
        
        <p className="underConstructionText">
          We are working on something amazing! Subscribe to get notified about our latest tracks 
          and when the website launches.
        </p>

        <form onSubmit={handleSubmit} className="underConstructionForm">
          <div className="underConstructionInputWrapper">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="underConstructionInput"
              disabled={status === 'loading'}
            />
            <button 
              type="submit" 
              className="underConstructionButton"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
          
          {message && (
            <p className={`underConstructionMessage ${status === 'success' ? 'success' : 'error'}`}>
              {message}
            </p>
          )}
        </form>

        <div className="underConstructionFooter">
          <p>Stay tuned for updates!</p>
        </div>
      </div>
    </div>
  );
}
