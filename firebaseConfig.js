import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC6pGgzmk9u0TY23nqAxJUQIuRCtQao5M8",
  authDomain: "talk-about-it-789ff.firebaseapp.com",
  projectId: "talk-about-it-789ff",
  storageBucket: "talk-about-it-789ff.appspot.com",
  messagingSenderId: "452838433159",
  appId: "1:452838433159:android:d74ea598ac6df4fd6bf322",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { app, db };