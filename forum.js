const admins = ["autoaegis"];

auth.onAuthStateChanged(user => {
  if (!user) {
    alert("You must be logged in to access the forum!");
    window.location.href = "login.html";
  } else {
    loadTopics();
  }
});

function createTopic() {
  const title = document.getElementById('new-topic').value.trim();
  const comment = document.getElementById('new-comment').value.trim();
  if (!title || !comment) return alert("Fill both fields!");

  const userId = auth.currentUser.uid;
  db.collection("users").doc(userId).get().then(doc => {
    const username = doc.data().username;
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
}

function loadTopics() {
  const container = document.getElementById('topics');
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

  db.collection("users").doc(auth.currentUser.uid).get().then(userDoc => {
    const currentUsername = userDoc.data().username;

    comments.forEach((c, index) => {
      const el = document.createElement('div');
      el.className = "comment";
      el.innerHTML = `<strong>${c.user}:</strong> ${c.text}`;

      if (admins.includes(currentUsername) || c.userId === auth.currentUser.uid) {
        const delBtn = document.createElement('button');
        delBtn.textContent = "Delete";
        delBtn.style.marginLeft = "10px";
        delBtn.onclick = e => {
          e.stopPropagation();
          deleteComment(index);
        };
        el.appendChild(delBtn);
      }

      commentsDiv.appendChild(el);
    });

    if (admins.includes(currentUsername) || currentUsername === title.author) {
      const delTopicBtn = document.createElement('button');
      delTopicBtn.textContent = "Delete Topic";
      delTopicBtn.style.marginTop = "10px";
      delTopicBtn.onclick = () => deleteTopic();
      commentsDiv.appendChild(delTopicBtn);
    }
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

function deleteComment(index) {
  const topicRef = db.collection("topics").doc(currentTopicId);
  topicRef.get().then(doc => {
    if (!doc.exists) return alert("Topic not found!");
    const data = doc.data();
    const comments = data.comments || [];
    comments.splice(index, 1);
    topicRef.update({ comments }).then(() => {
      openTopic(currentTopicId, data.title, comments);
    });
  });
}

function deleteTopic() {
  if (!confirm("Are you sure you want to delete this topic?")) return;
  db.collection("topics").doc(currentTopicId).delete().then(() => {
    backToForum();
  });
}

function backToForum() {
  document.getElementById('forum-panel').style.display = "block";
  document.getElementById('topic-detail-panel').style.display = "none";
  loadTopics();
}
