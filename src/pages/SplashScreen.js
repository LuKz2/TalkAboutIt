import React, { useEffect, useState } from "react";
import { View, StyleSheet, Animated, Image, SafeAreaView } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { BackHandler } from 'react-native';

export default function SplashScreenComponent() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));
  const [coverAnim] = useState(new Animated.Value(0));
  const [animationPlayed, setAnimationPlayed] = useState(false);
  const navigation = useNavigation();


  useEffect(() => {
    const backAction = () => {
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (!animationPlayed) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000, // Reduced duration
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000, // Reduced duration
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000, // Reduced duration
          useNativeDriver: true,
        })
      ]).start(() => {
        setAnimationPlayed(true);
        setTimeout(() => {
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(coverAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            })
          ]).start(() => {
            navigation.replace('Home');
          });
        }, 1000);
      });
    }
  }, [animationPlayed, fadeAnim, scaleAnim, coverAnim, navigation]);



  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Animated.View style={[styles.background, { transform: [{ scaleY: scaleAnim }] }]}>
          <View style={styles.solidBackground} />
        </Animated.View>
        <View style={styles.darkOverlay} />
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          <Image
            style={styles.logo}
            source={require("../../assets/background/logosemfundo.png")}
            resizeMode="contain"
          />
        </Animated.View>
        <Animated.View style={[styles.fullScreenCover, { opacity: coverAnim }]} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  solidBackground: {
    backgroundColor: '#000000',
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
  },
  fullScreenCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  }
});
