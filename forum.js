const forumPanel = document.getElementById("forum-panel");
const topicDetailPanel = document.getElementById("topic-detail-panel");
const topicsDiv = document.getElementById("topics");
const topicTitleEl = document.getElementById("topic-title");
const commentsDiv = document.getElementById("comments");
const commentInput = document.getElementById("comment-input");

let currentTopicId = null;
let currentUser = null;
const cooldowns = {};
const admins = ["autoaegis"];

auth.onAuthStateChanged(user => {
  currentUser = user;
  if (!user) {
    alert("You must be logged in to access the forum!");
    window.location.href = "login.html";
  } else {
    loadTopics();
  }
});

function loadTopics() {
  topicsDiv.innerHTML = "";
  db.collection("topics").orderBy("createdAt", "desc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "panel trello-card clickable";
      div.innerHTML = `
        <strong>${data.title}</strong> by ${data.username} <br>
        <small>${data.createdAt?.toDate().toLocaleString() || ""}</small>
        ${admins.includes(currentUser.displayName) || currentUser.uid === doc.id ? `<button onclick="deleteTopic('${doc.id}')">Delete</button>` : ""}
      `;
      div.onclick = () => openTopic(doc.id, data.title);
      topicsDiv.appendChild(div);
    });
  });
}

function createTopic() {
  if (!currentUser) return alert("You must be logged in!");

  const title = document.getElementById("new-topic").value.trim();
  const comment = document.getElementById("new-comment").value.trim();
  if (!title || !comment) return alert("Fill both fields!");

  const uid = currentUser.uid;
  if (!admins.includes(currentUser.displayName)) {
    const lastTime = cooldowns[uid]?.topic || 0;
    if (Date.now() - lastTime < 60000) return alert("Wait 1 minute between creating topics.");
    cooldowns[uid] = { ...cooldowns[uid], topic: Date.now() };
  }

  db.collection("users").doc(uid).get().then(userDoc => {
    const username = userDoc.data().username;
    db.collection("topics").doc().set({
      title,
      username,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(topicRef => {
      topicRef.collection("comments").doc().set({
        username,
        text: comment,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        alert("Topic created!");
        document.getElementById("new-topic").value = "";
        document.getElementById("new-comment").value = "";
        loadTopics();
      });
    });
  });
}

function openTopic(topicId, title) {
  currentTopicId = topicId;
  forumPanel.style.display = "none";
  topicDetailPanel.style.display = "block";
  topicTitleEl.textContent = title;
  loadComments();
}

function backToForum() {
  topicDetailPanel.style.display = "none";
  forumPanel.style.display = "block";
  currentTopicId = null;
}

function loadComments() {
  commentsDiv.innerHTML = "";
  if (!currentTopicId) return;

  db.collection("topics").doc(currentTopicId).collection("comments").orderBy("createdAt", "asc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "trello-card";
      div.innerHTML = `
        <strong>${data.username}</strong>: ${data.text} <br>
        <small>${data.createdAt?.toDate().toLocaleString() || ""}</small>
        ${(admins.includes(currentUser.displayName) || currentUser.uid === doc.id) ? `<button onclick="deleteComment('${doc.id}')">Delete</button>` : ""}
      `;
      commentsDiv.appendChild(div);
    });
  });
}

function addComment() {
  if (!currentUser) return alert("You must be logged in!");
  if (!currentTopicId) return;

  const text = commentInput.value.trim();
  if (!text) return alert("Enter a comment!");

  const uid = currentUser.uid;
  if (!admins.includes(currentUser.displayName)) {
    const lastTime = cooldowns[uid]?.comment || 0;
    if (Date.now() - lastTime < 30000) return alert("Wait 30 seconds between comments.");
    cooldowns[uid] = { ...cooldowns[uid], comment: Date.now() };
  }

  db.collection("users").doc(uid).get().then(userDoc => {
    const username = userDoc.data().username;
    db.collection("topics").doc(currentTopicId).collection("comments").doc().set({
      username,
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      commentInput.value = "";
      loadComments();
    });
  });
}

function deleteTopic(topicId) {
  if (!currentUser) return;
  if (!confirm("Are you sure you want to delete this topic?")) return;
  db.collection("topics").doc(topicId).delete().then(() => loadTopics());
}

function deleteComment(commentId) {
  if (!currentUser || !currentTopicId) return;
  if (!confirm("Are you sure you want to delete this comment?")) return;

  db.collection("topics").doc(currentTopicId).collection("comments").doc(commentId).delete().then(() => loadComments());
}
