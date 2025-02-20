import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Dimensions, Image, Animated, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AccessToken } from 'react-native-fbsdk-next';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '../../firebaseConfig';
import Carousel from 'react-native-snap-carousel';

const db = getFirestore(app);

const { width, height } = Dimensions.get('window');

import img18 from '../../assets/pacotes/18.jpg';
import imgAmigos from '../../assets/pacotes/amigos.jpg';
import imgFriends from '../../assets/pacotes/friends.jpg';
import imgLudicas from '../../assets/pacotes/ludicas.jpg';
import imgMemorias from '../../assets/pacotes/memorias.jpg';
import imgPoliticamente from '../../assets/pacotes/politicamente.jpg';
import imgRela from '../../assets/pacotes/rela.jpg';
import imgRir from '../../assets/pacotes/rir.jpg';
import imgSobrevoce from '../../assets/pacotes/sobrevoce.jpg';
import imgCrush from '../../assets/pacotes/crush.jpg';
import imgFam from '../../assets/pacotes/familia.jpg';
import imgGratis from '../../assets/background/back_details.jpg';

const packageImages = {
  'Apimentadas': img18,
  'Sobre Grupo': imgAmigos,
  'Reflexão': imgFriends,
  'Lúdicas': imgLudicas,
  'Memórias': imgMemorias,
  'Politicamente incorretas': imgPoliticamente,
  'Relacionamentos': imgRela,
  'Para fazer rir': imgRir,
  'Sobre Você': imgSobrevoce,
  'Crush': imgCrush,
  'Família': imgFam,
  'Pacote Grátis': imgGratis,
};

const Inicio = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userName } = route.params || {};

  const [userInfo, setUserInfo] = useState(null);
  const [purchasedPackages, setPurchasedPackages] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [leftActiveIndex, setLeftActiveIndex] = useState(0);
  const [rightActiveIndex, setRightActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const blinkAnim = useState(new Animated.Value(1))[0];
  const textBlinkAnim = useState(new Animated.Value(1))[0];
  const buttonScale = useState(new Animated.Value(1))[0]; // Estado para a escala do botão
  const freePackage = 'Pacote Grátis';

  useEffect(() => {
    const fetchUserInfo = async () => {
      const info = await getUserInfo();
      setUserInfo(info);

      if (info) {
        await fetchPurchasedPackages(info.id);
        await loadCheckedItems(info.id);
      }
      setLoading(false);
    };

    fetchUserInfo();
  }, []);

  const fetchPurchasedPackages = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      let packages = [];
      if (userDoc.exists()) {
        packages = userDoc.data().purchasedPackages || [];
      }
      if (!packages.includes(freePackage)) {
        packages.push(freePackage);
      }
      setPurchasedPackages(packages);
      console.log('Pacotes comprados:', packages);
    } catch (error) {
      console.error('Erro ao buscar pacotes comprados:', error);
    }
  };

  const loadCheckedItems = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      let items = {};
      if (userDoc.exists()) {
        items = userDoc.data().checkedItems || {};
      }

      if (Object.keys(items).length === 0) {
        items[freePackage] = true;
        await setDoc(userDocRef, { checkedItems: items }, { merge: true });
      }

      setCheckedItems(items);
      setSelectedPackages(Object.keys(items).filter(key => items[key]));
      console.log('Itens selecionados:', items);
    } catch (error) {
      console.error('Erro ao carregar itens selecionados:', error);
    }
  };

  const getUserInfo = async () => {
    const googleUserInfo = await GoogleSignin.getCurrentUser();
    if (googleUserInfo) {
      return { id: googleUserInfo.user.id, name: googleUserInfo.user.name };
    }

    const facebookAccessToken = await AccessToken.getCurrentAccessToken();
    if (facebookAccessToken) {
      const response = await fetch(`https://graph.facebook.com/me?access_token=${facebookAccessToken.accessToken}&fields=id,name`);
      const data = await response.json();
      return { id: data.id, name: data.name };
    }

    return null; // Corrigir aqui
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [blinkAnim]);

  const handlePlayPress = () => {
    console.log('Iniciando jogo com pacotes:', purchasedPackages);
    console.log('Informações do usuário:', userInfo);
    console.log('Itens verificados:', checkedItems);

    if (!userInfo) {
      console.error('Informações do usuário não estão disponíveis');
      return;
    }

    if (selectedPackages.length === 0) {
      console.error('Nenhum pacote selecionado');
      Animated.sequence([
        Animated.timing(textBlinkAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(textBlinkAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.navigate('Roleta', { purchasedPackages, userInfo, checkedItems });
    });
  };

  const leftCarouselItems = selectedPackages.filter((_, index) => index % 2 === 0);
  const rightCarouselItems = selectedPackages.filter((_, index) => index % 2 !== 0);

  const renderCarouselItem = ({ item }) => (
    <View style={styles.packageItem}>
      <Image source={packageImages[item]} style={styles.packageImage} />
      <Text style={styles.packageName}>{item}</Text>
    </View>
  );

  return (
    <ImageBackground source={require('../../assets/background/back.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.container}>
          <Animated.View style={{ opacity: blinkAnim, transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity onPress={handlePlayPress} style={styles.newButton}>
              <Text style={styles.newButtonText}>START</Text>
            </TouchableOpacity>
          </Animated.View>

          {selectedPackages.length > 1 && (
            <View style={styles.dividerContainer}>
              <View style={styles.dividerVertical} />
            </View>
          )}

          <View style={styles.carouselContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : selectedPackages.length === 1 ? (
              <View style={styles.singlePackageContainer}>
                {renderCarouselItem({ item: selectedPackages[0] })}
              </View>
            ) : (
              <>
                <View>
                  <Carousel
                    data={leftCarouselItems}
                    renderItem={renderCarouselItem}
                    sliderWidth={width * 0.4}
                    itemWidth={width * 0.4}
                    onSnapToItem={(index) => setLeftActiveIndex(index)}
                  />
                  <View style={styles.indicatorContainer}>
                    {leftCarouselItems.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          {
                            opacity: leftActiveIndex === index ? 1 : 0.5,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>
                <View>
                  <Carousel
                    data={rightCarouselItems}
                    renderItem={renderCarouselItem}
                    sliderWidth={width * 0.4}
                    itemWidth={width * 0.4}
                    onSnapToItem={(index) => setRightActiveIndex(index)}
                  />
                  <View style={styles.indicatorContainer}>
                    {rightCarouselItems.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          {
                            opacity: rightActiveIndex === index ? 1 : 0.5,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>

          <View style={styles.lineContainer}>
            <View style={styles.line} />
            <View style={styles.circle} />
          </View>
          <Animated.Text style={[styles.userName, { opacity: textBlinkAnim }]}>
            {selectedPackages.length > 0 ? 'Pacotes selecionados' : 'Nenhum pacote selecionado'}
          </Animated.Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    bottom: height * 0.13,
    width: width * 1,
    height: height * 1.1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    top: height * 0.12,
  },
  newButton: {
    width: width * 0.3,
    height: 40,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 9, 10, 0.59)', // Fundo azul
    marginVertical: height * 0.08,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    top: width * 0.1,
  },
  newButtonText: {
    color: 'white',
    fontSize: 20,
    fontFamily: 'Quicksand-VariableFont_wght',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  dividerContainer: {
    position: 'absolute',
    top: '77%',
    left: '50%',
    transform: [{ translateX: -1 }],
    height: height * 0.1,
    justifyContent: 'center',
  },
  dividerVertical: {
    width: 1,
    height: '100%',
    backgroundColor: 'white',
  },
  carouselContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  singlePackageContainer: {
    position: 'absolute',
    top: height * -0.06,
    right: height * 0.1,
    alignItems: 'center',
  },
  packageItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  packageImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 5,
  },
  packageName: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 10,
    fontFamily: 'Quicksand-VariableFont_wght',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginHorizontal: 2,
  },
  lineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    width: width * 0.9,
    justifyContent: 'center',
    position: 'relative',
  },
  line: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'white',
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    zIndex: 1,
  },
  userName: {
    fontSize: 18,
    color: 'white',
    marginTop: 10,
    fontFamily: 'Quicksand-VariableFont_wght',
    textShadowColor: '#000',
    textShadowOffset: { width: 5, height: 5 },
    textShadowRadius: 10,
  },
});

export default Inicio;
