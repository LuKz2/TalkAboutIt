// ClickableSound.js

import React from 'react';
import { TouchableOpacity } from 'react-native';
import Sound from 'react-native-sound';

const clickSound = new Sound(require('../../assets/songs/mouseclick.mp3'), Sound.MAIN_BUNDLE, (error) => {
  if (error) {
    console.log('Erro ao carregar o som do clique', error);
    return;
  }
});

const playClickSound = () => {
  clickSound.play();
};

const ClickableSound = ({ onPress, children, ...props }) => {
  const handlePress = () => {
    playClickSound();
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} {...props}>
      {children}
    </TouchableOpacity>
  );
};

export default ClickableSound;
