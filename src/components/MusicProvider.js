import React, { createContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';

export const MusicContext = createContext();

const MusicProvider = ({ children, routeName }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const loadMusic = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/songs/background_song.mp3'),
        { shouldPlay: false, isLooping: true, volume: 0.1 }
      );
      setSound(sound);
    };

    loadMusic();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (routeName === 'Splash') {
      pauseMusic();
    } else if (!isPlaying) {
      resumeMusic();
    }
  }, [routeName]);

  const pauseMusic = async () => {
    if (sound && isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
      console.log('Music paused');
    }
  };

  const resumeMusic = async () => {
    if (sound && !isPlaying) {
      await sound.playAsync();
      setIsPlaying(true);
      console.log('Music resumed');
    }
  };

  const stopMusic = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
      console.log('Music stopped');
    }
  };

  return (
    <MusicContext.Provider value={{ sound, pauseMusic, resumeMusic, stopMusic }}>
      {children}
    </MusicContext.Provider>
  );
};

export default MusicProvider;
