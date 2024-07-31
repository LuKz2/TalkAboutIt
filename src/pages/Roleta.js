import React, { useRef, useState, useEffect, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing, ImageBackground, Modal, Text, Dimensions, Image, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { MusicContext } from '../components/MusicProvider';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { BackHandler } from 'react-native';
import LottieView from 'lottie-react-native';
import DraggableNotification from '../components/DraggableNotification'; // Adicione o caminho correto para o componente

const { width, height } = Dimensions.get('window');
const soundObject = new Audio.Sound();

const Bottle = ({ route }) => {
  const rotateValue = useRef(new Animated.Value(0)).current;
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const [isSpinning, setIsSpinning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showFixedText, setShowFixedText] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const [rotatePerformed, setRotatePerformed] = useState(false);
  const [remainingQuestions, setRemainingQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isLastQuestionDisplayed, setIsLastQuestionDisplayed] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [typingSound, setTypingSound] = useState(null);
  const [hasTypedText, setHasTypedText] = useState(false);
  const [isTypingInProgress, setIsTypingInProgress] = useState(false);
  const [showFinalMessage, setShowFinalMessage] = useState(false);

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { pauseMusic, resumeMusic } = useContext(MusicContext);
  const { userInfo, purchasedPackages, checkedItems } = route.params;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuestionViewed, setIsQuestionViewed] = useState(true);
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  // Gerenciamento de notificações
  const notifications = [
    { message: 'TAI 👽', description: 'A regra é simples! Reúna os amigos, coloque o celular no centro e gire a roleta, o escolhido lê a pergunta e todos devem responder.', key: '1' },
    { message: 'TAI 👽', description: 'IMPORTANTE RECADO: incentivo conversas abertas, por isso conte o porquê de sua resposta.', key: '2' },
    { message: 'TAI 👽', description: 'Espero que você e seus amigos aproveitem a conversa, exponham seus pontos de vista e se divirtam! Se desconecte do mundo digital e se reconecte com o mundo real!', key: '3' },
  ];
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [blurBackground, setBlurBackground] = useState(false);

  const showNextNotification = () => {
    if (currentNotificationIndex < notifications.length) {
      setCurrentNotificationIndex(currentNotificationIndex + 1);
    } else {
      setBlurBackground(false);
    }
  };

  useEffect(() => {
    if (currentNotificationIndex < notifications.length) {
      setBlurBackground(true);
    } else {
      setBlurBackground(false);
    }
  }, [currentNotificationIndex]);

  const handleNotificationClose = () => {
    showNextNotification();
  };

  useEffect(() => {
    const backAction = () => {
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  if (!userInfo || !purchasedPackages || !checkedItems) {
    console.error('Dados necessários não foram passados via route.params');
    return null;
  }

  useEffect(() => {
    if (isFocused) {
      pauseMusic();
    } else {
      resumeMusic();
    }
  }, [isFocused]);

  useEffect(() => {
    const loadSound = async () => {
      try {
        await soundObject.loadAsync(require('../../assets/songs/vento.mp3'));
      } catch (error) {
        console.error('Erro ao carregar o áudio:', error);
      }
    };
    loadSound();
    return () => {
      soundObject.stopAsync();
      soundObject.unloadAsync();
    };
  }, []);

  useEffect(() => {
    const loadTypingSound = async () => {
      try {
        const sound = new Audio.Sound();
        await sound.loadAsync(require('../../assets/songs/maquina.mp3'));
        setTypingSound(sound);
      } catch (error) {
        console.error('Erro ao carregar o som de digitação:', error);
      }
    };
    loadTypingSound();
    return () => {
      if (typingSound) {
        typingSound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (purchasedPackages && checkedItems) {
      console.log('Pacotes comprados:', purchasedPackages);
      console.log('Itens verificados:', checkedItems);

      let allQuestions = [];
      for (let packageName of purchasedPackages) {
        if (checkedItems[packageName]) {
          let packageQuestions = [];
          if (packageName === 'Pacote Grátis') {
            packageQuestions = require('../json/perguntas_free.json')["freeQuestions"];
          } else {
            switch (packageName) {
              case "Reflexão":
                packageQuestions = require('../json/package/Reflexao/reflexao1.json')["Reflexao 1"];
                break;
              case "Relacionamentos":
                packageQuestions = require('../json/package/Relacionamentos/relacionamento.json')["Relacionamentos 1"];
                break;
              case "Apimentadas":
                packageQuestions = require('../json/package/Apimentadas/apimentadas1.json')["Apimentadas 1"];
                break;
              case "Sobre Grupo":
                packageQuestions = require('../json/package/Sobre_grupo/sobre_grupo1.json')["Sobre_grupo1"];
                break;
              case "Sobre Você":
                packageQuestions = require('../json/package/Sobre_voce/sobre_voce1.json')["Sobre você 1"];
                break;
              case "Lúdicas":
                packageQuestions = require('../json/package/Ludicas/Ludicas1.json')["Lúdicas"];
                break;
              case "Memórias":
                packageQuestions = require('../json/package/Memorias/Memorias.json')["Memórias"];
                break;
              case "Politicamente incorretas":
                packageQuestions = require('../json/package/Politicamente_incorretas/politicamente_incorreta1.json')["Politicamente incorretas 1"];
                break;
              case "Para fazer rir":
                packageQuestions = require('../json/package/Rir/pararir1.json')["Para fazer rir"];
                break;
                case "Crush":
                  packageQuestions = require('../json/package/Crush/crush.json')["crush"];
                  break;
                case "Família":
                  packageQuestions = require('../json/package/Familia/fam.json')["Família 1"];
                  break;
              default:
                console.error('Pacote não encontrado:', packageName);
            }
          }
          if (packageQuestions && packageQuestions.length) {
            console.log(`Carregando perguntas para o pacote: ${packageName}`);
            packageQuestions = packageQuestions.map(question => ({ ...question, packageName }));
            allQuestions = allQuestions.concat(packageQuestions);
          } else {
            console.warn(`Nenhuma pergunta encontrada para o pacote: ${packageName}`);
          }
        }
      }

      allQuestions = allQuestions.sort(() => Math.random() - 0.5);

      console.log('Número de perguntas carregadas:', allQuestions.length);
      setRemainingQuestions(allQuestions);
    }
  }, [purchasedPackages, checkedItems]);

  useEffect(() => {
    Animated.timing(fadeInAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const spinBottle = async () => {
    if (!isSpinning && isQuestionViewed && currentNotificationIndex >= notifications.length) {
      setIsSpinning(true);
      setIsQuestionViewed(false);
      rotateValue.setValue(0);
      setShowIcon(false);
      fadeOutIcon();

      const randomDegrees = Math.random() * 360 * 5 + 360 * 5;

      await soundObject.replayAsync();

      Animated.timing(rotateValue, {
        toValue: randomDegrees,
        duration: 7000,
        easing: Easing.bezier(1, 1, 0, 1),
        useNativeDriver: true,
      }).start(() => {
        setIsSpinning(false);
        setShowIcon(true);
        setShowFixedText(true);
        fadeInIcon();
        setRotatePerformed(true);
        displayNextQuestion();
      });
    }
  };

  const fadeInIcon = () => {
    Animated.timing(iconOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const fadeOutIcon = () => {
    Animated.timing(iconOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowIcon(false);
    });
  };

  const handleIconClick = () => {
    setShowIcon(false);
    setModalVisible(true);
    setIsModalOpen(true);
    if (currentQuestion && (!hasTypedText || isTypingInProgress)) {
      setTypedText('');
      typeText(currentQuestion.text);
    }
  };

  const closeModal = () => {
    if (!isTypingInProgress) {
      setModalVisible(false);
      setIsModalOpen(false);
      setIsQuestionViewed(true);
      if (isLastQuestionDisplayed) {
        setShowFinalMessage(true);
      } else {
        setShowIcon(true);
        fadeInIcon();
      }
    }
  };

  const displayNextQuestion = () => {
    if (remainingQuestions.length === 0) {
      setIsLastQuestionDisplayed(true);
      return;
    }

    const nextQuestion = remainingQuestions[0];

    console.log('Pergunta selecionada:', nextQuestion);

    setCurrentQuestion(nextQuestion);
    setTypedText('');
    setHasTypedText(false);
    setIsTypingInProgress(false);

    const updatedRemainingQuestions = remainingQuestions.slice(1);
    setRemainingQuestions(updatedRemainingQuestions);

    if (updatedRemainingQuestions.length === 0) {
      setIsLastQuestionDisplayed(true);
    }
  };

  const typeText = async (text) => {
    let currentIndex = 0;
    setIsTypingInProgress(true);
    if (typingSound) {
      await typingSound.playAsync();
    }
    const intervalId = setInterval(async () => {
      if (currentIndex < text.length) {
        setTypedText((prev) => prev + text.charAt(currentIndex));
        currentIndex += 1;
      } else {
        clearInterval(intervalId);
        if (typingSound) {
          await typingSound.stopAsync();
        }
        setHasTypedText(true);
        setIsTypingInProgress(false);
      }
    }, 100);
  };

  const handleFinalMessageOkPress = () => {
    Animated.timing(fadeOutAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate('Detalhes');
    });
  };

  const renderFinalMessage = () => {
    return (
      <View style={styles.finalMessageWrapper}>
        <View style={styles.overlay} />
        <Animated.View style={[styles.finalMessageContainer, { opacity: fadeOutAnim }]}>
          <Image
            source={require('../../assets/background/logosemfundo.png')}
            style={styles.finalLogo}
          />
          <Text style={styles.finalMessageText}>Você completou todas as perguntas!</Text>
          <Text style={styles.finalMessageSubText}>Obrigado por jogar. Para continuar se divertindo, visite nossa loja e adquira mais pacotes de perguntas.</Text>
          <TouchableOpacity style={styles.finalMessageButton} onPress={handleFinalMessageOkPress}>
            <Text style={styles.finalMessageButtonText}>OK</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeInAnim }]}>
      <ImageBackground
        source={require('../../assets/background/back.rolet.png')}
        style={styles.backgroundImage}
      >
        {blurBackground && (
          <View style={styles.blurBackground}>
            <View style={styles.blurOverlay} />
          </View>
        )}

        <View style={styles.backButtonContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {currentNotificationIndex < notifications.length && (
          <DraggableNotification
            key={notifications[currentNotificationIndex].key}
            message={notifications[currentNotificationIndex].message}
            description={notifications[currentNotificationIndex].description}
            onClose={handleNotificationClose}
          />
        )}

        <TouchableOpacity style={styles.arrowContainer} onPress={spinBottle} disabled={currentNotificationIndex < notifications.length}>
          <Animated.Image
            source={require('../../assets/seta.png')}
            style={[
              styles.pointer,
              {
                transform: [
                  {
                    rotate: rotateValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '3deg'],
                    }),
                  },
                ],
                width: width * 0.3,
                height: height * 0.5,
                opacity: blurBackground ? 0.15 : 1, // Ajuste a opacidade da seta com o fundo escuro
              },
            ]}
          />
        </TouchableOpacity>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={closeModal}
            activeOpacity={1}
            disabled={isTypingInProgress}
          >
            <View style={styles.modalContainer}>
              <View style={styles.questionContainer}>
                {currentQuestion && (
                  <View style={styles.textContainer}>
                    <View style={styles.questionTextContainer}>
                      <Text style={styles.questionText}>"{typedText}"</Text>
                    </View>
                    <Text style={styles.packageNameText}>{currentQuestion.packageName}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={closeModal} style={styles.iconCloseContainer}>
                  <FontAwesome name="times" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {showFinalMessage && renderFinalMessage()}

        {showIcon && (
          <Animated.View style={[styles.iconContainer, { opacity: iconOpacity }]}>
            <TouchableOpacity onPress={handleIconClick}>
              <LottieView
                source={require('../../assets/lottie/pergunta.json')}
                autoPlay
                loop
                style={styles.lottie}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </ImageBackground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  arrowContainer: {
    alignItems: 'center',
    position: 'absolute',
    left: width * 0.38,
    top: height * 0.21,
    zIndex: 2, // Garante que a seta esteja na frente do fundo escuro
  },
  pointer: {
    transformOrigin: '36% 50%',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    width: '100%',
  },
  modalContainer: {
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 20,
    backgroundColor: 'transparent',
  },
  questionContainer: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  textContainer: {
    justifyContent: 'center',
    top: height * 0.3,
  },
  questionTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  questionText: {
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontSize: 16,
    color: 'yellow',
    textAlign: 'center',
  },
  packageNameText: {
    fontSize: 16,
    color: 'yellow',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    marginTop: 20,
  },
  iconContainer: {
    position: 'absolute',
    bottom: height * 0.05,
    alignSelf: 'center',
  },
  lottie: {
    width: 100,
    height: 100,
  },
  iconCloseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: height * 0.35,
    backgroundColor: 'transparent',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 9999, // Garante que a seta de volta esteja na frente
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  finalMessageWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  finalMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  finalLottie: {
    width: 150,
    height: 150,
  },
  finalMessageText: {
    fontSize: 22,
    fontFamily: 'Quicksand-VariableFont_wght',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  finalMessageSubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Quicksand-VariableFont_wght',
  },
  finalMessageButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#6200ee',
    borderRadius: 15,
  },
  finalMessageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finalLogo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
});

export default Bottle;
