/**
 * SERVIÇO DE AUTENTICAÇÃO E RANKING COM FIREBASE (MODULAR SDK)
 * Arquivo: src/firebase.js
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Substitua com as credenciais do seu console Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBm3k0mKjPprdUtHiAEQWuj20FnFijqvF8",
  authDomain: "magman-sicron9.firebaseapp.com",
  projectId: "magman-sicron9",
  storageBucket: "magman-sicron9.firebasestorage.app",
  messagingSenderId: "19239345538",
  appId: "1:19239345538:web:8b6453eac7acdd7879439b"
};

const isConfigured = firebaseConfig.apiKey !== "SUA_API_KEY_AQUI";

let app = null;
let auth = null;
let db = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn("Erro ao iniciar Firebase SDK:", err);
  }
}

export const DatabaseService = {
  currentUser: null,

  async register(email, password) {
    if (!auth || !db) {
      this.currentUser = { uid: "local-pilot", email };
      return { data: { user: this.currentUser }, error: null };
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      
      const username = email.split('@')[0];
      await setDoc(doc(db, "profiles", this.currentUser.uid), {
        username: username,
        score: 0,
        updatedAt: new Date().toISOString()
      });

      return { data: { user: this.currentUser }, error: null };
    } catch (err) {
      console.warn("Falha no registo Firebase:", err.message);
      return { data: null, error: err };
    }
  },

  async login(email, password) {
    if (!auth || !db) {
      this.currentUser = { uid: "local-pilot", email };
      return { data: { user: this.currentUser }, error: null };
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      return { data: { user: this.currentUser }, error: null };
    } catch (err) {
      console.warn("Falha no login Firebase:", err.message);
      return { data: null, error: err };
    }
  },

  async submitScore(scoreIncrement) {
    if (!db || !this.currentUser || this.currentUser.uid === "local-pilot") return;
    try {
      const profileRef = doc(db, "profiles", this.currentUser.uid);
      const snap = await getDoc(profileRef);
      const currentScore = snap.exists() ? (snap.data().score || 0) : 0;
      
      await updateDoc(profileRef, {
        score: currentScore + scoreIncrement,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Falha ao salvar pontuação no Firestore:", err.message);
    }
  },

  async getLeaderboard(limitCount = 10) {
    const fallback = [
      { username: "Comandante_Orion", score: 22400 },
      { username: "Astronauta_Sicron", score: 14800 },
      { username: "Magneto_Pilot", score: 8750 },
      { username: "Nova_Miner", score: 5100 }
    ];

    if (!db) return fallback;

    try {
      const q = query(collection(db, "profiles"), orderBy("score", "desc"), limit(limitCount));
      const querySnapshot = await getDocs(q);
      const scores = [];
      querySnapshot.forEach(docSnap => {
        scores.push(docSnap.data());
      });
      return scores.length > 0 ? scores : fallback;
    } catch (err) {
      console.warn("Falha ao consultar ranking do Firestore:", err.message);
      return fallback;
    }
  }
};