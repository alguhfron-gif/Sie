import React, { useEffect, useRef, useState } from 'react';

/**
 * CompassCursor Component
 * Faithful replication of the signature magnetic compass cursor from miladsidogiri.id
 * Rotates dynamically based on movement angle, expands on interactive elements,
 * and maintains smooth rotational inertia.
 */
export const CompassCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const needleRef = useRef<HTMLImageElement>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Only enable on desktop / fine pointer devices (not mobile touch screens)
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) {
      setIsEnabled(false);
      return;
    }

    const cursorEl = cursorRef.current;
    const needleEl = needleRef.current;
    if (!cursorEl || !needleEl) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const current = { x: target.x, y: target.y };
    let currentAngle = 0;
    let targetAngle = 0;
    let currentScale = 1;
    let targetScale = 1;
    let isVisible = false;

    const normalizeAngle = (deg: number) => {
      let a = deg;
      while (a > 180) a -= 360;
      while (a < -180) a += 360;
      return a;
    };

    const handlePointerMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;

      if (!isVisible) {
        isVisible = true;
        cursorEl.style.opacity = '0.95';
      }

      const targetEl = e.target as Element | null;
      const isControl =
        targetEl &&
        targetEl.closest(
          'a, button, input, label, textarea, select, [role="button"], .cursor-pointer'
        );
      const isCard =
        targetEl &&
        targetEl.closest(
          '.sidogiri-card, .admin-box, .small-box, .live-card, .live-col, .grid > div, [class*="rounded-2xl"], [class*="rounded-3xl"], tr'
        );
      targetScale = isControl ? 1.32 : isCard ? 1.15 : 1;
    };

    const handlePointerLeave = () => {
      isVisible = false;
      cursorEl.style.opacity = '0';
    };

    const handleMouseDown = () => {
      targetScale = 0.88;
    };

    const handleMouseUp = () => {
      targetScale = 1;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    let animationFrameId: number;

    const tick = () => {
      const dx = target.x - current.x;
      const dy = target.y - current.y;

      // Spring-based translation easing
      current.x += 0.15 * dx;
      current.y += 0.15 * dy;

      // Direction calculation based on cursor velocity vector
      const speed = Math.sqrt(dx * dx + dy * dy);
      if (speed > 1.2) {
        targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 90 - 45;
      }

      // Smooth angular interpolation
      currentAngle += 0.11 * normalizeAngle(targetAngle - currentAngle);
      currentScale += 0.15 * (targetScale - currentScale);

      cursorEl.style.transform = `translate3d(${current.x}px, ${current.y}px, 0) scale(${currentScale.toFixed(3)})`;

      if (!prefersReducedMotion) {
        needleEl.style.transform = `rotate(${currentAngle.toFixed(1)}deg)`;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isEnabled) return null;

  return (
    <div
      ref={cursorRef}
      id="compass-cursor"
      aria-hidden="true"
      className="hidden md:block fixed left-0 top-0 w-10 h-10 -ml-5 -mt-5 z-[99999] pointer-events-none opacity-0 transition-opacity duration-300 will-change-transform select-none"
    >
      <img
        ref={needleRef}
        id="compass-needle"
        src="/compass-needle.png"
        alt=""
        className="w-full h-full object-contain rounded-full drop-shadow-[0_4px_12px_rgba(36,33,28,0.28)] transition-transform duration-75"
      />
    </div>
  );
};
