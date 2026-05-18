import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Use a placeholder music URL (instrumental santoor/shehnai if available, or peaceful flute)
const MUSIC_URL = 'https://drive.google.com/uc?export=download&id=1GORw1pwxT4yR6P6hBmFuTVgZKG0EsZVZ'; // Placeholder, user can update

export const AudioPlayer = ({ isPlaying, setIsPlaying }: { isPlaying: boolean; setIsPlaying: (val: boolean) => void }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => console.log('Autoplay blocked:', err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div className="fixed top-6 right-6 z-50">
      <audio ref={audioRef} src={MUSIC_URL} loop />
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsPlaying(!isPlaying)}
        className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-wedding-gold/30 shadow-lg text-wedding-gold"
      >
        {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </motion.button>
    </div>
  );
};
