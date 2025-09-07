"use client";
import ColorSlider from "@/components/client/ColorSlider";
import { useState } from "react";

export default function SliderDemo() {
  const [volume, setVolume] = useState(75);
  const [brightness, setBrightness] = useState(50);
  const [speed, setSpeed] = useState(25);

  return (
    <div style={{
      padding: '2rem',
      background: 'linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '3rem',
          fontSize: '2.5rem',
          fontWeight: '300',
          letterSpacing: '2px'
        }}>
          Color Slider Demo
        </h1>

        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            marginBottom: '1rem',
            fontSize: '1.5rem',
            fontWeight: '400'
          }}>
            Volume Control
          </h2>
          <ColorSlider
            min={0}
            max={100}
            step={1}
            defaultValue={75}
            onChange={setVolume}
          />
          <p style={{
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Current volume: {volume}%
          </p>
        </div>

        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            marginBottom: '1rem',
            fontSize: '1.5rem',
            fontWeight: '400'
          }}>
            Brightness
          </h2>
          <ColorSlider
            min={0}
            max={100}
            step={5}
            defaultValue={50}
            onChange={setBrightness}
          />
          <p style={{
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Current brightness: {brightness}%
          </p>
        </div>

        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            marginBottom: '1rem',
            fontSize: '1.5rem',
            fontWeight: '400'
          }}>
            Animation Speed
          </h2>
          <ColorSlider
            min={0}
            max={100}
            step={1}
            defaultValue={25}
            onChange={setSpeed}
          />
          <p style={{
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Current speed: {speed}%
          </p>
        </div>

        <div style={{
          marginTop: '4rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            marginBottom: '1rem',
            fontSize: '1.2rem',
            fontWeight: '400'
          }}>
            Features
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            lineHeight: '1.8'
          }}>
            <li>✨ Dynamic color changes using your existing ColorProvider</li>
            <li>🎨 Smooth color transitions every 3 seconds</li>
            <li>💫 Shimmer animation effect on the track</li>
            <li>🔥 Glowing hover and active states</li>
            <li>📱 Fully responsive design</li>
            <li>🎯 Cross-browser compatible (Chrome, Firefox, Safari, Edge)</li>
            <li>⚡ Smooth animations and transitions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
