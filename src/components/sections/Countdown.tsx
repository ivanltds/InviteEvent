'use client';

import { useState, useEffect } from 'react';
import styles from './Countdown.module.css';

interface CountdownProps {
  targetDate: string;
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }
      
      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initial calculation deferred to avoid cascading renders warning
    const initialTimer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 0);

    return () => {
      clearInterval(timer);
      clearTimeout(initialTimer);
    };
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className={styles.countdown}>
      <div className={styles.unit}>
        <span className={styles.number}>{timeLeft.days}</span>
        <span className={styles.label}>{timeLeft.days === 1 ? 'dia' : 'dias'}</span>
      </div>
      <div className={styles.unit}>
        <span className={styles.number}>{timeLeft.hours}</span>
        <span className={styles.label}>horas</span>
      </div>
      <div className={styles.unit}>
        <span className={styles.number}>{timeLeft.minutes}</span>
        <span className={styles.label}>min</span>
      </div>
      <div className={styles.unit}>
        <span className={styles.number}>{timeLeft.seconds}</span>
        <span className={styles.label}>seg</span>
      </div>
    </div>
  );
}
