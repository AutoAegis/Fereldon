const forumPanel = document.getElementById('forum-panel');
const topicDetailPanel = document.getElementById('topic-detail-panel');
const topicsContainer = document.getElementById('topics');
const commentsDiv = document.getElementById('comments');

const ADMIN_USERS = ["autoaegis"];
let currentTopicId = null;

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    forumPanel.style.display = 'none';
    topicDetailPanel.style.display = 'none';
    alert("You must be logged in to access the forum!");
    window.location.href = "login.html";
    return;
  }

  forumPanel.style.display = 'block';
  topicDetailPanel.style.display = 'none';
  loadTopics();
});

async function loadTopics() {
  topicsContainer.innerHTML = '';
  const snapshot = await db.collection('topics').orderBy('createdAt', 'desc').get();

  snapshot.forEach(doc => {
    const data = doc.data();
    const div = document.createElement('div');
    div.className = 'topic';
    div.innerHTML = `<strong>${data.title}</strong> (${data.comments.length} comments)`;

    if (ADMIN_USERS.includes(data.author)) {
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'btn';
      delBtn.style.marginLeft = '10px';
      delBtn.onclick = () => deleteTopic(doc.id);
      div.appendChild(delBtn);
    }

    div.onclick = () => openTopic(doc.id, data.title, data.comments);
    topicsContainer.appendChild(div);
  });
}

function openTopic(id, title, comments) {
  currentTopicId = id;
  forumPanel.style.display = 'none';
  topicDetailPanel.style.display = 'block';
  document.getElementById('topic-title').innerText = title;
  commentsDiv.innerHTML = '';

  comments.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = "comment";
    el.innerHTML = `<strong>${c.user}:</strong> ${c.text}`;

    if (ADMIN_USERS.includes(c.user)) {
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'btn';
      delBtn.style.marginLeft = '10px';
      delBtn.onclick = () => deleteComment(currentTopicId, i);
      el.appendChild(delBtn);
    }

    commentsDiv.appendChild(el);
  });
}

async function createTopic() {
  const title = document.getElementById('new-topic').value.trim();
  const comment = document.getElementById('new-comment').value.trim();
  if (!title || !comment) return alert("Fill both fields!");

  const userId = auth.currentUser.uid;
  const now = new Date();
  const userDoc = await db.collection('users').doc(userId).get();
  const username = userDoc.data().username;

  const lastTopicSnap = await db.collection('topics')
    .where('authorId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!ADMIN_USERS.includes(username) && !lastTopicSnap.empty) {
    const last = lastTopicSnap.docs[0].data().createdAt.toDate();
    if (now - last < 86400000) return alert("You can only create 1 topic per 24 hours!");
  }

  await db.collection('topics').add({
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
  });

  document.getElementById('new-topic').value = '';
  document.getElementById('new-comment').value = '';
  loadTopics();
}

async function addComment() {
  const text = document.getElementById('comment-input').value.trim();
  if (!text) return alert("Write something!");

  const topicRef = db.collection('topics').doc(currentTopicId);
  const userId = auth.currentUser.uid;
  const userDoc = await db.collection('users').doc(userId).get();
  const username = userDoc.data().username;
  const now = new Date();

  const topicDoc = await topicRef.get();
  if (!topicDoc.exists) return alert("Topic not found!");

  const data = topicDoc.data();
  const comments = data.comments || [];
  const userComments = comments.filter(c => c.userId === userId);

  if (!ADMIN_USERS.includes(username) && userComments.length) {
    const lastTime = userComments[userComments.length - 1].timestamp.toDate();
    if (now - lastTime < 86400000) return alert("You can only comment once per 24 hours!");
  }

  comments.push({
    user: username,
    userId,
    text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  await topicRef.update({ comments });
  document.getElementById('comment-input').value = '';
  openTopic(currentTopicId, data.title, comments);
}

async function backToForum() {
  forumPanel.style.display = 'block';
  topicDetailPanel.style.display = 'none';
  loadTopics();
}

async function deleteTopic(topicId) {
  if (!confirm("Are you sure you want to delete this topic?")) return;
  await db.collection('topics').doc(topicId).delete();
  loadTopics();
}

async function deleteComment(topicId, index) {
  const topicRef = db.collection('topics').doc(topicId);
  const topicDoc = await topicRef.get();
  const comments = topicDoc.data().comments;
  comments.splice(index, 1);
  await topicRef.update({ comments });
  openTopic(topicId, topicDoc.data().title, comments);
}
