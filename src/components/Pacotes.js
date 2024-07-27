import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, TextInput, Animated, KeyboardAvoidingView, PixelRatio } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AccessToken } from 'react-native-fbsdk-next';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '../../firebaseConfig';

const { width, height } = Dimensions.get('window');
const db = getFirestore(app);

const Biblioteca = () => {
  const [purchasedPackages, setPurchasedPackages] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const freePackage = 'Pacote Grátis';
  const [userInfo, setUserInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const navigation = useNavigation();

  const searchBarAnim = useRef(new Animated.Value(0)).current;
  const packagesAnim = useRef(new Animated.Value(0)).current;
  const selectAllAnim = useRef(new Animated.Value(0)).current;

  const allPackages = [
    "Reflexão", "Relacionamentos", "Memórias", "Sobre Você", "Sobre Grupo",
    "Apimentadas", "Lúdicas", "Politicamente incorretas", "Para fazer rir", "Crush","Família", freePackage
  ];

  useEffect(() => {
    const fetchUserInfo = async () => {
      const info = await getUserInfo();
      console.log("User Info:", info);
      setUserInfo(info);

      if (info) {
        await fetchPurchasedPackages(info.id);
        await loadCheckedItems(info.id);
      }
      setLoading(false);
    };

    fetchUserInfo();
  }, []);

  useEffect(() => {
    Animated.timing(searchBarAnim, {
      toValue: searchVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    Animated.timing(selectAllAnim, {
      toValue: searchVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [searchVisible]);

  useEffect(() => {
    // Adicionando animação de opacidade ao carregar a tela
    Animated.timing(packagesAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const getUserInfo = async () => {
    const googleUserInfo = await GoogleSignin.getCurrentUser();
    console.log("Google User Info:", googleUserInfo);
    if (googleUserInfo) {
      return { id: googleUserInfo.user.id, name: googleUserInfo.user.name };
    }
  
    const facebookAccessToken = await AccessToken.getCurrentAccessToken();
    console.log("Facebook Access Token:", facebookAccessToken);
    if (facebookAccessToken) {
      return { id: facebookAccessToken.userID, name: '' };
    }
  
    console.log("Nenhum usuário conectado");
    return null;
  };
  

  const fetchPurchasedPackages = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
  
      let packages = [];
      if (userDoc.exists()) {
        packages = userDoc.data().purchasedPackages || [];
      }
      if (!packages.includes(freePackage)) {
        packages.push(freePackage);
      }
      setPurchasedPackages(packages);
      console.log("Pacotes comprados:", packages);
    } catch (error) {
      console.error('Erro ao buscar pacotes comprados:', error);
    }
  };
  

  const toggleCheckmark = async (packageName) => {
    if (!purchasedPackages.includes(packageName)) return;

    setCheckedItems((prevCheckedItems) => {
      const newCheckedItems = { ...prevCheckedItems, [packageName]: !prevCheckedItems[packageName] };

      saveCheckedItems(newCheckedItems);
      loadQuestionsForSelectedPackages(newCheckedItems);

      return newCheckedItems;
    });
  };

  const saveCheckedItems = async (items) => {
    try {
      if (userInfo) {
        const userDocRef = doc(db, "users", userInfo.id);
        await setDoc(userDocRef, { checkedItems: items }, { merge: true });
      }
    } catch (error) {
      console.error('Erro ao salvar itens selecionados:', error);
    }
  };

  const loadCheckedItems = async (userId) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
  
      let items = {};
      if (userDoc.exists()) {
        items = userDoc.data().checkedItems || {};
      }
  
      // Verifica se é a primeira vez que o usuário está acessando o app
      if (Object.keys(items).length === 0) {
        items[freePackage] = true; // Marca o pacote grátis como selecionado
        await saveCheckedItems(items); // Salva os itens atualizados no Firestore
      }
  
      setCheckedItems(items);
      loadQuestionsForSelectedPackages(items);
    } catch (error) {
      console.error('Erro ao carregar itens selecionados:', error);
    }
  };
  
  


  const loadQuestionsForSelectedPackages = async (checkedItems) => {
    try {
      let allQuestions = [];
      for (let packageName in checkedItems) {
        if (checkedItems[packageName]) {
          let packageData;
          if (packageName === freePackage) {
            packageData = require('../json/perguntas_free.json')["freeQuestions"];
          } else {
            switch (packageName) {
              case "Reflexão":
                packageData = require('../json/package/Reflexao/reflexao1.json')["Reflexao 1"];
                break;
              case "Relacionamentos":
                packageData = require('../json/package/Relacionamentos/relacionamento.json')["Relacionamentos 1"];
                break;
              case "Apimentadas":
                packageData = require('../json/package/Apimentadas/apimentadas1.json')["Apimentadas 1"];
                break;
              case "Sobre Grupo":
                packageData = require('../json/package/Sobre_grupo/sobre_grupo1.json')["Sobre_grupo1"];
                break;
              case "Sobre Você":
                packageData = require('../json/package/Sobre_voce/sobre_voce1.json')["Sobre você 1"];
                break;
              case "Lúdicas":
                packageData = require('../json/package/Ludicas/Ludicas1.json')["Lúdicas"];
                break;
              case "Memórias":
                packageData = require('../json/package/Memorias/Memorias.json')["Memórias"];
                break;
              case "Politicamente incorretas":
                packageData = require('../json/package/Politicamente_incorretas/politicamente_incorreta1.json')["Politicamente incorretas 1"];
                break;
              case "ParaRir":
                packageData = require('../json/package/Rir/pararir1.json')["ParaRir"];
                break;
                case "Crush":
                  packageData = require('../json/package/Crush/crush.json')["crush"];
                  break;
                  case "Família":
                    packageData = require('../json/package/Familia/fam.json')["Família 1"];
                    break;
              default:
                console.error('Pacote não encontrado:', packageName);
                continue;
            }
          }
          allQuestions = allQuestions.concat(packageData);
        }
      }
      setQuestions(allQuestions);
      console.log('Dados de perguntas:', allQuestions);
    } catch (error) {
      console.error('Erro ao carregar perguntas dos pacotes:', error);
    }
  };

  const selectAllPackages = () => {
    const newCheckedItems = purchasedPackages.reduce((acc, packageName) => {
      acc[packageName] = true;
      return acc;
    }, {});

    setCheckedItems(newCheckedItems);
    saveCheckedItems(newCheckedItems);
    loadQuestionsForSelectedPackages(newCheckedItems);
  };

  const renderPackageItem = (item) => {
    const isPurchased = purchasedPackages.includes(item);
    const isFreePackage = item === freePackage;
  
    return (
      <TouchableOpacity
        style={styles.packageItem}
        key={item}
        onPress={() => toggleCheckmark(item)}
        disabled={!isPurchased && !isFreePackage} // Desabilitar pacotes não comprados
      >
        <Image source={imageMap[item]} style={styles.packageImage} />
        {!isPurchased && !isFreePackage && (
          <View style={styles.lockOverlay}>
            <FontAwesome name="lock" size={22} color="white" />
          </View>
        )}
        {checkedItems[item] && (
          <View style={styles.checkmarkOverlay}>
            <FontAwesome name="check" size={22} color="white" />
          </View>
        )}
        <Text style={styles.packageTitle}>{item}</Text>
      </TouchableOpacity>
    );
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
    "Pacote Grátis": require('../../assets/back.jpg'),

  };

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const filteredPackages = allPackages.filter(packageName =>
    packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!searchVisible) {
      setSearchQuery(''); // Limpa a barra de pesquisa quando ela é fechada
    }
  }, [searchVisible]);

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    setIsSearchActive(!isSearchActive);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={toggleSearch}>
          <FontAwesome name={isSearchActive ? "times" : "search"} size={32} color="black" />
        </TouchableOpacity>
      </View>
      <Animated.View style={[styles.searchContainer, { height: searchBarAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) }]}>
        <FontAwesome name="search" size={16} color="black" />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar pacotes..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <FontAwesome name="times-circle" size={20} color="black" style={styles.clearIcon} />
          </TouchableOpacity>
        )}
      </Animated.View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : (
          <Animated.View style={[styles.gridContainer, { opacity: packagesAnim }]}>
            {filteredPackages
              .filter(packageName => purchasedPackages.includes(packageName))
              .map(renderPackageItem)}
            {filteredPackages
              .filter(packageName => !purchasedPackages.includes(packageName))
              .map(renderPackageItem)}
          </Animated.View>
        )}
      </ScrollView>
      <Animated.View style={[styles.buttonContainer, { transform: [{ translateY: selectAllAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }] }]}>
        <TouchableOpacity style={styles.actionButton} onPress={selectAllPackages}>
          <Text style={styles.actionButtonText}>Selecionar Todos</Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30, // Ajuste esse valor para aumentar ou diminuir a distância do topo
  },
  headerContainer: {
    padding: 1,
    bottom: 50,
    left: height * 0.4,
    bottom: height * 0.04,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'Quicksand-VariableFont_wght',
  },
  searchContainer: {
    backgroundColor: '#f8f4f4',
    borderRadius: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 10,
    marginHorizontal: 16,
    marginBottom: -40,
    flexDirection: 'row',
    alignItems: 'center',
    bottom: height * 0.025,
  },
  searchInput: {
    marginLeft: 5,
    fontSize: 16,
    width: width * 0.7,
    fontFamily: 'Quicksand-VariableFont_wght',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    opacity: 0, // inicial opacidade zero
  },
  packageItem: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 5,
    marginVertical: 8,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 10,
    width: PixelRatio.getPixelSizeForLayoutSize(45), // Ajuste fixo para todos os dispositivos
    height: PixelRatio.getPixelSizeForLayoutSize(50), // Ajuste fixo para todos os dispositivos
  },
  packageImage: {
    width: '100%',
    height: '70%', // Proporção de altura/largura para a imagem
    borderRadius: 8,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 20,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 5,
  },
  packageTitle: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    fontFamily: 'Accid',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
    position: 'absolute',
    bottom: height * 0.06,
    width: '100%',
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderColor: '#000',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 10,
  },
  actionButtonText: {
    fontSize: 17,
    color: 'black',
    textAlign: 'center',
    fontFamily: 'Accid',
  },
  clearIcon: {
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 200,
  },
});

export default Biblioteca;
