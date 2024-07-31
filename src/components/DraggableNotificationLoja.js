import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Animated, PanResponder, StyleSheet, Dimensions,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LottieView from 'lottie-react-native';

const DraggableNotificationLoja = ({ message, description, onClose }) => {
  const notificationY = useRef(new Animated.Value(-200)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy < 0, // Só reage a movimentos para cima
    onPanResponderMove: Animated.event(
      [null, { dy: notificationY }],
      {
        useNativeDriver: false, listener: (event, gestureState) => {
          if (gestureState.dy > 0) { // Restrição para não arrastar para baixo
            notificationY.setValue(0);
          }
        },
      },
    ),
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy < -50) { // Verifica se o movimento foi suficiente para cima
        Animated.timing(notificationY, {
          toValue: -200,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onClose();
        });
      } else {
        Animated.spring(notificationY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  useEffect(() => {
    Animated.timing(notificationY, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.draggableContainer} {...panResponder.panHandlers}>
      <BlurView
        style={styles.absolute}
        blurType="dark"
        blurAmount={10}
      />
      <Animated.View
        style={[styles.notificationContainer, { transform: [{ translateY: notificationY }] }]}
      >
        <View style={styles.notificationContent}>
          <View style={styles.textContainer}>
            <Text style={styles.notificationTitle}>{message}</Text>
            <Text style={styles.notificationDescription}>{description}</Text>
          </View>
          <LottieView
            source={require('../../assets/lottie/up.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  draggableContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContainer: {
    position: 'absolute',
    top: 130,
    width: Dimensions.get('window').width - 40,
    zIndex: 1001,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#333',
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  notificationTitle: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Roboto-Bold',
  },
  notificationDescription: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Quicksand-VariableFont_wght',
  },
  lottie: {
    width: 70,
    height: 70,
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});

export default DraggableNotificationLoja;
