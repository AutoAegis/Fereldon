const auth = firebase.auth();
const db = firebase.firestore();

const ADMIN_USERNAMES = ["autoaegis"];
let currentTopicId = null;

function updateUserBox(user) {
  const userBox = document.getElementById("user-box");
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
      loadTopics();
    }).catch(() => {
      userBox.innerHTML = `<a href="login.html">Login</a><a href="register.html">Register</a>`;
    });
  } else {
    userBox.innerHTML = `<a href="login.html">Login</a><a href="register.html">Register</a>`;
    document.getElementById("forum-panel").style.display = "none";
    document.getElementById("topic-detail-panel").style.display = "none";
  }
}

auth.onAuthStateChanged(user => updateUserBox(user));

function createTopic() {
  const title = document.getElementById("new-topic").value.trim();
  const comment = document.getElementById("new-comment").value.trim();
  if (!title || !comment) return alert("Fill both fields!");

  const user = auth.currentUser;
  if (!user) return alert("You must be logged in!");

  db.collection("users").doc(user.uid).get().then(doc => {
    const username = doc.data().username;
    const now = new Date();

    db.collection("topics")
      .where("authorId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get()
      .then(snapshot => {
        const lastTopicTime = snapshot.empty ? 0 : snapshot.docs[0].data().createdAt.toDate();
        const isAdmin = ADMIN_USERNAMES.includes(username);
        if (!isAdmin && now - lastTopicTime < 86400000)
          return alert("You can only create 1 topic per 24 hours!");

        db.collection("topics").add({
          title,
          author: username,
          authorId: user.uid,
          comments: [{
            user: username,
            userId: user.uid,
            text: comment,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          }],
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          document.getElementById("new-topic").value = "";
          document.getElementById("new-comment").value = "";
          loadTopics();
        });
      });
  });
}

function loadTopics() {
  const container = document.getElementById("topics");
  if (!container) return;

  container.innerHTML = "";

  db.collection("topics").orderBy("createdAt", "desc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "topic";
      div.innerHTML = `<strong>${data.title}</strong> (${data.comments.length} comments)`;
      div.onclick = () => openTopic(doc.id, data.title, data.comments);
      if (auth.currentUser && ADMIN_USERNAMES.includes(data.author)) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.style.marginLeft = "10px";
        delBtn.onclick = e => {
          e.stopPropagation();
          if (confirm("Delete this topic?")) {
            db.collection("topics").doc(doc.id).delete().then(loadTopics);
          }
        };
        div.appendChild(delBtn);
      }
      container.appendChild(div);
    });
  });
}

function openTopic(id, title, comments) {
  currentTopicId = id;
  document.getElementById("forum-panel").style.display = "none";
  document.getElementById("topic-detail-panel").style.display = "block";
  document.getElementById("topic-title").innerText = title;

  const commentsDiv = document.getElementById("comments");
  commentsDiv.innerHTML = "";

  comments.forEach(c => {
    const el = document.createElement("div");
    el.className = "comment";
    el.innerHTML = `<strong>${c.user}:</strong> ${c.text}`;
    if (auth.currentUser && ADMIN_USERNAMES.includes(c.user)) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.style.marginLeft = "8px";
      delBtn.onclick = e => {
        e.stopPropagation();
        if (confirm("Delete this comment?")) {
          const topicRef = db.collection("topics").doc(currentTopicId);
          const newComments = comments.filter(comment => comment !== c);
          topicRef.update({ comments: newComments }).then(() => openTopic(currentTopicId, title, newComments));
        }
      };
      el.appendChild(delBtn);
    }
    commentsDiv.appendChild(el);
  });
}

function addComment() {
  const text = document.getElementById("comment-input").value.trim();
  if (!text) return alert("Write something!");
  const user = auth.currentUser;
  if (!user) return alert("You must be logged in!");

  const topicRef = db.collection("topics").doc(currentTopicId);
  db.collection("users").doc(user.uid).get().then(doc => {
    const username = doc.data().username;
    const now = new Date();
    topicRef.get().then(topicDoc => {
      if (!topicDoc.exists) return alert("Topic not found!");
      const data = topicDoc.data();
      const comments = data.comments || [];
      const lastComment = comments.filter(c => c.userId === user.uid).slice(-1)[0];
      const isAdmin = ADMIN_USERNAMES.includes(username);
      if (!isAdmin && lastComment && now - lastComment.timestamp.toDate() < 86400000)
        return alert("You can only comment once per 24 hours!");
      comments.push({ user: username, userId: user.uid, text, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
      topicRef.update({ comments }).then(() => {
        document.getElementById("comment-input").value = "";
        openTopic(currentTopicId, data.title, comments);
      });
    });
  });
}

function backToForum() {
  document.getElementById("forum-panel").style.display = "block";
  document.getElementById("topic-detail-panel").style.display = "none";
  loadTopics();
}
