import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from 'react-native-vector-icons';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AccessToken } from 'react-native-fbsdk-next';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { BackHandler } from 'react-native';
import { MusicContext } from '../components/MusicProvider';

const PackageDetails = ({ route, navigation }) => {
  const { title, price, description } = route.params.packageData;
  const { stopMusic } = useContext(MusicContext); // Use o contexto da música
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isLocked, setIsLocked] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchaseConfirmed, setIsPurchaseConfirmed] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const productIDs = {
    "Reflexão": "product_reflexao",
    "Relacionamentos": "product_relacionamentos",
    "Memórias": "product_memorias",
    "Sobre Você": "product_sobrevc",
    "Sobre Grupo": "product_sobregp",
    "Apimentadas": "product_apimentadas",
    "Lúdicas": "product_ludicas",
    "Politicamente incorretas": "product_politicamenteinc",
    "Para fazer rir": "product_pararir",
    "Crush": "product_crush",
    "Família": "product_fam",
  };

  const imageMap = {
    "Reflexão": require('../../assets/pacotes/friends.jpg'),
    "Relacionamentos": require('../../assets/pacotes/rela.jpg'),
    "Memórias": require('../../assets/pacotes/memorias.jpg'),
    "Sobre Você": require('../../assets/pacotes/sobrevoce.jpg'),
    "Sobre Grupo": require('../../assets/pacotes/amigos.jpg'),
    "Apimentadas": require('../../assets/pacotes/18.jpg'),
    "Lúdicas": require('../../assets/pacotes/ludicas.jpg'),
    "Politicamente incorretas": require('../../assets/pacotes/politicamente.jpg'),
    "Para fazer rir": require('../../assets/pacotes/rir.jpg'),
    "Crush": require('../../assets/pacotes/crush.jpg'),
    "Família": require('../../assets/pacotes/familia.jpg'),
  };

  const questionData = {
    "Reflexão": require('../json/package/Reflexao/reflexao1.json'),
    "Relacionamentos": require('../json/package/Relacionamentos/relacionamento.json'),
    "Memórias": require('../json/package/Memorias/Memorias.json'),
    "Sobre Você": require('../json/package/Sobre_voce/sobre_voce1.json'),
    "Sobre Grupo": require('../json/package/Sobre_grupo/sobre_grupo1.json'),
    "Apimentadas": require('../json/package/Apimentadas/apimentadas1.json'),
    "Lúdicas": require('../json/package/Ludicas/Ludicas1.json'),
    "Politicamente Incorretas": require('../json/package/Politicamente_incorretas/politicamente_incorreta1.json'),
    "Para fazer rir": require('../json/package/Rir/pararir1.json'),
    "Crush": require('../json/package/Crush/crush.json'),
    "Família": require('../json/package/Familia/fam.json'),
  };

  useEffect(() => {
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    stopMusic(); // Parar a música de fundo ao entrar na tela
    return () => {
      stopMusic(); // Parar a música de fundo ao sair da tela
    };
  }, [stopMusic]);

  useEffect(() => {
    Purchases.setDebugLogsEnabled(true);
    Purchases.configure({ apiKey: "goog_lXEZNVBIYLhRXmWsnLnkbquIDus" });

    const checkAuthentication = async () => {
      try {
        const googleUserInfo = await GoogleSignin.getCurrentUser();
        const facebookAccessToken = await AccessToken.getCurrentAccessToken();

        if (!googleUserInfo && !facebookAccessToken) {
          console.log("Usuário não está autenticado.");
        } else {
          console.log("Usuário está autenticado.");
          await fetchProducts();
          await checkIfPackagePurchased();
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
      }
    };

    const fetchProducts = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        console.log("Ofertas obtidas:", offerings);
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          const productID = productIDs[title];
          const selectedPkg = offerings.current.availablePackages.find(pkg => pkg.product.identifier === productID);
          setSelectedPackage(selectedPkg);
          console.log("Pacote selecionado:", selectedPkg);
        }
      } catch (e) {
        console.error("Erro ao obter ofertas:", e);
      }
    };

    const checkIfPackagePurchased = async () => {
      try {
        const userInfo = await getUserInfo();
        if (userInfo) {
          const userRef = doc(db, 'users', userInfo.id);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const purchasedPackages = userSnap.data().purchasedPackages || [];
            if (purchasedPackages.includes(title)) {
              setIsLocked(false);
            }
          }

          setUserInfo(userInfo);
        }
      } catch (error) {
        console.error('Erro ao verificar pacotes comprados:', error);
      }
    };

    checkAuthentication();
  }, [title]);

  const purchaseProduct = async () => {
    const userInfo = await getUserInfo();
    if (!userInfo) {
      Alert.alert("Erro", "Usuário não autenticado");
      return;
    }

    setIsLoading(true);

    try {
      const { purchaserInfo, productIdentifier } = await Purchases.purchasePackage(selectedPackage);
      console.log("Compra realizada com sucesso:", purchaserInfo, productIdentifier);

      setIsLocked(false);
      setIsPurchaseConfirmed(true);

      setTimeout(() => {
        setIsPurchaseConfirmed(false);
        unlockPackage(title, userInfo);
      }, 3000);
    } catch (e) {
      console.error("Erro na compra:", e);
      if (!e.userCancelled) {
        Alert.alert("Erro", `Erro na compra: ${e.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const unlockPackage = async (packageTitle, userInfo) => {
    try {
      console.log("Informações do usuário para desbloqueio do pacote:", userInfo);
      if (userInfo) {
        const userRef = doc(db, 'users', userInfo.id);
        const userSnap = await getDoc(userRef);
        let purchasedPackages = [];

        if (userSnap.exists()) {
          purchasedPackages = userSnap.data().purchasedPackages || [];
        }

        if (!purchasedPackages.includes(packageTitle)) {
          purchasedPackages.push(packageTitle);
          await setDoc(userRef, { purchasedPackages }, { merge: true });

          const questions = questionData[packageTitle];
          await AsyncStorage.setItem(`questions_${userInfo.id}_${packageTitle}`, JSON.stringify(questions));
          console.log(`Pacote "${packageTitle}" liberado com sucesso! JSON de perguntas armazenado:`, questions);
        }
      } else {
        console.log("Erro: userInfo é null");
      }
    } catch (error) {
      console.error('Erro ao salvar o pacote comprado:', error);
    }
  };

  const getUserInfo = async () => {
    try {
      const googleUserInfo = await GoogleSignin.getCurrentUser();
      if (googleUserInfo) {
        console.log("Usuário do Google conectado:", googleUserInfo);
        return { id: googleUserInfo.user.id, name: googleUserInfo.user.name, email: googleUserInfo.user.email };
      } else {
        console.log("Nenhum usuário do Google conectado.");
      }

      const facebookAccessToken = await AccessToken.getCurrentAccessToken();
      if (facebookAccessToken) {
        console.log("Token de acesso do Facebook obtido:", facebookAccessToken);
        const response = await fetch(`https://graph.facebook.com/me?access_token=${facebookAccessToken.accessToken}&fields=id,name,email`);
        const result = await response.json();
        console.log("Informações do usuário do Facebook:", result);
        return { id: result.id, name: result.name, email: result.email };
      } else {
        console.log("Nenhum usuário do Facebook conectado.");
      }
    } catch (error) {
      console.error("Erro ao obter informações do usuário:", error);
    }

    console.log("Nenhum usuário conectado.");
    return null;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <FontAwesome5 name="arrow-left" size={24} color="#5359D1" />
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        <Image source={imageMap[title]} style={styles.image} />
        {isLocked && (
          <View style={styles.lockIconContainer}>
            <FontAwesome5 name="lock" size={40} color="white" />
          </View>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.price}>{price}</Text>
      <Text style={styles.description}>{description}</Text>
      {!isLocked && (
        <Text style={styles.unlockedText}>Pacote já comprado!</Text>
      )}
      {isLocked && (
        <TouchableOpacity style={styles.buyButton} onPress={purchaseProduct}>
          <Text style={styles.buyButtonText}>Comprar</Text>
        </TouchableOpacity>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {isPurchaseConfirmed && (
        <View style={styles.lottieContainer}>
          <LottieView
            source={require('../../assets/lottie/correct.json')}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
        </View>
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
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  lockIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  price: {
    fontSize: 18,
    color: '#5359D1',
    marginTop: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  unlockedText: {
    fontSize: 16,
    color: 'green',
    marginTop: 10,
  },
  backButton: {
    position: 'absolute',
    top: 70,
    left: 20,
  },
  buyButton: {
    backgroundColor: '#5359D1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  buyButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  lottieContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 10,
  },
  lottie: {
    width: 100,
    height: 100,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
});

export default PackageDetails;
