import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const OverlayFadeIn = ({ duration = 5000, onAnimationEnd }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current; // Inicializa com 1 (opaco)

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 0, // Anima para 0 (transparente)
      duration: duration,
      useNativeDriver: true,
    }).start(() => {
      if (onAnimationEnd) {
        onAnimationEnd();
      }
    });
  }, [fadeAnim, duration, onAnimationEnd]);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.overlayBackground} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10, // Certifique-se de que esteja acima de tudo
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
});

export default OverlayFadeIn;
