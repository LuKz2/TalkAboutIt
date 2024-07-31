import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, StyleSheet, Dimensions, Animated, UIManager, Platform, AppState, TouchableOpacity, Text, ImageBackground,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import PackageItem from './PackageItem';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SharedElement } from 'react-navigation-shared-element';
import Sound from 'react-native-sound';
import LottieView from 'lottie-react-native';
import DraggableNotificationLoja from './DraggableNotificationLoja';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

const Loja = ({ packageData, showMenu, currentTab }) => {
  const navigation = useNavigation();
  const [gifOpacity] = useState(new Animated.Value(0));
  const [sliderWidth, setSliderWidth] = useState(Dimensions.get('window').width * 1.01);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingMusicCount, setPlayingMusicCount] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [questionVisible, setQuestionVisible] = useState(false);
  const carouselRef = useRef(null);
  const soundRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const [isBlurActive, setIsBlurActive] = useState(false);
  const notificationY = useRef(new Animated.Value(-200)).current;
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState({});

  const imageSoundMap = useMemo(() => ({
    '../../assets/pacotes/friends.jpg': {
      image: require('../../assets/pacotes/friends.jpg'),
      sound: require('../../assets/songs/packages/reflexao.mp3')
    },
    '../../assets/pacotes/rela.jpg': {
      image: require('../../assets/pacotes/rela.jpg'),
      sound: require('../../assets/songs/packages/relacionamento.mp3')
    },
    '../../assets/pacotes/memorias.jpg': {
      image: require('../../assets/pacotes/memorias.jpg'),
      sound: require('../../assets/songs/packages/memorias.mp3')
    },
    '../../assets/pacotes/sobrevoce.jpg': {
      image: require('../../assets/pacotes/sobrevoce.jpg'),
      sound: require('../../assets/songs/packages/sobrevc.mp3')
    },
    '../../assets/pacotes/amigos.jpg': {
      image: require('../../assets/pacotes/amigos.jpg'),
      sound: require('../../assets/songs/packages/sobregp.mp3')
    },
    '../../assets/pacotes/18.jpg': {
      image: require('../../assets/pacotes/18.jpg'),
      sound: require('../../assets/songs/packages/apimentadas.mp3')
    },
    '../../assets/pacotes/ludicas.jpg': {
      image: require('../../assets/pacotes/ludicas.jpg'),
      sound: require('../../assets/songs/packages/ludicas.mp3')
    },
    '../../assets/pacotes/politicamente.jpg': {
      image: require('../../assets/pacotes/politicamente.jpg'),
      sound: require('../../assets/songs/packages/politicamenteinc.mp3')
    },
    '../../assets/pacotes/rir.jpg': {
      image: require('../../assets/pacotes/rir.jpg'),
      sound: require('../../assets/songs/packages/pararir.mp3')
    },
    '../../assets/pacotes/crush.jpg': {
      image: require('../../assets/pacotes/crush.jpg'),
      sound: require('../../assets/songs/packages/crush.mp3')
    },
    '../../assets/pacotes/familia.jpg': {
      image: require('../../assets/pacotes/familia.jpg'),
      sound: require('../../assets/songs/packages/familia.mp3')
    },
    'default': {
      image: require('../../assets/back.jpg'),
      sound: require('../../assets/songs/background_song.mp3')
    }
  }), []);

  const questionFiles = useMemo(() => ({
    "Reflexão": require('../json/package/Reflexao/reflexao1.json')["Reflexao 1"],
    "Relacionamentos": require('../json/package/Relacionamentos/relacionamento.json')["Relacionamentos 1"],
    "Memórias": require('../json/package/Memorias/Memorias.json')["Memórias"],
    "Sobre Você": require('../json/package/Sobre_voce/sobre_voce1.json')["Sobre você 1"],
    "Sobre Grupo": require('../json/package/Sobre_grupo/sobre_grupo1.json')["Sobre_grupo1"],
    "Apimentadas": require('../json/package/Apimentadas/apimentadas1.json')["Apimentadas 1"],
    "Lúdicas": require('../json/package/Ludicas/Ludicas1.json')["Lúdicas"],
    "Politicamente incorretas": require('../json/package/Politicamente_incorretas/politicamente_incorreta1.json')["Politicamente incorretas 1"],
    "Para fazer rir": require('../json/package/Rir/pararir1.json')["Para fazer rir"],
    "Crush": require('../json/package/Crush/crush.json')["crush"],
    "Família": require('../json/package/Familia/fam.json')["Família 1"],
  }), []);

  const questionIdMap = useMemo(() => ({
    "Reflexão": 7,
    "Relacionamentos": 9,
    "Memórias": 4,
    "Sobre Você": 9,
    "Sobre Grupo": 3,
    "Apimentadas": 6,
    "Lúdicas": 6,
    "Politicamente incorretas": 8,
    "Para fazer rir": 8,
    "Crush": 4,
    "Família": 4,
  }), []);

  const handlePress = useCallback((packageData) => {
    navigation.navigate('PackageDetails', { packageData });
  }, [navigation]);

  const handleLottiePress = useCallback((index, packageName) => {
    setIsBlurActive(true);
    setQuestionVisible(true);

    const question = selectedQuestions[packageName];
    if (!question) {
      console.error('Nenhuma pergunta encontrada para este pacote.');
      return;
    }

    setCurrentQuestion(question);

    Animated.timing(notificationY, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [selectedQuestions]);

  const closeNotification = useCallback(() => {
    Animated.timing(notificationY, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsBlurActive(false);
      setQuestionVisible(false);
      notificationY.setValue(0);
    });
  }, [notificationY]);

  const handleScroll = useCallback((event) => {
    if (event.nativeEvent.velocity !== 0) {
      Animated.timing(gifOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [gifOpacity]);

  const handleMomentumScrollEnd = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (soundRef.current) {
        soundRef.current.play();
      }
    }, [])
  );

  useEffect(() => {
    const updateSliderDimensions = () => {
      setSliderWidth(Dimensions.get('window').width * 1.2);
    };

    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        soundRef.current ? soundRef.current.play() : resumeMusic();
      } else if (nextAppState.match(/inactive|background/)) {
        soundRef.current ? soundRef.current.pause() : pauseMusic();
      }
      appState.current = nextAppState;
    };

    Dimensions.addEventListener('change', updateSliderDimensions);
    AppState.addEventListener('change', handleAppStateChange);

    return () => {
      Dimensions.removeEventListener('change', updateSliderDimensions);
      AppState.remove('change', handleAppStateChange);
      if (soundRef.current) {
        soundRef.current.stop(() => soundRef.current.release());
      }
    };
  }, []);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.stop(() => soundRef.current.release());
    }

    const currentPackage = packageData[currentIndex];
    const imageKey = currentPackage.image || 'default';
    const soundKey = currentPackage.image || 'default';
    const soundPath = imageSoundMap[soundKey]?.sound;

    soundRef.current = new Sound(soundPath, (error) => {
      if (error) {
        console.log('Erro ao carregar o som', error);
        return;
      }
      if (soundRef.current) {
        soundRef.current.setVolume(0.1);
        soundRef.current.setNumberOfLoops(-1);
        soundRef.current.play();
        setPlayingMusicCount((count) => count + 1);
      }
    });
  }, [currentIndex, imageSoundMap, packageData]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.stop(() => soundRef.current.release());
        setPlayingMusicCount((count) => count - 1);
      }
    };
  }, []);

  useEffect(() => {
    console.log(`Número de músicas tocando: ${playingMusicCount}`);
  }, [playingMusicCount]);

  useEffect(() => {
    Animated.timing(gifOpacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [gifOpacity]);

  useEffect(() => {
    if (!showMenu && currentTab === "Loja" && !notificationVisible) {
      setNotificationVisible(true);
      Animated.timing(notificationY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showMenu, currentTab, notificationVisible, notificationY]);

  const handleNotificationClose = useCallback(() => {
    setNotificationVisible(false);
  }, []);

  useEffect(() => {
    const selected = {};
    for (const packageName in questionIdMap) {
      const questions = questionFiles[packageName];
      if (questions && questions.length > 0) {
        const questionId = questionIdMap[packageName];
        const question = questions.find(q => q.id === questionId);
        if (question) {
          selected[packageName] = question.text;
        } else {
          console.error(`Pergunta não encontrada para o pacote ${packageName} com ID ${questionId}`);
        }
      }
    }
    setSelectedQuestions(selected);
  }, [questionFiles, questionIdMap]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.container, { opacity: gifOpacity }]}>
        <Carousel
          ref={carouselRef}
          width={sliderWidth}
          height={Dimensions.get('window').height * 1.09}
          data={packageData}
          renderItem={({ item, index }) => (
            <View style={styles.itemContainer}>
              <ImageBackground
                source={imageSoundMap[item.image]?.image || imageSoundMap['default'].image}
                style={[styles.backgroundImage, { width: sliderWidth }]}
                resizeMode="cover"
                imageStyle={styles.imageStyle}
              >
                <SharedElement id={`item.${item.id}.photo`}>
                  <PackageItem
                    packageData={item}
                    onPress={() => handlePress(item)}
                    navigation={navigation}
                  />
                </SharedElement>
              </ImageBackground>
              <TouchableOpacity onPress={() => handleLottiePress(index, item.title)} style={styles.lottieContainer}>
                <LottieView
                  source={require('../../assets/lottie/pergunta.json')}
                  autoPlay
                  loop
                  style={styles.lottie}
                  pointerEvents="box-none"
                />
              </TouchableOpacity>
            </View>
          )}
          onScroll={handleScroll}
          onSnapToItem={handleMomentumScrollEnd}
        />
        {notificationVisible && (
          <DraggableNotificationLoja
            message="Bem-vindo à Loja!"
            description="Explore os pacotes disponíveis e divirta-se!"
            onClose={handleNotificationClose}
          />
        )}
      </Animated.View>
      {questionVisible && (
        <DraggableNotificationLoja
          message="Pergunta"
          description={currentQuestion}
          onClose={closeNotification}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContainer: {
    flex: 1,
    alignItems: 'center',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageStyle: {
    borderRadius: 10,
  },
  lottieContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: height * 0.10,
    left: width * 0.8,
    width: 70,
    height: 70,
    zIndex: 100,
  },
  lottie: {
    width: 100,
    height: 100,
  },
  lottieIcon: {
    width: 50,
    height: 50,
  },
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 2,
  },
});

export default Loja;
