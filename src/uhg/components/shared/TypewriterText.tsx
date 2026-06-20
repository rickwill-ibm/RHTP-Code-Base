'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  showCursor?: boolean;
  startDelay?: number;
}

export default function TypewriterText({
  text,
  speed = 30,
  onComplete,
  className = '',
  showCursor = true,
  startDelay = 0,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
    setDone(false);

    const startTimer = setTimeout(() => {
      const tick = () => {
        if (indexRef.current < text.length) {
          indexRef.current++;
          setDisplayed(text.slice(0, indexRef.current));
          timerRef.current = setTimeout(tick, speed);
        } else {
          setDone(true);
          onComplete?.();
        }
      };
      tick();
    }, startDelay);

    return () => {
      clearTimeout(startTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, speed, startDelay, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {!done && showCursor && (
        <span className="typewriter-cursor" />
      )}
    </span>
  );
}