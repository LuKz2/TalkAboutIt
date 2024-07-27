import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Importe sua configuração do Firebase

export default function GoogleLoginScreen() {
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const navigation = useNavigation();
  const firestore = getFirestore();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '461153059381-vig1etk11bsilm4fevdmrok1odoojofs.apps.googleusercontent.com', // Substitua pelo seu webClientId
    });

    const signin = async () => {
      try {
        await GoogleSignin.hasPlayServices();
        const user = await GoogleSignin.signIn();
        setUserInfo(user);
        setError(null);
        logUserData(user);
        saveUserData(user); // Salvar dados do usuário no Firestore
        navigateToDetails();
      } catch (e) {
        console.error('Erro ao fazer login:', e);
        setError(e);
      }
    };

    signin();
  }, []);

  const logout = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      setUserInfo(null);
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
    }
  };

  const logUserData = (user) => {
    console.log('Nome:', user.user.name);
    console.log('E-mail:', user.user.email);
  };

  const saveUserData = async (user) => {
    try {
      const userDocRef = doc(collection(firestore, "users"), user.user.id);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Se o documento não existir, cria um novo documento com as informações do usuário
        await setDoc(userDocRef, {
          name: user.user.name,
          email: user.user.email,
          authProvider: 'google', // Adiciona o provedor de autenticação
          purchasedPackages: [],
        });
        console.log('Dados do usuário criados com sucesso.');
      } else {
        // Se o documento existir, apenas atualize os dados do usuário
        await updateDoc(userDocRef, {
          name: user.user.name,
          email: user.user.email,
          authProvider: 'google', // Atualiza o provedor de autenticação
        });
        console.log('Dados do usuário atualizados com sucesso.');
      }
    } catch (e) {
      console.error('Erro ao salvar dados do usuário:', e);
    }
  };

  const navigateToDetails = () => {
    navigation.navigate('Detalhes'); // Nome da tela de detalhes
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  userText: {
    color: 'green',
    fontSize: 16,
  },
});
