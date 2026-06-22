import "./ZoomingStars.css";

// Pure-CSS star field. No client state, no effects, no per-cycle DOM churn —
// just a fixed set of elements looping a CSS keyframe forever. This keeps
// Safari's compositor working on a small, cached set of layers instead of
// growing memory until the tab reloads on its own.
//
// Positions/sizes/timings are a hand-picked static spread (not random) so the
// component renders deterministically on the server with zero runtime work.
const STARS: { x: number; y: number; size: number; delay: number; duration: number }[] = [
  { x: 6,  y: 14, size: 22, delay: 0,   duration: 9 },
  { x: 17, y: 70, size: 16, delay: 2.4, duration: 11 },
  { x: 27, y: 33, size: 26, delay: 5.1, duration: 8 },
  { x: 38, y: 82, size: 14, delay: 1.2, duration: 12 },
  { x: 46, y: 21, size: 20, delay: 3.7, duration: 10 },
  { x: 55, y: 58, size: 24, delay: 6.3, duration: 9 },
  { x: 63, y: 9,  size: 15, delay: 0.8, duration: 13 },
  { x: 71, y: 44, size: 27, delay: 4.5, duration: 8 },
  { x: 79, y: 76, size: 18, delay: 2.0, duration: 11 },
  { x: 88, y: 28, size: 21, delay: 5.8, duration: 10 },
  { x: 93, y: 62, size: 16, delay: 1.6, duration: 12 },
  { x: 12, y: 47, size: 19, delay: 7.0, duration: 9 },
  { x: 33, y: 6,  size: 23, delay: 3.1, duration: 10 },
  { x: 50, y: 90, size: 17, delay: 6.8, duration: 8 },
  { x: 67, y: 86, size: 25, delay: 0.4, duration: 13 },
  { x: 84, y: 52, size: 14, delay: 4.0, duration: 11 },
  { x: 22, y: 90, size: 20, delay: 2.7, duration: 9 },
  { x: 58, y: 35, size: 18, delay: 5.4, duration: 12 },
  { x: 76, y: 18, size: 22, delay: 1.0, duration: 10 },
  { x: 3,  y: 84, size: 15, delay: 6.0, duration: 11 },
];

export default function ZoomingStars() {
  return (
    <div className="zooming-stars-container">
      {STARS.map((star, i) => (
        <div
          key={i}
          className="zooming-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        >
          <svg
            viewBox="0 0 52 52"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", height: "100%" }}
          >
            <path
              d="M52,26c-23.9,1.2-24.8,2.1-26,26c-1.2-23.9-2.1-24.8-26-26c23.9-1.2,24.8-2.1,26-26C27.2,23.9,28.1,24.8,52,26z"
              fill="currentColor"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
