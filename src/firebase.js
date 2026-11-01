/**
 * SERVIÇO DE AUTENTICAÇÃO E RANKING COM FIREBASE
 * Arquivo: src/firebase.js
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut
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

// Configuração oficial do seu projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBm3k0mKjPprdUtHiAEQWuj20FnFijqvF8",
  authDomain: "magman-sicron9.firebaseapp.com",
  projectId: "magman-sicron9",
  storageBucket: "magman-sicron9.firebasestorage.app",
  messagingSenderId: "19239345538",
  appId: "1:19239345538:web:8b6453eac7acdd7879439b"
};

let app = null;
let auth = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (err) {
  console.warn("Falha ao inicializar Firebase SDK:", err.message);
}

export const DatabaseService = {
  currentUser: null,
  profile: { username: "Piloto", conqueredPlanets: 0 },

  async setPersistenceMode(remember) {
    if (!auth) return;
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    } catch (e) {
      console.warn("Erro ao definir modo de persistência:", e.message);
    }
  },

  async register(email, password, remember) {
    if (!auth || !db) {
      this.currentUser = { uid: "pilot_" + Date.now(), email };
      this.profile = { username: email.split('@')[0], conqueredPlanets: 0 };
      return { data: { user: this.currentUser }, error: null };
    }
    try {
      await this.setPersistenceMode(remember);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;
      
      const username = email.split('@')[0];
      this.profile = { username, conqueredPlanets: 0 };

      await setDoc(doc(db, "profiles", this.currentUser.uid), {
        username: username,
        conqueredPlanets: 0,
        updatedAt: new Date().toISOString()
      });

      return { data: { user: this.currentUser }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async login(email, password, remember) {
    if (!auth || !db) {
      this.currentUser = { uid: "pilot_" + Date.now(), email };
      this.profile = { username: email.split('@')[0], conqueredPlanets: 0 };
      return { data: { user: this.currentUser }, error: null };
    }
    try {
      await this.setPersistenceMode(remember);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.currentUser = userCredential.user;

      const profileRef = doc(db, "profiles", this.currentUser.uid);
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        this.profile = snap.data();
      } else {
        this.profile = { username: email.split('@')[0], conqueredPlanets: 0 };
      }

      return { data: { user: this.currentUser }, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  async logout() {
    this.currentUser = null;
    this.profile = { username: "Piloto", conqueredPlanets: 0 };
    if (auth) {
      await signOut(auth);
    }
  },

  async addPlanetConquered() {
    this.profile.conqueredPlanets = (this.profile.conqueredPlanets || 0) + 1;
    if (!db || !this.currentUser || this.currentUser.uid.startsWith("pilot_")) return;

    try {
      const profileRef = doc(db, "profiles", this.currentUser.uid);
      await updateDoc(profileRef, {
        conqueredPlanets: this.profile.conqueredPlanets,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Falha ao atualizar progresso no Firestore:", err.message);
    }
  },

  async getLeaderboard(limitCount = 10) {
    const fallback = [
      { username: "Comandante_Orion", conqueredPlanets: 48 },
      { username: "Astronauta_Sicron", conqueredPlanets: 32 },
      { username: "Magneto_Pilot", conqueredPlanets: 19 },
      { username: "Nova_Miner", conqueredPlanets: 7 }
    ];

    if (!db) return fallback;

    try {
      const q = query(collection(db, "profiles"), orderBy("conqueredPlanets", "desc"), limit(limitCount));
      const querySnapshot = await getDocs(q);
      const scores = [];
      querySnapshot.forEach(docSnap => scores.push(docSnap.data()));
      return scores.length > 0 ? scores : fallback;
    } catch (err) {
      console.warn("Falha ao buscar leaderboard do Firestore:", err.message);
      return fallback;
    }
  }
};