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
  const box = document.getElementById("user-box");
  if (!box) return;

  if (!user) {
    box.innerHTML = `<a href="login.html">Login</a><a href="register.html">Register</a>`;
    return;
  }

  db.collection("users").doc(user.uid).get().then(doc => {
    const u = doc.data();
    box.innerHTML = `
      <span id="welcome">Welcome, ${u.username}</span>
      <a href="#" id="logout-btn">Logout</a>
    `;
    document.getElementById("logout-btn").onclick = () => {
      auth.signOut().then(() => (window.location.href = "index.html"));
    };
  });
}

auth.onAuthStateChanged(updateUserBox);

const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", e => {
    e.preventDefault();

    const email = document.getElementById("register-email").value.trim();
    const username = document.getElementById("register-username").value.trim().toLowerCase();
    const password = document.getElementById("register-password").value.trim();

    if (!email || !username || !password) return alert("Fill all fields!");

    db.collection("usernames").doc(username).get().then(nameDoc => {
      if (nameDoc.exists) return alert("Username already taken!");

      auth.createUserWithEmailAndPassword(email, password)
        .then(cred => {
          const uid = cred.user.uid;

          const userProfile = db.collection("users").doc(uid);
          const usernameRef = db.collection("usernames").doc(username);

          return Promise.all([
            userProfile.set({
              email,
              username,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }),
            usernameRef.set({ uid })
          ]);
        })
        .then(() => {
          alert("Account created!");
          window.location.href = "forum.html";
        })
        .catch(err => alert(err.message));
    });
  });
}

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", e => {
    e.preventDefault();

    const username = document.getElementById("login-username").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value.trim();

    if (!username || !password) return alert("Fill all fields!");

    db.collection("usernames").doc(username).get().then(nameDoc => {
      if (!nameDoc.exists) return alert("Username not found!");

      const uid = nameDoc.data().uid;

      db.collection("users").doc(uid).get().then(userDoc => {
        const email = userDoc.data().email;

        auth.signInWithEmailAndPassword(email, password)
          .then(() => (window.location.href = "forum.html"))
          .catch(err => alert(err.message));
      });
    });
  });
}

const resetForm = document.getElementById("reset-form");
if (resetForm) {
  resetForm.addEventListener("submit", e => {
    e.preventDefault();

    const username = document.getElementById("reset-username").value.trim().toLowerCase();
    if (!username) return alert("Enter your username!");

    db.collection("usernames").doc(username).get().then(nameDoc => {
      if (!nameDoc.exists) return alert("Username not found!");

      const uid = nameDoc.data().uid;

      db.collection("users").doc(uid).get().then(userDoc => {
        const email = userDoc.data().email;

        auth.sendPasswordResetEmail(email)
          .then(() => alert("Password reset sent to: " + email))
          .catch(err => alert(err.message));
      });
    });
  });
}
