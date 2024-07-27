import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions, TouchableOpacity, Animated, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { BlurView } from '@react-native-community/blur';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import { BackHandler } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import OverlayFadeIn from './components/OverlayFadeIn'; // Certifique-se de que o caminho está correto
import DraggableNotification from './components/DraggableNotification';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Header = ({ setBlurActive, setTextComplete, setNotificationBlurActive, fadeAnim, textBlurActive, setTextBlurActive, showNotification }) => {
  const [text, setText] = useState('');
  const [secondText, setSecondText] = useState('');
  const typingSound = useRef(new Audio.Sound());

  useEffect(() => {
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    const textToWrite = 'Talk About It';
    const descriptionToWrite = 'Conexões reais e sem filtro';

    let currentText = '';
    let currentDescription = '';

    const interval = setInterval(() => {
      if (currentText.length < textToWrite.length) {
        currentText += textToWrite[currentText.length];
        setText(currentText);
        setBlurActive(true);
      } else if (currentDescription.length < descriptionToWrite.length) {
        currentDescription += descriptionToWrite[currentDescription.length];
        setSecondText(currentDescription);
      } else {
        clearInterval(interval);
        typingSound.current.stopAsync();
        setBlurActive(false);
        setTextComplete(true);
        setNotificationBlurActive(true);
        setTextBlurActive(true);
        showNotification(0); // Show first notification
      }
    }, 150);

    typingSound.current.loadAsync(require('../assets/songs/maquina.mp3')).then(() => {
      typingSound.current.setVolumeAsync(0.3);
      typingSound.current.playAsync();
    });

    return () => {
      clearInterval(interval);
      typingSound.current.stopAsync();
    };
  }, []);

  return (
    <View style={styles.contentContainer}>
      <Text style={[styles.headerText, textBlurActive && styles.blurredText]}>{text}</Text>
      <Text style={[styles.descriptionText, textBlurActive && styles.blurredText]}>{secondText}</Text>
    </View>
  );
};

const HomeScreen = () => {
  const [blurActive, setBlurActive] = useState(false);
  const [notificationBlurActive, setNotificationBlurActive] = useState(false);
  const [textComplete, setTextComplete] = useState(false);
  const [textBlurActive, setTextBlurActive] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationIndex, setNotificationIndex] = useState(0);
  const [loading, setLoading] = useState(false); // Novo estado de carregamento

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonSound = useRef(new Audio.Sound());

  const notifications = [
    {
      message: "TAI 👽",
      description: "Olá! Muito bem vindo Usuário!",
    },
    {
      message: "TAI 👽",
      description: "Sou o app que transforma encontros em momentos profundos e, às vezes, hilários. Pronto para abrir o coração e se divertir?",
    },
    {
      message: "TAI 👽",
      description: "Antes de começarmos, por favor, faça login. Quero te chamar pelo nome e te conhecer melhor 😊",
    },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleOverlayEnd = () => {
    setOverlayVisible(false);
  };

  const handleNotificationClose = () => {
    setNotificationVisible(false);
    if (notificationIndex < notifications.length - 1) {
      setTimeout(() => {
        setNotificationIndex(notificationIndex + 1);
        showNotification(notificationIndex + 1);
      }, 500); // Add slight delay before showing the next notification
    } else {
      setNotificationBlurActive(false);
      setTextBlurActive(false);
    }
  };

  const showNotification = (index) => {
    setNotificationIndex(index);
    setNotificationVisible(true);
  };

  const handleGoogleLogin = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../assets/songs/mouseclick.mp3'));
      await sound.setVolumeAsync(0.3);
      await sound.playAsync();

      navigation.navigate('GoogleLogin');
    } catch (error) {
      console.log('Erro ao reproduzir som do botão:', error);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true); // Inicia o carregamento
    try {
      // Logout do Facebook antes do login
      await LoginManager.logOut();

      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (result.isCancelled) {
        console.log('Login cancelado.');
      } else {
        const data = await AccessToken.getCurrentAccessToken();
        if (!data) {
          console.log('Erro ao obter o token de acesso.');
          setLoading(false); // Para o carregamento em caso de erro
          return;
        }
        console.log("Token de acesso do Facebook:", data.accessToken);
        const userInfo = await fetch(`https://graph.facebook.com/me?access_token=${data.accessToken}&fields=id,name,email`);
        const user = await userInfo.json();
        console.log("Informações do usuário do Facebook:", user);
        await saveUserData(user, 'facebook');
        await checkTutorialStatus(user);

        // Save login state
        await AsyncStorage.setItem('facebookLoggedIn', 'true');
        await AsyncStorage.setItem('facebookUser', JSON.stringify(user));

        navigation.navigate('Detalhes');
      }
    } catch (error) {
      console.log('Erro durante o login do Facebook:', error);
    } finally {
      setLoading(false); // Para o carregamento
    }
  };

  const saveUserData = async (user, authProvider) => {
    try {
      const userDocRef = doc(db, "users", user.id);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          name: user.name,
          email: user.email,
          authProvider: authProvider,
          purchasedPackages: [],
          Tutorial: false, // Adiciona o campo Tutorial com valor false para novos usuários
        });
        console.log('Dados do usuário criados com sucesso.');
      } else {
        await updateDoc(userDocRef, {
          name: user.name,
          email: user.email,
          authProvider: authProvider
        });
        console.log('Dados do usuário atualizados com sucesso.');
      }
    } catch (e) {
      console.error('Erro ao salvar dados do usuário:', e);
    }
  };

  const checkTutorialStatus = async (user) => {
    try {
      const userRef = doc(db, 'users', user.id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.Tutorial) {
          // Lógica se o tutorial estiver completo
        } else {
          // Lógica se o tutorial não estiver completo
        }
      } else {
        await setDoc(userRef, { Tutorial: false, name: user.name, email: user.email });
      }
    } catch (error) {
      console.error('Erro ao verificar o status do tutorial:', error);
    }
  };

  useEffect(() => {
    const restoreLoginState = async () => {
      try {
        const facebookLoggedIn = await AsyncStorage.getItem('facebookLoggedIn');
        const facebookUser = await AsyncStorage.getItem('facebookUser');

        if (facebookLoggedIn === 'true' && facebookUser) {
          const user = JSON.parse(facebookUser);
          console.log("Restaurando sessão do usuário do Facebook:", user);
          await saveUserData(user, 'facebook');
          await checkTutorialStatus(user);
        }
      } catch (error) {
        console.error("Erro ao restaurar o estado de login:", error);
      }
    };

    restoreLoginState();
  }, []);

  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../assets/background/Ativo 1.jpg')}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
          style={styles.gradientOverlay}
        />

        <Header 
          setBlurActive={setBlurActive} 
          setTextComplete={setTextComplete} 
          setNotificationBlurActive={setNotificationBlurActive} 
          fadeAnim={fadeAnim}
          textBlurActive={textBlurActive} 
          setTextBlurActive={setTextBlurActive}
          showNotification={showNotification}
        />

        <Footer 
          handleGoogleLogin={handleGoogleLogin}
          handleFacebookLogin={handleFacebookLogin}
          blurActive={blurActive} 
          notificationBlurActive={notificationBlurActive} 
          textComplete={textComplete} 
        />

        {(blurActive || notificationBlurActive || textBlurActive || loading) && (
          <Animated.View style={{ ...styles.blurEffect, opacity: fadeAnim }}>
            <BlurView
              style={styles.blurEffect}
              blurType="dark"
              blurAmount={10}
              reducedTransparencyFallbackColor="rgba(0, 0, 0, 0.7)"
            />
          </Animated.View>
        )}

        {notificationVisible && (
          <DraggableNotification
            message={notifications[notificationIndex].message}
            description={notifications[notificationIndex].description}
            onClose={handleNotificationClose}
          />
        )}

        {overlayVisible && <OverlayFadeIn duration={5000} onAnimationEnd={handleOverlayEnd} />}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
};

const Footer = ({ handleGoogleLogin, handleFacebookLogin, blurActive, notificationBlurActive, textComplete }) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.footerContainer, (blurActive || notificationBlurActive) && styles.darkBackground]}>
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>Logar com</Text>
        <View style={styles.divider} />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.facebookButton,
            (blurActive || notificationBlurActive) && styles.darkBackground,
          ]}
          onPress={handleFacebookLogin}
        >
          <FontAwesome5 name="facebook-square" size={24} color="white" style={styles.buttonIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.googleButton,
            (blurActive || notificationBlurActive) && styles.darkBackground,
          ]}
          onPress={handleGoogleLogin}
        >
          <FontAwesome5 name="google" size={24} color="white" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'black',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  headerText: {
    fontSize: windowWidth * 0.12,
    fontFamily: 'Quicksand-VariableFont_wght',
    color: 'white',
    position: 'absolute',
    top: '15%',
    left: 0,
    width: '100%',
    textAlign: 'center',
    zIndex: 3,
  },
  descriptionText: {
    fontSize: windowWidth * 0.05,
    fontFamily: 'Quicksand-VariableFont_wght',
    color: 'white',
    position: 'absolute',
    top: '24%',
    left: 0,
    width: '100%',
    textAlign: 'center',
    zIndex: 3,
  },
  blurredText: {
    opacity: 0.1,
  },
  footerContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '18%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: windowWidth * 0.35,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: 'gray',
    marginHorizontal: 5,
    zIndex: 2,
    flexDirection: 'row',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 5,
  },
  facebookButton: {},
  googleButton: {},
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  divider: {
    width: 130,
    height: 1,
    backgroundColor: 'white',
  },
  dividerText: {
    color: 'white',
    marginHorizontal: 15,
    fontFamily: 'Quicksand-VariableFont_wght',
    fontSize: 15,
    textAlign: 'center',
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  blurEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  darkBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
   	alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 5,
  },
});

export default HomeScreen;
