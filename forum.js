const db = firebase.firestore();
const auth = firebase.auth();

const ADMIN_USERS = ["autoaegis"];
const TOPIC_COOLDOWN = 24 * 60 * 60 * 1000; 
const COMMENT_COOLDOWN = 60 * 60 * 1000;

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
    });
  } else {
    userBox.innerHTML = `<a href="login.html">Login</a><a href="register.html">Register</a>`;
  }
}

auth.onAuthStateChanged(user => updateUserBox(user));

let currentTopicId = null;

function createTopic() {
  const title = document.getElementById('new-topic').value.trim();
  const comment = document.getElementById('new-comment').value.trim();
  if (!title || !comment) return alert("Fill both fields!");

  const userId = auth.currentUser.uid;

  db.collection("users").doc(userId).get().then(doc => {
    const username = doc.data().username;

    db.collection("topics")
      .where("authorId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get()
      .then(snapshot => {
        if (!snapshot.empty) {
          const lastCreated = snapshot.docs[0].data().createdAt.toDate();
          if (Date.now() - lastCreated.getTime() < TOPIC_COOLDOWN) {
            return alert("You can only create 1 topic per 24 hours!");
          }
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
      div.style.background = ADMIN_USERS.includes(data.authorId) ? 'rgba(217, 164, 65, 0.15)' : '';
      div.innerHTML = `<strong>${data.title}</strong> (${data.comments.length} comments)`;

      if (ADMIN_USERS.includes(auth.currentUser?.uid) || data.authorId === auth.currentUser?.uid) {
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.onclick = e => {
          e.stopPropagation();
          if (confirm("Are you sure you want to delete this topic?")) {
            db.collection("topics").doc(doc.id).delete().then(loadTopics);
          }
        };
        div.appendChild(delBtn);
      }

      div.onclick = () => openTopic(doc.id, data.title, data.comments);
      container.appendChild(div);
    });
  });
}

function openTopic(id, title, comments) {
  currentTopicId = id;
  document.getElementById('forum-panel').style.display = "none";
  document.getElementById('topic-detail-panel').style.display = "block";
  document.getElementById('topic-title').innerText = title;

  const commentsDiv = document.getElementById('comments');
  commentsDiv.innerHTML = '';
  comments.forEach((c, idx) => {
    const el = document.createElement('div');
    el.className = "comment";
    el.style.background = ADMIN_USERS.includes(c.userId) ? 'rgba(217, 164, 65, 0.1)' : '';
    el.innerHTML = `<strong>${c.user}:</strong> ${c.text}`;

    if (ADMIN_USERS.includes(auth.currentUser?.uid) || c.userId === auth.currentUser?.uid) {
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.onclick = e => {
        e.stopPropagation();
        if (confirm("Delete this comment?")) {
          comments.splice(idx, 1);
          db.collection("topics").doc(id).update({ comments }).then(() => openTopic(id, title, comments));
        }
      };
      el.appendChild(delBtn);
    }

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

    topicRef.get().then(doc => {
      if (!doc.exists) return alert("Topic not found!");
      const data = doc.data();
      const comments = data.comments || [];
      const lastComment = comments.filter(c => c.userId === userId).pop();

      if (lastComment) {
        const lastTime = lastComment.timestamp.toDate();
        if (Date.now() - lastTime.getTime() < COMMENT_COOLDOWN) {
          return alert("You can only comment once per hour!");
        }
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

auth.onAuthStateChanged(user => {
  if (!user) {
    alert("You must be logged in to access the forum!");
    window.location.href = "login.html";
  } else {
    loadTopics();
  }
});
