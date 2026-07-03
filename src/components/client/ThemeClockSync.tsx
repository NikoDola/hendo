'use client';

import { useEffect } from 'react';

// CSS animations start their clock when their element mounts, so theme
// gradients on late-mounted elements (lazy sections, fetched music cards,
// route changes, hot reloads) drift out of phase with the rest of the page.
// This pins every themeFlowY* animation to the document's time origin so all
// theme surfaces show the same colors at the same moment. It only aligns
// clocks — no colors are written from JS (see theme-cycle.css).
export default function ThemeClockSync() {
  useEffect(() => {
    const sync = () => {
      for (const animation of document.getAnimations()) {
        const name = (animation as CSSAnimation).animationName;
        if (name?.startsWith('themeFlowY') && animation.startTime !== 0) {
          animation.startTime = 0;
        }
      }
    };
    sync();
    const interval = setInterval(sync, 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
