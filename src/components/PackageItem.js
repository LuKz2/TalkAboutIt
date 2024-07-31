import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons'; // Corrigido import
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AccessToken } from 'react-native-fbsdk-next';

const PackageItem = ({ packageData, onPress }) => {
  const { title, image, price, description } = packageData;
  const [isLocked, setIsLocked] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const googleUserInfo = await GoogleSignin.getCurrentUser();
        const facebookAccessToken = await AccessToken.getCurrentAccessToken();

        if (googleUserInfo) {
          setUserInfo({ id: googleUserInfo.user.id, name: googleUserInfo.user.name, email: googleUserInfo.user.email });
        } else if (facebookAccessToken) {
          const response = await fetch(`https://graph.facebook.com/me?access_token=${facebookAccessToken.accessToken}&fields=id,name,email`);
          const result = await response.json();
          setUserInfo({ id: result.id, name: result.name, email: result.email });
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
      }
    };

    const checkIfPackagePurchased = async () => {
      try {
        if (userInfo) {
          const userRef = doc(db, 'users', userInfo.id);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const purchasedPackages = userSnap.data().purchasedPackages || [];
            if (purchasedPackages.includes(title)) {
              setIsLocked(false);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar pacotes comprados:', error);
      }
    };

    checkAuthentication();
    checkIfPackagePurchased();
  }, [title, userInfo]);

  const getImage = useCallback((path) => {
    switch (path) {
      case '../../assets/pacotes/friends.jpg':
        return require('../../assets/pacotes/friends.jpg');
      case '../../assets/pacotes/rela.jpg':
        return require('../../assets/pacotes/rela.jpg');
      case '../../assets/pacotes/memorias.jpg':
        return require('../../assets/pacotes/memorias.jpg');
      case '../../assets/pacotes/sobrevoce.jpg':
        return require('../../assets/pacotes/sobrevoce.jpg');
      case '../../assets/pacotes/amigos.jpg':
        return require('../../assets/pacotes/amigos.jpg');
      case '../../assets/pacotes/18.jpg':
        return require('../../assets/pacotes/18.jpg');
      case '../../assets/pacotes/ludicas.jpg':
        return require('../../assets/pacotes/ludicas.jpg');
      case '../../assets/pacotes/politicamente.jpg':
        return require('../../assets/pacotes/politicamente.jpg');
      case '../../assets/pacotes/rir.jpg':
        return require('../../assets/pacotes/rir.jpg');
      case '../../assets/pacotes/crush.jpg':
        return require('../../assets/pacotes/crush.jpg');
      case '../../assets/pacotes/familia.jpg':
        return require('../../assets/pacotes/familia.jpg');
      default:
        return require('../../assets/pacotes/rir.jpg');
    }
  }, []);

  const handlePress = useCallback(() => {
    onPress(packageData, isLocked);
  }, [packageData, isLocked, onPress]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={handlePress}>
        <View style={styles.imageWrapper}>
          <View style={styles.imageContainer}>
            <Image source={getImage(image)} style={styles.image} />
            {isLocked ? (
              <>
                <View style={styles.lockOverlay} />
                <View style={styles.lockIconContainer}>
                  <FontAwesome5 name="lock" size={40} color="white" />
                </View>
              </>
            ) : (
              <View style={styles.checkIconContainer}>
                <FontAwesome5 name="check" size={30} color="green" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.detailsContainer}>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text style={styles.price}>{price}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
    top: 50
  },
  imageWrapper: {
    borderWidth: 5,
    borderColor: 'white',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    width: 250,
    height: 400,
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
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  checkIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  title: {
    fontSize: 25,
    color: 'black',
    textAlign: 'center',
    fontFamily: 'Accid',
    backgroundColor: 'white',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    top: 20,
    zIndex: 10
  },
  detailsContainer: {
    top: -0.5,
    padding: 10,
    alignItems: 'center',
    width: 260,
    backgroundColor: 'white',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5
  },
  description: {
    fontSize: 15,
    color: 'black',
    textAlign: 'center',
    marginBottom: 18,
    fontFamily: 'Quicksand-VariableFont_wght',
    textDecorationLine: 'underline',
  },
  price: {
    width: 70,
    fontSize: 20,
    color: 'yellow',
    textAlign: 'center',
    fontFamily: 'Accid',
    bottom: 16,
    borderRadius: 3,
    backgroundColor: 'black',
  },
});

export default PackageItem;
