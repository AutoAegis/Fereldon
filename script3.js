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
        <a href="#" id="logout-btn" class="logout">Logout</a>
      `;

      document.getElementById("logout-btn").onclick = () => {
        auth.signOut().then(() => {
          window.location.href = "index.html"; 
        });
      };
    });

  } else {
    userBox.innerHTML = `
      <a href="login.html" class="login">Login</a>
      <a href="register.html" class="register">Register</a>
    `;
  }
}

auth.onAuthStateChanged(user => {
  updateUserBox(user);
});

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

      auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
          db.collection("users").doc(userCredential.user.uid).set({
            username,
            email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }).then(() => {
            alert("Account created successfully!");
            window.location.href = "forum.html";
          });
        })
        .catch(err => alert(err.message));
    });
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
    });
  });
}

const resetForm = document.getElementById('reset-form');
if (resetForm) {
  resetForm.addEventListener('submit', e => {
    e.preventDefault();

    const username = document.getElementById("reset-username").value.trim();
    if (!username) return alert("Enter your username!");

    db.collection("users").where("username", "==", username).get()
      .then(snapshot => {
        if (snapshot.empty) return alert("Username not found!");

        const email = snapshot.docs[0].data().email;

        auth.sendPasswordResetEmail(email)
          .then(() => alert("Password reset email sent to: " + email))
          .catch(err => alert(err.message));
      })
      .catch(err => console.error(err));
  });
}

if (document.getElementById("forum-panel")) {
  auth.onAuthStateChanged(user => {
    if (!user) {
      alert("You must be logged in to access the forum!");
      window.location.href = "login.html";
    } else {
      loadTopics();
    }
  });
}

function createTopic() {
  const title = document.getElementById('new-topic').value.trim();
  const comment = document.getElementById('new-comment').value.trim();
  if (!title || !comment) return alert("Fill both fields!");

  const userId = auth.currentUser.uid;
  const now = new Date();

  db.collection("users").doc(userId).get().then(doc => {
    const username = doc.data().username;

    db.collection("topics")
      .where("authorId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get()
      .then(snapshot => {
        if (!snapshot.empty) {
          const last = snapshot.docs[0].data().createdAt.toDate();
          if (now - last < 86400000)
            return alert("You can only create 1 topic per 24 hours!");
        }

        db.collection("topics").add({
          title,
          author: username,
          authorId: userId,
          comments: [{
            user: username,
            userId,
            text: comment,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          }],
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          document.getElementById('new-topic').value = '';
          document.getElementById('new-comment').value = '';
          loadTopics();
        });
      });
  });
}

function loadTopics() {
  const container = document.getElementById('topics');
  if (!container) return;

  container.innerHTML = '';

  db.collection("topics").orderBy("createdAt", "desc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement('div');
      div.className = 'topic';
      div.innerHTML = `<strong>${data.title}</strong> (${data.comments.length} comments)`;
      div.onclick = () => openTopic(doc.id, data.title, data.comments);
      container.appendChild(div);
    });
  });
}

let currentTopicId = null;

function openTopic(id, title, comments) {
  currentTopicId = id;

  document.getElementById('forum-panel').style.display = "none";
  document.getElementById('topic-detail-panel').style.display = "block";

  document.getElementById('topic-title').innerText = title;

  const commentsDiv = document.getElementById('comments');
  commentsDiv.innerHTML = '';

  comments.forEach(c => {
    const el = document.createElement('div');
    el.className = "comment";
    el.innerHTML = `<strong>${c.user}:</strong> ${c.text}`;
    commentsDiv.appendChild(el);
  });
}

function addComment() {
  const text = document.getElementById('comment-input').value.trim();
  if (!text) return alert("Write something!");

  const topicRef = db.collection("topics").doc(currentTopicId);
  const userId = auth.currentUser.uid;

  db.collection("users").doc(userId).get().then(doc => {
    const username = doc.data().username;
    const now = new Date();

    topicRef.get().then(doc => {
      if (!doc.exists) return alert("Topic not found!");

      const data = doc.data();
      const comments = data.comments || [];

      const sameUser = comments.filter(c => c.userId === userId);
      if (sameUser.length) {
        const lastTime = sameUser[sameUser.length - 1].timestamp.toDate();
        if (now - lastTime < 86400000)
          return alert("You can only comment once per 24 hours!");
      }

      comments.push({
        user: username,
        userId,
        text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      topicRef.update({ comments }).then(() => {
        document.getElementById('comment-input').value = '';
        openTopic(currentTopicId, data.title, comments);
      });
    });
  });
}

function backToForum() {
  document.getElementById('forum-panel').style.display = "block";
  document.getElementById('topic-detail-panel').style.display = "none";
  loadTopics();
}
