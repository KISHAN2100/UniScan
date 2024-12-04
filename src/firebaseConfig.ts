import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAUwPBOzGk3P7Pc5ZToPZ3sJ6u6weCOMCE",
  authDomain: "uniscan-aa19a.firebaseapp.com",
  projectId: "uniscan-aa19a",
  storageBucket: "uniscan-aa19a.appspot.com",
  messagingSenderId: "1079865597490",
  appId: "1:1079865597490:android:3941ad35c513f58632e62b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { auth, db }; 