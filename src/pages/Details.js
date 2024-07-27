import React, { useRef, useState, useEffect, useContext, useCallback } from 'react';
import {
  Animated, SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
  LogBox, Dimensions, TouchableWithoutFeedback, Image, Keyboard, ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken, GraphRequest, GraphRequestManager } from 'react-native-fbsdk-next';
import { useNavigation } from '@react-navigation/native';
import Loja from '../components/Loja';
import Inicio from '../components/Inicio';
import Pacotes from '../components/Pacotes';
import packageData from '../json/packageData.json';
import { Audio } from 'expo-av';
import { MusicContext } from '../components/MusicProvider';
import { BlurView } from '@react-native-community/blur';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import DraggableNotification from '../components/DraggableNotification';

const { width, height } = Dimensions.get('window');

const Details = () => {
  const navigation = useNavigation();
  const { pauseMusic, resumeMusic } = useContext(MusicContext);

  const [currentTab, setCurrentTab] = useState("Início");
  const [nextTab, setNextTab] = useState("Início");
  const [showMenu, setShowMenu] = useState(false);
  const [isBackgroundDarkened, setIsBackgroundDarkened] = useState(false);
  const [isBlurActive, setIsBlurActive] = useState(false);
  const [showBlinkingIcon, setShowBlinkingIcon] = useState(false);
  const [menuIconVisible, setMenuIconVisible] = useState(true);
  const [isMenuDisabled, setIsMenuDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkBackground, setIsDarkBackground] = useState(true);
  const [isInteractionBlocked, setIsInteractionBlocked] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const scaleValue = useRef(new Animated.Value(1)).current;
  const offsetValue = useRef(new Animated.Value(0)).current;
  const closeButtonOffset = useRef(new Animated.Value(0)).current;
  const [loggedInService, setLoggedInService] = useState(null);
  const [userName, setUserName] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [userProfilePic, setUserProfilePic] = useState(null);
  const [isProfilePicLoading, setIsProfilePicLoading] = useState(true);
  const [isMenuNotificationShown, setIsMenuNotificationShown] = useState(false);
  const [isTutorialCompleted, setIsTutorialCompleted] = useState(false);
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const currentOpacity = useRef(new Animated.Value(1)).current;
  const nextOpacity = useRef(new Animated.Value(0)).current;
  const userNameColor = useRef(new Animated.Value(0)).current;
  const [shouldOpenMenu, setShouldOpenMenu] = useState(false); // Novo estado

  const inicioOpacity = useRef(new Animated.Value(1)).current;
  const bibliotecaOpacity = useRef(new Animated.Value(1)).current;
  const lojaOpacity = useRef(new Animated.Value(1)).current;

  const tabPositions = {
    "Início": 0,
    "Meus Packs": width * 0.33,
    "Loja": width * 0.66,
  };

  const tabBackgroundColors = {
    "Início": '#1c1c1c',
    "Meus Packs": '#F5F5F5',
    "Loja": '#808080',
  };

  const [logoutButtonColor, setLogoutButtonColor] = useState({ iconColor: 'black', textColor: 'black' });

  const backgroundPosition = useRef(new Animated.Value(tabPositions["Início"])).current;
  const backgroundColor = useRef(new Animated.Value(0)).current;

  const animateTab = useCallback((tab) => {
    let currentOpacity;
    switch (currentTab) {
      case "Início":
        currentOpacity = inicioOpacity;
        break;
      case "Meus Packs":
        currentOpacity = bibliotecaOpacity;
        break;
      case "Loja":
        currentOpacity = lojaOpacity;
        break;
      default:
        currentOpacity = inicioOpacity;
    }

    let nextOpacity;
    switch (tab) {
      case "Início":
        nextOpacity = inicioOpacity;
        break;
      case "Meus Packs":
        nextOpacity = bibliotecaOpacity;
        break;
      case "Loja":
        nextOpacity = lojaOpacity;
        break;
      default:
        nextOpacity = inicioOpacity;
    }

    Animated.parallel([
      Animated.timing(currentOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(nextOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentTab(tab);
      currentOpacity.setValue(1);
    });
  }, [currentTab]);

  useEffect(() => {
    const currentTabColor = tabBackgroundColors[currentTab];
    const nextTabColor = tabBackgroundColors[nextTab];
    Animated.parallel([
      Animated.timing(currentOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(nextOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(backgroundPosition, {
        toValue: tabPositions[nextTab],
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(backgroundColor, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setCurrentTab(nextTab);
      currentOpacity.setValue(1);
      nextOpacity.setValue(0);
      backgroundColor.setValue(0);
    });

    if (nextTab === "Início") {
      setLogoutButtonColor({ iconColor: 'white', textColor: 'white' });
    } else {
      setLogoutButtonColor({ iconColor: 'black', textColor: 'black' });
    }
  }, [nextTab]);

  useEffect(() => {
    LogBox.ignoreLogs(['Setting a timer']);

    const fetchData = async () => {
      setIsLoading(true);
      const facebookAccessToken = await AccessToken.getCurrentAccessToken();
      if (facebookAccessToken) {
        setLoggedInService('facebook');
        await fetchFacebookUserProfile();
      } else {
        const isGoogleSignedIn = await GoogleSignin.isSignedIn();
        if (isGoogleSignedIn) {
          setLoggedInService('google');
          await fetchGoogleUserProfile();
        }
      }
      await checkTutorialStatus();
    };

    fetchData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      const facebookAccessToken = await AccessToken.getCurrentAccessToken();
      if (facebookAccessToken) {
        setLoggedInService('facebook');
        await fetchFacebookUserProfile();
      } else {
        const isGoogleSignedIn = await GoogleSignin.isSignedIn();
        if (isGoogleSignedIn) {
          setLoggedInService('google');
          await fetchGoogleUserProfile();
        }
      }
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (currentTab === "Loja") {
      pauseMusic();
      stopCurrentSound();
    } else {
      resumeMusic();
    }
  }, [currentTab]);

  useEffect(() => {
    if (showBlinkingIcon) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      blinkAnim.setValue(1);
    }
  }, [showBlinkingIcon]);

  const getUserInfo = async () => {
    const googleUserInfo = await GoogleSignin.getCurrentUser();
    if (googleUserInfo) {
      return { id: googleUserInfo.user.id, name: googleUserInfo.user.name, email: googleUserInfo.user.email };
    }

    const facebookAccessToken = await AccessToken.getCurrentAccessToken();
    if (facebookAccessToken) {
      return { id: facebookAccessToken.userID, name: userName, email: '' };
    }

    return null;
  };

  const checkTutorialStatus = async () => {
    try {
      const user = await getUserInfo();
      if (user) {
        const userRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log(`Tutorial completed: ${userData.Tutorial}`);
          if (userData.Tutorial) {
            setIsTutorialCompleted(true);
            setIsBlurActive(false);
            setIsLoading(false);
            setIsDarkBackground(false);
            setIsInteractionBlocked(false);
          } else {
            startTutorial();
          }
        } else {
          await setDoc(userRef, { Tutorial: false, name: user.name, email: user.email });
          console.log("Creating new user profile with tutorial set to false.");
          startTutorial();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar o status do tutorial:', error);
    }
  };

  const startTutorial = useCallback(() => {
    setIsTutorialCompleted(false);
    setIsInteractionBlocked(true);
    showWelcomeNotification();
    setIsLoading(false);
    setIsDarkBackground(true);
  }, []);

  const completeTutorial = useCallback(async () => {
    try {
      const user = await getUserInfo();
      if (user) {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, { Tutorial: true }, { merge: true });
        setIsTutorialCompleted(true);
        setIsBlurActive(false);
        setIsDarkBackground(false);
        setIsInteractionBlocked(false);

        setTimeout(() => {
          toggleMenu(false);
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao completar o tutorial:', error);
    }
  }, [toggleMenu]);

  const showNotification = useCallback(({ message, description, onClose, topOffset = 0 }) => {
    setIsMenuDisabled(true);
    setNotification({
      message,
      description,
      onClose: () => {
        onClose();
        setIsMenuDisabled(false);
      },
      topOffset
    });
  }, []);

  const showWelcomeNotification = useCallback(() => {
    const userFirstName = userName || 'Usuário';

    if (isTutorialCompleted) {
      setIsBlurActive(false);
      return;
    }

    setIsBlurActive(true);
    showNotification({
      message: "TAI 👽",
      description: `Bem-vindo, ${userFirstName}! Saudações a todos vocês presentes!`,
      onClose: () => {
        if (isTutorialCompleted) {
          setIsBlurActive(false);
        } else {
          showIntroNotification();
        }
      }
    });
  }, [userName, isTutorialCompleted, showNotification]);

  const showIntroNotification = useCallback(() => {
    if (isTutorialCompleted) return;

    showNotification({
      message: "TAI 👽",
      description: "Vou apresentar o app rapidamente. Confira as principais funcionalidades clicando no menu.",
      onClose: () => {
        setShowBlinkingIcon(true);
      }
    });
  }, [isTutorialCompleted, showNotification]);

  const stopCurrentSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }, []);

  const fetchGoogleUserProfile = useCallback(async () => {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      console.log('Google User Info:', userInfo); // Log para depuração
  
      if (userInfo) {
        setUserInfo(userInfo);
        const fullName = userInfo.user.name || '';
        console.log('Full Name:', fullName); // Log do nome completo
        const firstName = fullName.split(' ')[0];
        setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
        setUserProfilePic(userInfo.user.photo);
        setIsProfilePicLoading(false);
      } else {
        console.log('No user info available');
      }
    } catch (error) {
      console.error('Erro ao obter informações do usuário do Google:', error);
    }
  }, []);
  
  
  const fetchFacebookUserProfile = useCallback(() => {
    const responseInfoCallback = (error, result) => {
      if (error) {
        console.error('Erro ao obter informações do usuário do Facebook:', error);
      } else {
        console.log('Facebook User Info:', result); // Log para depuração
        const fullName = result.name || '';
        const firstName = fullName.split(' ')[0];
        setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1));
        const profilePicUrl = result.picture.data.url;
        setUserProfilePic(profilePicUrl);
        setIsProfilePicLoading(false);
      }
    };
  
    const infoRequest = new GraphRequest(
      '/me',
      {
        accessToken: AccessToken.getCurrentAccessToken()?.accessToken,
        parameters: {
          fields: {
            string: 'id,name,picture.type(large)',
          },
        },
      },
      responseInfoCallback
    );
  
    new GraphRequestManager().addRequest(infoRequest).start();
  }, []);
  
  
  const handleGoogleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      setTimeout(() => {
        navigation.navigate('Home');
        setIsLoggingOut(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao fazer logout do Google:', error);
      setIsLoggingOut(false);
    }
  }, [navigation]);

  const handleFacebookLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await LoginManager.logOut();
      setTimeout(() => {
        navigation.navigate('Home');
        setIsLoggingOut(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao fazer logout do Facebook:', error);
      setIsLoggingOut(false);
    }
  }, [navigation]);

  const toggleMenu = useCallback(async (openMenu) => {
    if (isMenuDisabled) return;

    if (openMenu) {
      await reloadUserProfile();
    }

    Animated.timing(scaleValue, {
      toValue: openMenu ? 0.88 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(offsetValue, {
      toValue: openMenu ? 230 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(closeButtonOffset, {
      toValue: openMenu ? 0 : -30,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (openMenu) {
      Keyboard.dismiss();
      setShowMenu(true);
      showMenuNotification();
    } else {
      setShowMenu(false);
      if (isTutorialCompleted) {
        handleTabNotification(currentTab);
      }
    }
  }, [isMenuDisabled, scaleValue, offsetValue, closeButtonOffset, reloadUserProfile, showMenuNotification, isTutorialCompleted, currentTab]);

  const reloadUserProfile = useCallback(async () => {
    const facebookAccessToken = await AccessToken.getCurrentAccessToken();
    if (facebookAccessToken) {
      setLoggedInService('facebook');
      await fetchFacebookUserProfile();
    } else {
      const isGoogleSignedIn = await GoogleSignin.isSignedIn();
      if (isGoogleSignedIn) {
        setLoggedInService('google');
        await fetchGoogleUserProfile();
      }
    }
  }, [fetchFacebookUserProfile, fetchGoogleUserProfile]);

  const handleMenuIconPress = useCallback(() => {
    if (isMenuDisabled) return;
    setShowBlinkingIcon(false);
    toggleMenu(!showMenu);
  }, [isMenuDisabled, toggleMenu, showMenu]);

  const showMenuNotification = useCallback(() => {
    if (isTutorialCompleted) return;
    if (!isMenuNotificationShown) {
      setIsBackgroundDarkened(true);
      showNotification({
        message: "TAI 👽",
        description: "Este é o menu. Aqui você pode acessar todas as funcionalidades do aplicativo e navegar entre as diferentes seções.",
        onClose: () => {
          setIsBackgroundDarkened(false);
          setNextTab('Meus Packs');
          showLibraryNotification();
        }
      });
      setIsMenuNotificationShown(true);
    }
  }, [isTutorialCompleted, isMenuNotificationShown, showNotification, showLibraryNotification]);

  const showLibraryNotification = useCallback(() => {
    if (isTutorialCompleted) return;
    setIsBackgroundDarkened(true);
    showNotification({
      message: "TAI 👽",
      description: "Selecionando a aba Meus Packs, você pode acessar os pacotes adquiridos e selecionar o checkmark para usá-los na roleta.",
      onClose: () => {
        setIsBackgroundDarkened(false);
        setNextTab('Loja');
        showShopNotification();
      }
    });
  }, [isTutorialCompleted, showNotification, showShopNotification]);

  const showShopNotification = useCallback(() => {
    if (isTutorialCompleted) return;
    setIsBackgroundDarkened(true);
    showNotification({
      message: "TAI 👽",
      description: "Selecionando a aba Loja, você pode comprar e explorar novos pacotes.",
      onClose: () => {
        setIsBackgroundDarkened(false);
        setNextTab('Início');
        setShowMenu(false);
        showIntroNotifications();
      }
    });
  }, [isTutorialCompleted, showNotification, showIntroNotifications]);

  const showIntroNotifications = useCallback(() => {
    if (isTutorialCompleted) return;

    const userFirstName = userName || 'Usuário';

    const introMessages = [
      {
        message: "TAI 👽",
        description: `Ok ${userFirstName}, podemos começar. Meu principal objetivo é incentivar conversas abertas entre você e seus amigos, onde todos possam dizer o que pensam e sentem sobre diferentes assuntos, sem julgamentos!`,
      },
      {
        message: "TAI 👽",
        description: "A regra é simples! Reúna os amigos, clique em Início e START, coloque o celular no centro e gire a roleta, o escolhido lê a pergunta e todos devem responder.",
      },
      {
        message: "TAI 👽",
        description: `${userFirstName}, caso não se sinta à vontade com outros segurando seu celular, você pode ser o Speaker, gire a roleta, abra o envelope e leia a pergunta para o grupo. Simples assim!`,
      }
    ];

    let index = 0;

    const showNextNotification = () => {
      if (index < introMessages.length) {
        showNotification({
          message: introMessages[index].message,
          description: introMessages[index].description,
          onClose: () => {
            index += 1;
            showNextNotification();
          }
        });
      } else {
        completeTutorial();
        setShowBlinkingIcon(false);
        setIsBlurActive(false);
        setIsDarkBackground(false);
      }
    };

    showNextNotification();
  }, [isTutorialCompleted, userName, showNotification, completeTutorial]);

  const handleTabNotification = useCallback((tab) => {
    if (isTutorialCompleted) {
      if (tab === "Início") {
        showNotification({
          message: "TAI 👽",
          description: "Para iniciar a roleta, clique no botão 'Start'.",
          onClose: () => { },
          topOffset: 100
        });
      } else if (tab === "Meus Packs") {
        showNotification({
          message: "TAI 👽",
          description: "Aqui você pode selecionar seus pacotes adquiridos para seguir ao início.",
          onClose: () => { },
          topOffset: 150
        });
      } else if (tab === "Loja") {
        showNotification({
          message: "TAI 👽",
          description: `${userName}, aqui na loja temos mais categorias disponíveis com 10 perguntas cada, você pode clicar no envelope e ver uma amostra.`,
          onClose: () => { },
          topOffset: 200
        });
      }
    }
  }, [isTutorialCompleted, showNotification]);

  const changeTab = useCallback((tab) => {
    animateTab(tab);
    setNextTab(tab);
  }, [animateTab]);

  const displayContent = useCallback(() => {
    switch (currentTab) {
      case "Início":
        return (
          <View style={styles.Inicio}>
            <Inicio userName={userName} onPress={() => navigation.navigate('Roleta')} />
          </View>
        );
      case "Loja":
        return (
          <View style={styles.carouselContainer}>
            <Loja packageData={packageData} showMenu={showMenu} setIsBlurActive={setIsBlurActive} setMenuIconVisible={setMenuIconVisible} />
          </View>
        );
      case "Meus Packs":
        return (
          <View style={styles.libraryContainer}>
            <Pacotes />
          </View>
        );
      default:
        return null;
    }
  }, [currentTab, userName, showMenu, packageData, navigation, setIsBlurActive, setMenuIconVisible]);

  const shouldRenderMenuContainer = currentTab === "Meus Packs";

  const getMenuContainerStyle = useCallback(() => {
    return currentTab === "Meus Packs"
      ? styles.menuContainer
      : [styles.menuContainer, styles.transparentBackground];
  }, [currentTab]);

  const getTextColor = useCallback((currentTab, tabName) => {
    if (currentTab === 'Meus Packs') {
      return 'black';
    }
    return currentTab === tabName ? '#000000' : 'white';
  }, []);

  const TabButton = React.memo(({ currentTab, changeTab, title, iconName, opacity }) => {
    const textColor = getTextColor(currentTab, title);
    const iconColor = getTextColor(currentTab, title);

    const animatedStyle = {
      opacity: opacity,
    };

    return (
      <TouchableOpacity onPress={() => changeTab(title)}>
        <View style={[styles.tabButton, { backgroundColor: currentTab === title ? 'white' : 'transparent' }]}>
          <FontAwesome5 name={iconName} size={25} color={iconColor} style={styles.tabIcon} />
          <Animated.Text style={[styles.tabText, { color: textColor }, animatedStyle]}>{title}</Animated.Text>
        </View>
      </TouchableOpacity>
    );
  });

  const userNameTextColor = getTextColor(currentTab, 'Meus Packs');

  const [notification, setNotification] = useState(null);

  const shouldApplyBlur = useCallback((message) => {
    return !["Este é o menu. Aqui você pode acessar todas as funcionalidades do aplicativo e navegar entre as diferentes seções.",
      "Selecionando a aba Meus Packs, você pode acessar os pacotes adquiridos e selecionar o checkmark para usá-los na roleta.",
      "Selecionando a aba Loja, você pode comprar e explorar novos pacotes."].includes(message);
  }, []);

  return (
    <>
      <Animated.View style={[styles.container]}>
        {isInteractionBlocked && (
          <View style={styles.blockingOverlay} pointerEvents="none" />
        )}
        <SafeAreaView style={styles.innerContainer}>
          <Animated.View
            style={[
              styles.backgroundOverlay,
              {
                backgroundColor: backgroundColor.interpolate({
                  inputRange: [0, 1],
                  outputRange: [tabBackgroundColors[currentTab], tabBackgroundColors[nextTab]],
                }),
                opacity: currentOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.backgroundOverlay,
              {
                backgroundColor: backgroundColor.interpolate({
                  inputRange: [0, 1],
                  outputRange: [tabBackgroundColors[currentTab], tabBackgroundColors[nextTab]],
                }),
                opacity: nextOpacity,
              },
            ]}
          />
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}
          {!isLoading && (
            <View style={{ justifyContent: 'flex-start', padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {isProfilePicLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  userProfilePic ? (
                    <>
                      <Image source={{ uri: userProfilePic }} style={styles.profileImage} onLoadEnd={() => setIsProfilePicLoading(false)} />
                      <Text style={[styles.userName, { color: userNameTextColor }]}>{userName}</Text>
                    </>
                  ) : (
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white', marginTop: 40, marginLeft: 10 }}>Perfil</Text>
                  )
                )}
              </View>
              <View style={{ flexGrow: 1, marginTop: 50 }}>
                <TabButton currentTab={currentTab} changeTab={changeTab} title="Início" iconName="home" opacity={inicioOpacity} />
                <TabButton currentTab={currentTab} changeTab={changeTab} title="Meus Packs" iconName="box" opacity={bibliotecaOpacity} />
                <TabButton currentTab={currentTab} changeTab={changeTab} title="Loja" iconName="store-alt" opacity={lojaOpacity} />
              </View>
              <View>
                <TouchableOpacity onPress={loggedInService === 'facebook' ? handleFacebookLogout : handleGoogleLogout}>
                  <View style={styles.tabButton}>
                    <FontAwesome5 name="sign-out-alt" size={25} color={logoutButtonColor.iconColor} />
                    <Text style={[styles.tabText1, { color: logoutButtonColor.textColor }]}>LogOut</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {isDarkBackground && (
            <View style={styles.darkOverlay} />
          )}
          {isBlurActive && shouldApplyBlur(notification?.description) && (
            <BlurView
              style={styles.blurView}
              blurType="dark"
              blurAmount={10}
            />
          )}
          {menuIconVisible && showBlinkingIcon && (
            <Animated.View style={{
              position: 'absolute',
              top: 65,
              left: 20,
              zIndex: 3,
              opacity: blinkAnim
            }}>
              <TouchableOpacity onPress={handleMenuIconPress}>
                <FontAwesome5 name="bars" size={Dimensions.get('window').width * 0.07} color="#999999" />
              </TouchableOpacity>
            </Animated.View>
          )}
          {showMenu && (
            <TouchableWithoutFeedback onPress={() => toggleMenu(false)}>
              <View style={styles.transparentOverlayContent} />
            </TouchableWithoutFeedback>
          )}
          <Animated.View style={[
            getMenuContainerStyle(),
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1,
              transform: [
                { scale: scaleValue },
                { translateX: offsetValue }
              ]
            }
          ]}>
            <View style={{ flex: 1 }}>
              <View style={{ transform: [{ translateY: showMenu ? 0 : -30 }], position: 'absolute', }}>
                {menuIconVisible && (
                  <TouchableOpacity onPress={handleMenuIconPress} style={{ right: Dimensions.get('window').height * 0.2, top: Dimensions.get('window').height * 0.035, zIndex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <FontAwesome5 name="bars" size={Dimensions.get('window').width * 0.07} color="#999999" style={styles.menuIcon} />
                  </TouchableOpacity>
                )}
                {currentTab === "Meus Packs" && (
                  <Text style={styles.libraryTitle}>Meus Packs</Text>
                )}
                <View style={styles.menuDescriptionContainer}>
                  {displayContent()}
                </View>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
      <Animated.View style={[styles.tabBackground, { left: backgroundPosition }]} />
      {notification && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <DraggableNotification
            message={notification.message}
            description={notification.description}
            onClose={() => {
              const onClose = notification.onClose;
              setNotification(null);
              onClose();
            }}
            topOffset={notification.topOffset}
            style={styles.draggableNotification}
          />
        </View>
      )}
      {isLoggingOut && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  innerContainer: {
    flex: 1,
    width: Dimensions.get('window').width * 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  menuContainer: {
    backgroundColor: '#f1e8d9',
    shadowColor: '#000000',
    borderRadius: 10,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },

  tabButton: {
    flexDirection: "row",
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 13,
    paddingRight: 35,
    borderRadius: 8,
    marginTop: 15
  },
  tabIcon: {
    marginRight: 15,
  },
  tabText: {
    fontSize: 17,
    color: 'white',
    marginLeft: 10,
    fontFamily: 'Quicksand-VariableFont_wght',
  },
  tabText1: {
    fontSize: 17,
    color: 'black',
    marginLeft: 10,
    fontFamily: 'Quicksand-VariableFont_wght',
  },

  menuIcon: {
    marginTop: Dimensions.get('window').height * 0.07,
    marginLeft: Dimensions.get('window').height * 0.02,
  },
  libraryTitle: {
    fontSize: 40,
    color: '#000',
    textAlign: 'center',
    right: height * 0.07,
    top: height * 0.04,
    zIndex: 1,
    fontFamily: 'Quicksand-VariableFont_wght',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 10,
  },
  menuDescriptionContainer: {
    alignItems: 'center',
  },
  menuDescription: {
    fontSize: 16,
    color: 'black',
  },
  carouselContainer: {
    bottom: Dimensions.get('window').height * 0.17,
    right: Dimensions.get('window').height * 0.001,
  },
  libraryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    height: height - 80,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginTop: 40,
    marginLeft: 10,
  },
  userName: {
    fontSize: 15,
    fontFamily: 'Quicksand-VariableFont_wght',
    color: 'white',
    marginTop: 40,
    marginLeft: 12,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 2,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  transparentOverlayContent: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: Dimensions.get('window').width * 0.55,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  tabBackground: {
    position: 'absolute',
    width: width * 0.33,
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 8,
    zIndex: -1,
  },
  blockingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 4,
  },
  draggableNotification: {
    position: 'absolute',
    top: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  Inicio:{
    top: height * 0.02, 
  }
});

export default Details;
