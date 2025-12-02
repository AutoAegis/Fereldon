const forumPanel = document.getElementById("forum-panel");
const topicDetailPanel = document.getElementById("topic-detail-panel");
const topicsDiv = document.getElementById("topics");
const topicTitleEl = document.getElementById("topic-title");
const commentsDiv = document.getElementById("comments");
const commentInput = document.getElementById("comment-input");

let currentTopicId = null;
let currentUser = null;
let currentUserRole = "member"; // 🔥 added
const cooldowns = {};

auth.onAuthStateChanged(async user => {
  if (!user) return window.location.href = "login.html";

  currentUser = user;

  // Load user role
  const userDoc = await db.collection("users").doc(user.uid).get();
  currentUserRole = userDoc.data().role || "member";

  loadTopics();
});

function loadTopics() {
  topicsDiv.innerHTML = "";

  db.collection("topics").orderBy("createdAt", "desc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();

      const div = document.createElement("div");
      div.className = "panel trello-card clickable";

      // Role glow on username
      const roleClass = data.role === "admin" ? "admin-glow" :
                        data.role === "tester" ? "tester-glow" : "";

      div.innerHTML = `
        <strong class="${roleClass}">${data.title}</strong> by 
        <span class="${roleClass}">${data.username}</span><br>
        <small>${data.createdAt?.toDate().toLocaleString() || ""}</small>
        ${currentUserRole === "admin" ? `<button onclick="deleteTopic('${doc.id}')">Delete</button>` : ""}
      `;

      div.onclick = () => openTopic(doc.id, data.title);
      topicsDiv.appendChild(div);
    });
  });
}

function createTopic() {
  if (!currentUser) return;

  const title = document.getElementById("new-topic").value.trim();
  const comment = document.getElementById("new-comment").value.trim();
  if (!title || !comment) return alert("Fill both fields!");

  const uid = currentUser.uid;

  db.collection("users").doc(uid).get().then(userDoc => {
    const username = userDoc.data().username;
    const role = userDoc.data().role || "member";

    const topicRef = db.collection("topics").doc();

    topicRef.set({
      title,
      username,
      role,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      topicRef.collection("comments").add({
        username,
        role,
        text: comment,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        alert("Topic created!");
        loadTopics();
      });
    });
  });
}

function loadComments() {
  commentsDiv.innerHTML = "";

  db.collection("topics").doc(currentTopicId).collection("comments")
    .orderBy("createdAt", "asc")
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();

        const roleClass = data.role === "admin" ? "admin-glow" :
                          data.role === "tester" ? "tester-glow" : "";

        const canDelete =
          currentUserRole === "admin" ||
          currentUserRole === "tester" ||
          currentUser.uid === doc.id;

        const div = document.createElement("div");
        div.className = "trello-card";

        div.innerHTML = `
          <strong class="${roleClass}">${data.username}</strong>: ${data.text} <br>
          <small>${data.createdAt?.toDate().toLocaleString() || ""}</small>
          ${canDelete ? `<button onclick="deleteComment('${doc.id}')">Delete</button>` : ""}
        `;

        commentsDiv.appendChild(div);
      });
    });
}

function deleteTopic(topicId) {
  if (currentUserRole !== "admin") return alert("Only admins can delete topics.");

  db.collection("topics").doc(topicId).delete().then(loadTopics);
}

function deleteComment(commentId) {
  if (currentUserRole === "member") return alert("Members can't delete comments.");

  db.collection("topics").doc(currentTopicId)
    .collection("comments").doc(commentId).delete()
    .then(loadComments);
}
