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

window.userRole = null;

function updateUserBox(user) {
  const userBox = document.getElementById('user-box');
  if (!userBox) return;

  if (user) {
    db.collection("users").doc(user.uid).get().then(doc => {
      const data = doc.exists ? doc.data() : {};
      const username = data.username || "User";
      const role = data.role || "member";
      window.userRole = role;

      const glow = role === "admin" ? "admin-glow" :
                   role === "tester" ? "tester-glow" : "";

      userBox.innerHTML = `
        <span id="welcome" class="${glow}">Welcome, ${username}</span>
        <a href="#" id="logout-btn">Logout</a>
      `;
      document.getElementById("logout-btn").onclick = () => {
        auth.signOut().then(() => window.location.href = "index.html");
      };
    }).catch(() => {
      window.userRole = null;
      userBox.innerHTML = `<a href="login.html">Login</a><a href="register.html">Register</a>`;
    });
  } else {
    window.userRole = null;
    userBox.innerHTML = `<a href="login.html">Login</a><a href="register.html">Register</a>`;
  }
}

auth.onAuthStateChanged(async user => {
  updateUserBox(user);

  if (!user) return;

  const path = window.location.pathname.split("/").pop();
  const onBannedPage = path === "banned.html" || path === "banned-ip.html";

  try {
    const banDoc = await db.collection("banned").doc(user.uid).get();
    if (banDoc.exists) {
      if (!onBannedPage) {
        window.location.href = `banned.html?uid=${encodeURIComponent(user.uid)}`;
      }
      return;
    }
  } catch (err) {
    console.error("Ban-check failed:", err);
  }

});

const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value.trim();

    const acceptTOSEl = document.getElementById('accept-tos');
    const acceptPrivacyEl = document.getElementById('accept-privacy');
    if (acceptTOSEl && !acceptTOSEl.checked) return alert("You must accept the Terms of Service.");
    if (acceptPrivacyEl && !acceptPrivacyEl.checked) return alert("You must accept the Data Privacy Policy.");

    if (!email || !username || !password) return alert("Fill all fields!");

    db.collection("usernames").doc(username).get().then(doc => {
      if (doc.exists) return alert("Username already taken!");

      auth.createUserWithEmailAndPassword(email, password).then(cred => {
        db.collection("users").doc(cred.user.uid).set({
          username,
          email,
          role: "member",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          db.collection("usernames").doc(username).set({
            uid: cred.user.uid
          }).then(() => {
            alert("Account created successfully!");
            window.location.href = "forum.html";
          }).catch(err => alert("Failed to save username mapping: " + err.message));
        }).catch(err => alert("Failed to save user data: " + err.message));
      }).catch(err => alert("Failed to create account: " + err.message));
    }).catch(err => alert("Failed to check username: " + err.message));
  });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (!username || !password) return alert("Fill both fields!");

    db.collection("usernames").doc(username).get().then(doc => {
      if (!doc.exists) return alert("Username not found!");
      const uid = doc.data().uid;

      db.collection("users").doc(uid).get().then(userDoc => {
        if (!userDoc.exists) return alert("User data not found!");
        const email = userDoc.data().email;

        auth.signInWithEmailAndPassword(email, password)
          .then(async () => {
            const banDoc = await db.collection("banned").doc(uid).get();
            if (banDoc.exists) {
              window.location.href = `banned.html?uid=${encodeURIComponent(uid)}`;
            } else {
              window.location.href = "forum.html";
            }
          })
          .catch(err => alert("Login failed: " + err.message));
      }).catch(err => alert("Failed to fetch user data: " + err.message));
    }).catch(err => alert("Failed to fetch username: " + err.message));
  });
}

const resetForm = document.getElementById('reset-form');
if (resetForm) {
  resetForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById("reset-username").value.trim();
    if (!username) return alert("Enter your username!");
    db.collection("usernames").doc(username).get().then(doc => {
      if (!doc.exists) return alert("Username not found!");
      const uid = doc.data().uid;
      db.collection("users").doc(uid).get().then(userDoc => {
        if (!userDoc.exists) return alert("User data not found!");
        const email = userDoc.data().email;
        auth.sendPasswordResetEmail(email)
          .then(() => alert("Password reset email sent to: " + email))
          .catch(err => alert("Failed to send reset email: " + err.message));
      }).catch(err => alert("Failed to fetch user data: " + err.message));
    }).catch(err => alert("Failed to fetch username: " + err.message));
  });
}
