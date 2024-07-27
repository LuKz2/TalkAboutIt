import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createSharedElementStackNavigator } from 'react-navigation-shared-element';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, LogBox } from 'react-native';
import SplashScreenComponent from './src/pages/SplashScreen';
import HomeScreen from './src/HomeScreen';
import GoogleSignin from './src/components/GoogleLoginScreen';
import Details from './src/pages/Details';
import Roleta from './src/pages/Roleta';
import PackageDetails from './src/pages/PackageDetails';
import Loja from './src/components/Loja';
import Pacotes from './src/components/Pacotes';
import Inicio from './src/components/Inicio';
import MusicProvider from './src/components/MusicProvider';
import FlashMessage from 'react-native-flash-message';
import { GoogleSignin as GoogleSigninModule } from '@react-native-google-signin/google-signin';
import { app, db } from './firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs(); // Ignore all log notifications

const Stack = createSharedElementStackNavigator();

SplashScreen.preventAutoHideAsync(); // Impede a tela de carregamento de desaparecer automaticamente

GoogleSigninModule.configure({
  webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID',
});

export default function App() {
  const [fontsLoaded] = useFonts({
    'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
    'Accid': require('./assets/fonts/accid___.ttf'),
    'Boris': require('./assets/fonts/BorisBlackBloxx.ttf'),
    'Quicksand-VariableFont_wght': require('./assets/fonts/Quicksand-VariableFont_wght.ttf'),
  });

  const [routeName, setRouteName] = useState('Splash');
  const [appIsReady, setAppIsReady] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  const onStateChange = (state) => {
    const currentRouteName = state.routes[state.index].name;
    setRouteName(currentRouteName);
  };

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
      }

      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [appState]);

  useEffect(() => {
    async function prepare() {
      try {
        // Realizar o logout de qualquer rede social ao iniciar o aplicativo
        await logoutAll();

        // Verificar conexão com Firestore sem fazer logout
        await verifyFirestoreConnection();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        SplashScreen.hideAsync(); // Esconde a tela de carregamento quando os recursos estiverem prontos
      }
    }

    prepare();
  }, []);

  const logoutAll = async () => {
    try {
      // Logout do Google
      const isGoogleSignedIn = await GoogleSigninModule.isSignedIn();
      if (isGoogleSignedIn) {
        await GoogleSigninModule.revokeAccess();
        await GoogleSigninModule.signOut();
      }

      // Logout do Facebook
      const facebookAccessToken = await AccessToken.getCurrentAccessToken();
      if (facebookAccessToken) {
        await LoginManager.logOut();
      }

      // Atualize o estado de login salvo
      await AsyncStorage.setItem('facebookLoggedIn', 'false');
      await AsyncStorage.removeItem('facebookUser');

      console.log('Successfully logged out from all accounts.');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const verifyFirestoreConnection = async () => {
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        console.log("Conexão com o Firestore verificada com sucesso. Número de documentos na coleção 'users':", querySnapshot.size);
        if (querySnapshot.empty) {
          console.log("Nenhum documento encontrado na coleção 'users'.");
        } else {
          querySnapshot.forEach((doc) => {
            console.log(`Documento encontrado: ${doc.id} => ${JSON.stringify(doc.data())}`);
          });
        }
        break;
      } catch (error) {
        attempt++;
        if (attempt >= maxAttempts) {
          console.error("Erro ao verificar a conexão com o Firestore após várias tentativas:", error);
        } else {
          console.warn(`Tentativa ${attempt} de ${maxAttempts} falhou. Tentando novamente...`);
        }
      }
    }
  };

  if (!fontsLoaded || !appIsReady) {
    return null; // Retorna null até que o aplicativo esteja pronto
  }

  return (
    <NavigationContainer onStateChange={onStateChange}>
      <MusicProvider routeName={routeName}>
        <Stack.Navigator initialRouteName='Splash' screenOptions={{ headerShown: false }}>
          <Stack.Screen name='Splash' component={SplashScreenComponent} />
          <Stack.Screen name='Home' component={HomeScreen} />
          <Stack.Screen name='GoogleLogin' component={GoogleSignin} />
          <Stack.Screen name='Detalhes' component={Details} />
          <Stack.Screen 
            name='PackageDetails' 
            component={PackageDetails} 
            sharedElements={(route) => {
              const { packageData } = route.params;
              return [`item.${packageData.id}.photo`];
            }} 
          />
          <Stack.Screen name='Loja' component={Loja} />
          <Stack.Screen name='Inicio' component={Inicio} />
          <Stack.Screen name='Pacotes' component={Pacotes} />
          <Stack.Screen name='Roleta' component={Roleta} />
        </Stack.Navigator>
        <FlashMessage position="top" floating={true} />
      </MusicProvider>
    </NavigationContainer>
  );
}
