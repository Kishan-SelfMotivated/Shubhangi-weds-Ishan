/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, MapPin, MousePointer2, Star, Flower2, Sparkles, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from './lib/utils';
import { EVENTS, WEDDING_DATE, type InvitationEvent } from './constants';
import { AudioPlayer } from './components/AudioPlayer';
import { Countdown } from './components/Countdown';

type ScreenState = 'WELCOME' | 'INVITATION';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('WELCOME');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const startJourney = () => {
    setIsAudioPlaying(true);
    setScreen('INVITATION');

    // Instantly play audio synchronously within user action to bypass strict autoplay blocks
    const audioEl = document.querySelector('audio');
    if (audioEl) {
      audioEl.play().catch(err => {
        console.log('Synchronous engagement play attempt:', err);
      });
    }

    confetti({
      particleCount: 350,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#0232DB', '#800000', '#FDFBF7'],
    });
  };

  return (
    <div className="min-h-screen bg-black overflow-x-hidden selection:bg-wedding-gold/30 text-white">
      <AudioPlayer isPlaying={isAudioPlaying} setIsPlaying={setIsAudioPlaying} />

      <AnimatePresence mode="wait">
        {screen === 'WELCOME' && (
          <WelcomeScreen onStart={startJourney} />
        )}

        {screen === 'INVITATION' && (
          <InvitationContent />
        )}
      </AnimatePresence>

      {/* Decorative floating elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(16)].map((_, i) => {
          const isLeft = i % 2 === 0;
          const startX = isLeft ? Math.random() * 15 + 3 : Math.random() * 15 + 82;
          return (
            <motion.div
              key={i}
              initial={{ y: -100, x: `${startX}%`, opacity: 0 }}
              animate={{
                y: '110vh',
                x: `${startX + (Math.random() * 4 - 2)}%`,
                opacity: [0, 0.6, 0.6, 0],
                rotate: 360
              }}
              transition={{
                duration: 15 + Math.random() * 15,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 20
              }}
              className="absolute text-wedding-gold/40"
            >
              <Star size={12 + Math.random() * 25} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 flex flex-col items-center justify-center z-40 bg-premium-black px-6 text-center overflow-hidden"
    >
      {/* Background Sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute bg-wedding-gold/40 rounded-full"
            style={{
              width: Math.random() * 4 + 'px',
              height: Math.random() * 4 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%'
            }}
          />
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8 flex flex-col items-center justify-center"
      >
        <div className="relative flex justify-center items-center">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 bg-wedding-gold blur-2xl rounded-full opacity-25 w-48 h-48 md:w-64 md:h-64 mx-auto"
          />
          <img
            src="https://lh3.googleusercontent.com/d/1gf_AacNEd65ci20_Z7Bsa7xnrhrU_2q9"
            alt="Ganesha"
            className="w-48 h-48 md:w-64 md:h-64 object-contain relative z-10"
            referrerPolicy="no-referrer"
          />
        </div>
        <h4 className="mt-6 font-hindi text-xl md:text-2xl text-wedding-gold drop-shadow-sm text-shimmer tracking-widest">
          श्री गणेशाय नमः
        </h4>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1.5 }}
        className="space-y-4"
      >
        <h1 className="text-5xl md:text-7xl font-cursive text-wedding-gold mb-12 drop-shadow-sm text-shimmer">
          Shubhangi weds Ishan
        </h1>
      </motion.div>

      <motion.button
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="group relative px-10 py-5 bg-gradient-to-r from-wedding-gold to-yellow-600 text-white rounded-full font-display tracking-[0.2em] text-sm uppercase shadow-2xl shadow-wedding-gold/50">
        <span className="relative z-10">Open Invitation</span>
      </motion.button>
    </motion.div>
  );
}

function InvitationContent() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative z-10 pt-20 pb-40"
    >
      {/* Intro Section */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 relative mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl"
        >
          <Flower2 className="text-wedding-gold mx-auto mb-6 opacity-60" size={60} />
          <h4 className="font-sans bold italic mb-2 text-white">With the blessing of God, we are pleased to solicit your presence on this auspicious event of our family.</h4>
          <div className="space-y-2 mb-12">
            <h2 className="text-5xl md:text-7xl font-cursive text-wedding-gold text-shimmer text-shadow-gold">Shubhangi</h2>
            <p className="font-display text-lg text-wedding-gold italic">Weds</p>
            <h2 className="text-5xl md:text-7xl font-cursive text-wedding-gold text-shimmer text-shadow-gold">Ishan</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16 text-gray-300">
            <div className="space-y-2">
              <p className="font-display text-sm text-white tracking-widest uppercase">The Bride</p>
              <h3 className="text-2xl font-display font-semibold text-wedding-gold text-shimmer">Shubhangi Chourasiya</h3>
              <h4 className="font-serif text-lg italic">Daughter of Mr. Gopal & Mrs. Suman Chourasiya</h4>
              <p className="text-xs semibold uppercase tracking-wider text-wedding-gold">(Itarsi, M.P.)</p>
            </div>
            <div className="space-y-2">
              <p className="font-display text-sm text-white tracking-widest uppercase">The Groom</p>
              <h3 className="text-2xl font-display font-semibold text-wedding-gold text-shimmer">Ishan Chourishi</h3>
              <h4 className="font-serif text-lg italic">Son of Mr. Rajesh & Mrs. Abha Chourishi</h4>
              <p className="text-xs semibold uppercase tracking-wider text-wedding-gold/80">(Ujjain, M.P.)</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Countdown Section */}
      <section className="py-24 bg-red-gradient bg-subtle-texture text-white text-center relative overflow-hidden border-y border-wedding-gold/20">
        <div className="absolute inset-0 bg-black/20" />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative z-10"
        >
          <h3 className="font-display text-2xl tracking-[0.3em] mb-12 text-wedding-gold text-shadow-gold">Countdown to Forever</h3>
          <h2 className="text-2xl font-display animate-pulse font-bold text-white">21st June 2026</h2>
          <Countdown targetDate={WEDDING_DATE} />
          <div className="mt-14 flex flex-wrap justify-center gap-6">
          <h3 className="text-2xl font-display animate-pulse font-semibold text-white">Save the Date</h3>
          </div>
          <div>
             <center><button
               onClick={() => window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Shubhangi+%26+Ishan+Wedding&dates=20260621T100000Z/20260621T220000Z&details=Join+us+for+the+celebration!&location=Hotel+Imperial+Grand,+Ujjain`)}
               className="flex items-center gap-3 px-8 py-4 border border-wedding-gold/40 rounded-full hover:bg-wedding-gold hover:text-black transition-all font-display text-sm tracking-widest bg-black/20 backdrop-blur-sm"
             >
               <Calendar size={18} /> Add to Google Calendar
             </button></center>
          </div>
        </motion.div>
      </section>

      {/* Events Section */}
      <section className="py-32 px-6 max-w-5xl mx-auto">
        <h3 className="text-center font-display text-4xl text-wedding-gold mb-24 tracking-[0.3em] uppercase text-shimmer">Wedding Itinerary</h3>
        <div className="space-y-40">
          {EVENTS.map((event, index) => (
            <EventCard key={event.id} event={event} index={index} />
          ))}
        </div>
      </section>

      {/* Final Closing */}
      <section className="py-40 text-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <Heart className="text-wedding-gold mx-auto animate-pulse" size={48} />
          <h2 className="text-4xl md:text-6xl font-cursive text-wedding-gold text-shimmer">Waiting for your presence</h2>
          <p className="font-display text-white tracking-widest uppercase">With Love, Families & Friends</p>
          
          <div className="pt-12 flex flex-col items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const message = `You are cordially invited to the wedding of Shubhangi and Ishan. 🌹\n\nPlease check the digital invitation here:
                ${window.location.href}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white rounded-full font-display tracking-widest text-sm shadow-xl hover:shadow-[#25D366]/20 transition-all duration-300"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Share Invitation
            </motion.button>
          </div>

          <div className="flex justify-center gap-4 text-wedding-gold pt-8">
            <Sparkles className="animate-pulse" />
            <Flower2 className="animate-pulse"/>
            <Sparkles className="animate-pulse"/>
          </div>
        </motion.div>
      </section>
    </motion.main>
  );
}

interface EventCardProps {
  event: InvitationEvent;
  index: number;
}

function EventCard({ event, index }: EventCardProps) {
  const isEven = index % 2 === 0;

  const themes = {
    'saffron': 'border-wedding-saffron text-wedding-saffron',
    'royal-gold': 'border-wedding-gold text-wedding-gold',
    'marigold': 'border-yellow-500 text-yellow-600',
    'maroon': 'border-wedding-maroon text-wedding-maroon',
    'neon': 'border-purple-500 text-purple-600',
    'red': 'border-red-600 text-red-700',
    'white': 'border-white text-white',
    'black-gold': 'border-black text-black',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className={cn(
        "relative flex flex-col md:flex-row items-center gap-8 group",
        !isEven && "md:flex-row-reverse"
      )}
    >
      {/* Visual Decoration */}
      <div className={cn(
        "w-full md:w-3/5 aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl relative border-4 transition-all duration-500 group-hover:scale-[1.02]",
        themes[event.theme as keyof typeof themes]?.split(' ')[0] || 'border-wedding-gold'
      )}>
        <div className={cn("absolute inset-0 opacity-20 bg-current", themes[event.theme as keyof typeof themes]?.split(' ')[1] || 'text-wedding-gold')} />
        <div className="absolute inset-0 flex items-center justify-center p-2 text-center bg-black/40 backdrop-blur-[2px]">
           <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute inset-1 border-[1px] border-dashed opacity-30 border-wedding-gold rounded-2xl"
           />
           <motion.img
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-contain drop-shadow-2xl relative z-10"
            referrerPolicy="no-referrer"
           />
        </div>
      </div>

      {/* Content */}
      <div className="w-full md:w-2/5 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
        <div className="space-y-2">
          <p className="font-display text-base tracking-[0.2em] text-wedding-gold uppercase font-semibold">{event.date}</p>
          <p className="font-sans text-sm italic text-gray-400">{event.time}</p>
        </div>
        <h3 className="text-4xl md:text-5xl font-display text-wedding-gold drop-shadow-lg">{event.title}</h3>
        <p className="text-lg font-sans text-gray-300 leading-relaxed max-w-md">{event.venue}</p>
        <button
          onClick={() => window.open(event.mapUrl, '_blank')}
          className="mt-6 flex items-center gap-3 group-hover:bg-wedding-gold group-hover:text-black px-8 py-3 border border-wedding-gold rounded-full transition-all duration-300 font-display text-sm tracking-widest bg-white/5"
        >
          <MapPin size={18} /> View Location on Map
        </button>
      </div>

      {/* Connection line for desktop */}
      <div className="hidden md:block absolute left-1/2 -bottom-40 w-px h-40 bg-wedding-gold/20 last:hidden" />
    </motion.div>
  );
}
