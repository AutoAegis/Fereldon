import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDtXW6okJbrP1pDbV_ICrdSKXhI30t5AJQ",
  authDomain: "ariselle.firebaseapp.com",
  projectId: "ariselle",
  storageBucket: "ariselle.firebasestorage.app",
  messagingSenderId: "1086998280524",
  appId: "1:1086998280524:web:094e3a0c6ece0af507b7e9",
  measurementId: "G-PHLK2R0YSE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {

  function updateUserBox(user) {
    const userBox = document.getElementById('user-box');
    if (!userBox) return;

    if (user) {
      getDoc(doc(db, "users", user.uid)).then(docSnap => {
        const username = docSnap.exists() ? docSnap.data().username : "User";
        userBox.innerHTML = `
          <span id="welcome">Welcome, ${username}</span>
          <a href="#" id="logout-btn">Logout</a>
        `;
        document.getElementById("logout-btn").onclick = () => {
          signOut(auth).then(() => window.location.href = "index.html");
        };
      }).catch(() => {
        userBox.innerHTML = `<a href="login.html">Login</a><a href="register.html">Register</a>`;
      });
    } else {
      userBox.innerHTML = `<a href="login.html">Login</a><a href="register.html">Register</a>`;
    }
  }

  onAuthStateChanged(auth, user => updateUserBox(user));

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('register-email').value.trim();
      const username = document.getElementById('register-username').value.trim();
      const password = document.getElementById('register-password').value.trim();
      if (!email || !username || !password) return alert("Fill all fields!");

      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) return alert("Username already taken!");

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          username,
          email,
          createdAt: serverTimestamp()
        });
        alert("Account created successfully!");
        window.location.href = "forum.html";
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value.trim();
      if (!username || !password) return alert("Fill both fields!");

      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return alert("Username not found!");
      const email = querySnapshot.docs[0].data().email;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "forum.html";
      } catch (err) {
        alert(err.message);
      }
    });
  }

  const resetForm = document.getElementById('reset-form');
  if (resetForm) {
    resetForm.addEventListener('submit', async e => {
      e.preventDefault();
      const username = document.getElementById("reset-username").value.trim();
      if (!username) return alert("Enter your username!");

      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return alert("Username not found!");
      const email = querySnapshot.docs[0].data().email;

      try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent to: " + email);
      } catch (err) {
        alert(err.message);
      }
    });
  }

});
