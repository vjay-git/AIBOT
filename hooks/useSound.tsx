import { useCallback, useEffect, useRef } from 'react';
import { playNotificationSound, stopSound } from '../utils/audio';

/**
 * A React hook for safely handling sound playback in the application
 * @param soundUrl - Path to the sound file
 * @param options - Configuration options
 * @returns Object with play and stop functions
 */
export function useSound(
  soundUrl: string,
  options: {
    id?: string;
    volume?: number;
    interrupt?: boolean;
  } = {}
) {
  const {
    id = 'sound-' + Math.random().toString(36).substring(2, 9),
    volume = 1,
    interrupt = true,
  } = options;
  
  const soundUrlRef = useRef(soundUrl);
  const idRef = useRef(id);
  
  // Update refs if props change
  useEffect(() => {
    soundUrlRef.current = soundUrl;
    idRef.current = id;
  }, [soundUrl, id]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSound(idRef.current);
    };
  }, []);
  
  const play = useCallback(async () => {
    try {
      if (interrupt) {
        stopSound(idRef.current);
      }
      
      await playNotificationSound(idRef.current, soundUrlRef.current);
      return true;
    } catch (error) {
      console.error('Error playing sound:', error);
      return false;
    }
  }, [interrupt]);
  
  const stop = useCallback(() => {
    stopSound(idRef.current);
  }, []);
  
  return {
    play,
    stop,
    soundId: idRef.current
  };
}

export default useSound; 