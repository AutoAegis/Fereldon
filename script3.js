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

const userBox = document.getElementById('user-box');
auth.onAuthStateChanged(user => {
  if(user){
    userBox.innerHTML = `
      <span id="welcome">Welcome, ${user.email}</span>
      <a href="#" id="logout-btn">Logout</a>
    `;
    document.getElementById('logout-btn').onclick = () => {
      auth.signOut().then(() => window.location.href = "login.html");
    };
  } else {
    userBox.innerHTML = `
      <a href="login.html">Login</a>
      <a href="register.html">Register</a>
    `;
  }
});

if(document.getElementById('forum-panel')){
  auth.onAuthStateChanged(user => {
    if(!user){
      alert("You must be logged in to access the forum!");
      window.location.href = "login.html";
    } else {
      loadTopics();
    }
  });
}

function createTopic(){
  const title = document.getElementById('new-topic').value.trim();
  const comment = document.getElementById('new-comment').value.trim();
  if(!title || !comment) return alert("Fill both fields!");

  const userEmail = auth.currentUser.email;
  const now = new Date();

  db.collection("topics")
    .where("author", "==", userEmail)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get()
    .then(snapshot => {
      if(!snapshot.empty){
        const lastTopic = snapshot.docs[0].data();
        const lastTime = lastTopic.createdAt.toDate();
        if(now - lastTime < 24 * 60 * 60 * 1000){
          return alert("You can only create 1 topic per 24 hours!");
        }
      }

      db.collection("topics").add({
        title,
        author: userEmail,
        comments: [{user: userEmail, text: comment, timestamp: firebase.firestore.FieldValue.serverTimestamp()}],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        document.getElementById('new-topic').value = '';
        document.getElementById('new-comment').value = '';
        loadTopics();
      });
    });
}

function loadTopics(){
  const container = document.getElementById('topics');
  if(!container) return;
  container.innerHTML = '';
  db.collection("topics").orderBy("createdAt","desc").get()
    .then(snapshot=>{
      snapshot.forEach(doc=>{
        const data = doc.data();
        const div = document.createElement('div');
        div.className = 'topic';
        div.innerHTML = `<strong>${data.title}</strong> (${data.comments.length} comments)`;
        div.onclick = ()=> openTopic(doc.id, data.title, data.comments);
        container.appendChild(div);
      });
    });
}

let currentTopicId = null;
function openTopic(id, title, comments){
  currentTopicId = id;
  document.getElementById('forum-panel').style.display = 'none';
  document.getElementById('topic-detail-panel').style.display = 'block';
  document.getElementById('topic-title').innerText = title;

  const commentsDiv = document.getElementById('comments');
  commentsDiv.innerHTML = '';
  comments.forEach(c=>{
    const p = document.createElement('div');
    p.className = 'comment';
    p.innerHTML = `<strong>${c.user}:</strong> ${c.text}`;
    commentsDiv.appendChild(p);
  });
}

function addComment(){
  const text = document.getElementById('comment-input').value.trim();
  if(!text) return alert("Write something!");

  const topicRef = db.collection("topics").doc(currentTopicId);
  const userEmail = auth.currentUser.email;
  const now = new Date();

  topicRef.get().then(doc=>{
    if(!doc.exists) return alert("Topic not found!");
    const data = doc.data();
    const comments = data.comments || [];

    const userComments = comments.filter(c => c.user === userEmail);
    if(userComments.length){
      const lastCommentTime = userComments[userComments.length - 1].timestamp.toDate();
      if(now - lastCommentTime < 24 * 60 * 60 * 1000){
        return alert("You can only comment once per 24 hours on this topic!");
      }
    }

    comments.push({user: userEmail, text, timestamp: firebase.firestore.FieldValue.serverTimestamp()});
    topicRef.update({comments}).then(()=>{
      document.getElementById('comment-input').value = '';
      openTopic(currentTopicId, data.title, comments);
    });
  });
}

function backToForum(){
  document.getElementById('forum-panel').style.display = 'block';
  document.getElementById('topic-detail-panel').style.display = 'none';
  loadTopics();
}
