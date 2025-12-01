const firebaseConfig = {
  apiKey: "AIzaSyDtXW6okJbrP1pDbV_ICrdSKXhI30t5AJQ",
  authDomain: "ariselle.firebaseapp.com",
  projectId: "ariselle",
  storageBucket: "ariselle.firebasestorage.app",
  messagingSenderId: "1086998280524",
  appId: "1:1086998280524:web:094e3a0c6ece0af507b7e9",
  measurementId: "G-PHLK2R0YSE"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

function updateUserBox(user) {
  const userBox = document.getElementById('user-box');
  if (!userBox) return;

  if (user) {
    db.collection("users").doc(user.uid).get().then(doc => {
      const username = doc.exists ? doc.data().username : "User";
      userBox.innerHTML = `
        <span id="welcome">Welcome, ${username}</span>
        <a href="#" id="logout-btn">Logout</a>
      `;
      document.getElementById("logout-btn").onclick = () => {
        auth.signOut().then(() => window.location.href = "index.html");
      };
    }).catch(() => {
      userBox.innerHTML = `<a href="login.html">Login</a><a href="register.html">Register</a>`;
    });
  } else {
    userBox.innerHTML = `<a href="login.html">Login</a><a href="register.html">Register</a>`;
  }
}

auth.onAuthStateChanged(user => updateUserBox(user));

const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value.trim();
    if (!email || !username || !password) return alert("Fill all fields!");

    db.collection("users").where("username", "==", username).get().then(snapshot => {
      if (!snapshot.empty) return alert("Username already taken!");

      auth.createUserWithEmailAndPassword(email, password).then(cred => {
        db.collection("users").doc(cred.user.uid).set({
          username,
          email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          alert("Account created successfully!");
          window.location.href = "forum.html";
        });
      }).catch(err => alert(err.message));
    }).catch(err => alert(err.message));
  });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!username || !password) return alert("Fill both fields!");

    db.collection("users").where("username", "==", username).get().then(snapshot => {
      if (snapshot.empty) return alert("Username not found!");
      const email = snapshot.docs[0].data().email;

      auth.signInWithEmailAndPassword(email, password)
        .then(() => window.location.href = "forum.html")
        .catch(err => alert(err.message));
    }).catch(err => alert(err.message));
  });
}

const resetForm = document.getElementById('reset-form');
if (resetForm) {
  resetForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById("reset-username").value.trim();
    if (!username) return alert("Enter your username!");

    db.collection("users").where("username", "==", username).get().then(snapshot => {
      if (snapshot.empty) return alert("Username not found!");
      const email = snapshot.docs[0].data().email;

      auth.sendPasswordResetEmail(email)
        .then(() => alert("Password reset email sent to: " + email))
        .catch(err => alert(err.message));
    }).catch(err => alert(err.message));
  });
}
