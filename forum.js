const db = firebase.firestore();
const auth = firebase.auth();

const admins = ["autoaegis"];

let currentTopicId = null;

auth.onAuthStateChanged(user => {
  if (!user) {
    alert("You must be logged in to access the forum!");
    window.location.href = "login.html";
  } else {
    loadTopics();
  }
});

document.getElementById("create-topic-btn").onclick = createTopic;
document.getElementById("add-comment-btn").onclick = addComment;
document.getElementById("back-to-forum-btn").onclick = backToForum;

function createTopic() {
  const title = document.getElementById("new-topic").value.trim();
  const comment = document.getElementById("new-comment").value.trim();
  if (!title || !comment) return alert("Fill both fields!");

  const userId = auth.currentUser.uid;

  db.collection("users").doc(userId).get().then(doc => {
    const username = doc.data().username;

    const isAdmin = admins.includes(username);

    db.collection("topics")
      .where("authorId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get()
      .then(snapshot => {
        if (!snapshot.empty && !isAdmin) {
          const last = snapshot.docs[0].data().createdAt.toDate();
          const now = new Date();
          if (now - last < 86400000) return alert("You can only create 1 topic per 24 hours!");
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
          document.getElementById("new-topic").value = "";
          document.getElementById("new-comment").value = "";
          loadTopics();
        });
      });
  });
}

function loadTopics() {
  const container = document.getElementById("topics");
  container.innerHTML = "";

  db.collection("topics").orderBy("createdAt", "desc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "topic";
      div.innerHTML = `<strong>${data.title}</strong> (${data.comments.length} comments)`;

      if (admins.includes(data.author)) {
        div.innerHTML += ` <button class="btn" onclick="deleteTopic('${doc.id}')">Delete</button>`;
      }

      div.onclick = () => openTopic(doc.id, data.title, data.comments);
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

    if (admins.includes(c.user)) {
      el.innerHTML += ` <button class="btn" onclick="deleteComment('${currentTopicId}', ${comments.indexOf(c)})">Delete</button>`;
    }

    commentsDiv.appendChild(el);
  });
}

function addComment() {
  const text = document.getElementById("comment-input").value.trim();
  if (!text) return alert("Write something!");

  const topicRef = db.collection("topics").doc(currentTopicId);
  const userId = auth.currentUser.uid;

  db.collection("users").doc(userId).get().then(doc => {
    const username = doc.data().username;
    const isAdmin = admins.includes(username);
    const now = new Date();

    topicRef.get().then(doc => {
      if (!doc.exists) return alert("Topic not found!");

      const data = doc.data();
      const comments = data.comments || [];
      const userComments = comments.filter(c => c.userId === userId);

      if (userComments.length && !isAdmin) {
        const lastTime = userComments[userComments.length - 1].timestamp.toDate();
        if (now - lastTime < 86400000) return alert("You can only comment once per 24 hours!");
      }

      comments.push({
        user: username,
        userId,
        text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

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

function deleteTopic(topicId) {
  if (!confirm("Are you sure you want to delete this topic?")) return;
  db.collection("topics").doc(topicId).delete().then(() => loadTopics());
}

function deleteComment(topicId, index) {
  const topicRef = db.collection("topics").doc(topicId);
  topicRef.get().then(doc => {
    if (!doc.exists) return;
    const comments = doc.data().comments || [];
    comments.splice(index, 1);
    topicRef.update({ comments }).then(() => openTopic(topicId, doc.data().title, comments));
  });
}
