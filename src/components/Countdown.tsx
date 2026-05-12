import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

export const Countdown = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center mx-2 md:mx-4">
      <motion.div
        key={value}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-16 h-20 md:w-20 md:h-24 bg-white/10 backdrop-blur-md border border-wedding-gold/20 rounded-xl flex items-center justify-center mb-2 shadow-xl"
      >
        <span className="text-3xl md:text-4xl font-display text-wedding-gold font-bold">
          {value.toString().padStart(2, '0')}
        </span>
      </motion.div>
      <span className="text-[10px] md:text-xs uppercase tracking-widest text-wedding-gold/70 font-sans font-semibold">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex justify-center items-center py-8">
      <TimeBox value={timeLeft.days} label="Days" />
      <TimeBox value={timeLeft.hours} label="Hours" />
      <TimeBox value={timeLeft.minutes} label="Mins" />
      <TimeBox value={timeLeft.seconds} label="Secs" />
    </div>
  );
};
