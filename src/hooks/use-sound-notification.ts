'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

// Audio context for generating notification sounds
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext && typeof window !== 'undefined') {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
};

// Generate a pleasant notification sound using Web Audio API
const playNotificationSound = (volume: number = 0.3) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Create oscillator for the main tone
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  // Create a second oscillator for harmony
  const oscillator2 = ctx.createOscillator();
  const gainNode2 = ctx.createGain();

  // Configure the main tone (E5)
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
  oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1); // G5
  oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2); // A5

  // Configure the harmony tone (higher octave)
  oscillator2.type = 'sine';
  oscillator2.frequency.setValueAtTime(1318.5, ctx.currentTime); // E6
  oscillator2.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.1); // G6
  oscillator2.frequency.setValueAtTime(1760, ctx.currentTime + 0.2); // A6

  // Configure the gain envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  gainNode2.gain.setValueAtTime(0, ctx.currentTime);
  gainNode2.gain.linearRampToValueAtTime(volume * 0.5, ctx.currentTime + 0.05);
  gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

  // Connect the nodes
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator2.connect(gainNode2);
  gainNode2.connect(ctx.destination);

  // Play the sound
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.5);
  
  oscillator2.start(ctx.currentTime);
  oscillator2.stop(ctx.currentTime + 0.5);
};

// Generate an urgent notification sound for critical alerts
const playUrgentSound = (volume: number = 0.4) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Play two quick beeps
  for (let i = 0; i < 2; i++) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + i * 0.15); // A5

    gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + i * 0.15 + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.12);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime + i * 0.15);
    oscillator.stop(ctx.currentTime + i * 0.15 + 0.15);
  }
};

export type SoundType = 'notification' | 'urgent' | 'success' | 'error';

interface UseSoundNotificationOptions {
  enabled?: boolean;
  volume?: number;
  soundType?: SoundType;
}

export function useSoundNotification(options: UseSoundNotificationOptions = {}) {
  const { enabled = true, volume = 0.3, soundType = 'notification' } = options;
  const [isMuted, setIsMuted] = useState(false);
  const lastPlayedRef = useRef<number>(0);

  const playSound = useCallback((type: SoundType = soundType) => {
    if (!enabled || isMuted) return;
    
    // Debounce sounds to prevent rapid repeated plays
    const now = Date.now();
    if (now - lastPlayedRef.current < 500) return;
    lastPlayedRef.current = now;

    // Resume audio context if suspended (browser autoplay policy)
    const ctx = getAudioContext();
    if (ctx?.state === 'suspended') {
      ctx.resume();
    }

    switch (type) {
      case 'notification':
        playNotificationSound(volume);
        break;
      case 'urgent':
        playUrgentSound(volume);
        break;
      case 'success':
        playNotificationSound(volume * 0.8);
        break;
      case 'error':
        playUrgentSound(volume * 0.6);
        break;
    }
  }, [enabled, isMuted, volume, soundType]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      const ctx = getAudioContext();
      if (ctx?.state === 'suspended') {
        ctx.resume();
      }
    };

    // Add listeners for user interaction
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, []);

  return {
    playSound,
    isMuted,
    toggleMute,
    setIsMuted,
  };
}

export default useSoundNotification;
