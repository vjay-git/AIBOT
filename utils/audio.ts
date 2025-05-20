/**
 * Utility functions for safely handling audio in the chatbot application
 */

// Store audio players to manage them properly
const audioPlayers: {[key: string]: HTMLAudioElement} = {};

/**
 * Safely play a notification sound with error handling
 * @param soundName - A unique identifier for the sound
 * @param soundUrl - URL to the sound file
 * @returns Promise that resolves when audio finishes playing or rejects on error
 */
export const playNotificationSound = async (soundName: string, soundUrl: string): Promise<void> => {
  try {
    // Check if we already have this audio instance
    if (!audioPlayers[soundName]) {
      audioPlayers[soundName] = new Audio(soundUrl);
    }
    
    const audio = audioPlayers[soundName];
    
    // Reset the audio to beginning if it was paused
    if (audio.paused) {
      audio.currentTime = 0;
    }
    
    // Use the play promise to handle errors
    try {
      await audio.play();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.log(`Audio playback for ${soundName} was interrupted, this is normal.`);
      } else {
        // Re-throw other errors
        throw error;
      }
    }
    
    // Return a promise that resolves when audio ends
    return new Promise((resolve) => {
      audio.onended = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Error playing notification sound:', error);
    // Return a resolved promise to prevent unhandled promise rejections
    return Promise.resolve();
  }
};

/**
 * Stop playing a sound that's currently active
 * @param soundName - The identifier for the sound to stop
 */
export const stopSound = (soundName: string): void => {
  try {
    if (audioPlayers[soundName]) {
      audioPlayers[soundName].pause();
    }
  } catch (error) {
    console.error('Error stopping sound:', error);
  }
};

/**
 * Clean up all audio players to prevent memory leaks
 */
export const cleanupAudioPlayers = (): void => {
  Object.keys(audioPlayers).forEach(key => {
    try {
      audioPlayers[key].pause();
      audioPlayers[key].src = '';
    } catch (error) {
      console.error(`Error cleaning up audio player ${key}:`, error);
    }
  });
}; 