import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';

const DraggableNotification = ({ message, description, onClose, isShopNotification, animationSpeed = 300 }) => {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: -Dimensions.get('window').height })).current;
  const soundRef = useRef(new Audio.Sound());
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const playSound = async () => {
      try {
        await soundRef.current.loadAsync(require('../../assets/songs/notification.mp3'));
        await soundRef.current.playAsync();
      } catch (error) {
        console.log('Erro ao carregar ou reproduzir o som', error);
      }
    };

    playSound();

    Animated.spring(pan.y, {
      toValue: 0,
      friction: 5,
      useNativeDriver: true,
    }).start();

    return () => {
      isMounted = false;
      soundRef.current.unloadAsync().catch(error => {
        console.log('Erro ao descarregar o som', error);
      });
    };
  }, [pan.y]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy < 0) {
          Animated.event([null, { dy: pan.y }], { useNativeDriver: false })(e, gestureState);
        }
      },
      onPanResponderRelease: (e, gesture) => {
        if (gesture.dy < -100) {
          Animated.timing(pan.y, {
            toValue: -500,
            duration: animationSpeed,
            useNativeDriver: true,
          }).start(() => {
            if (typeof onClose === 'function') {
              onClose();
            }
          });
        } else {
          Animated.spring(pan.y, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.notification, { transform: [{ translateY: pan.y }], top: isShopNotification ? 110 : 50 }]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <LottieView
          source={require('../../assets/lottie/up.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  notification: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 10,
    zIndex: 9999, 
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  message: {
    fontSize: 15,
    color: '#fff',
    fontFamily: 'Roboto-Bold',
  },
  description: {
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Quicksand-VariableFont_wght',
  },
  lottie: {
    width: 70,
    height: 70,
  },
});

export default DraggableNotification;
