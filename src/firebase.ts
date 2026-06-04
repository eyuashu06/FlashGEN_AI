import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize the Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth according to the system skill requirements
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Critical connection verification function as requested by the Firebase skill rules
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("[Firebase] Handshake complete and connection validated.");
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("[Firebase] Warning: Please check your network connection. Firestore appears offline.");
    }
  }
}

testConnection();
