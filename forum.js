const forumPanel = document.getElementById("forum-panel");
const topicDetailPanel = document.getElementById("topic-detail-panel");
const topicsDiv = document.getElementById("topics");
const topicTitleEl = document.getElementById("topic-title");
const commentsDiv = document.getElementById("comments");
const commentInput = document.getElementById("comment-input");

let currentTopicId = null;
let currentUser = null;
let currentUserRole = "member";
const cooldowns = {};

auth.onAuthStateChanged(async user => {
  currentUser = user;
  if (!user) {
    alert("You must be logged in to access the forum!");
    window.location.href = "login.html";
    return;
  }
  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    currentUserRole = userDoc.exists ? (userDoc.data().role || "member") : "member";
  } catch (e) {
    currentUserRole = "member";
  }
  loadTopics();
});

function isAdmin() { return currentUserRole === "admin"; }

function roleClass(role) {
  if (role === "admin") return "admin-glow";
  if (role === "tester") return "tester-glow";
  return "";
}

function loadTopics() {
  topicsDiv.innerHTML = "";
  db.collection("topics").orderBy("createdAt", "desc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "panel trello-card clickable";

      const titleHtml = `<strong>${escapeHtml(data.title)}</strong>`;
      const usernameHtml = `<span class="${roleClass(data.role)}">${escapeHtml(data.username)}</span>`;
      const dateHtml = `<small>${data.createdAt?.toDate().toLocaleString() || ""}</small>`;

      let adminControls = "";
      if (isAdmin()) {
        adminControls += `<button class="topic-delete-btn admin-delete" onclick="event.stopPropagation(); deleteTopic('${doc.id}')">Delete</button>`;
        if (data.uid) {
          adminControls += `<button class="ban-btn admin-delete" data-uid="${data.uid}" onclick="event.stopPropagation(); handleBanClick(event)">Ban User</button>`;
          adminControls += `<button class="unban-btn admin-delete" data-uid="${data.uid}" onclick="event.stopPropagation(); handleUnbanClick(event)">Unban User</button>`;
        }
      }

      div.innerHTML = `${titleHtml} by ${usernameHtml} <br> ${dateHtml} ${adminControls}`;
      div.onclick = () => openTopic(doc.id, data.title);
      topicsDiv.appendChild(div);
    });
  }).catch(err => {
    console.error("Failed to load topics:", err);
    alert("Failed to load topics: " + err.message);
  });
}

function createTopic() {
  if (!currentUser) return alert("You must be logged in!");
  const title = document.getElementById("new-topic").value.trim();
  const comment = document.getElementById("new-comment").value.trim();
  if (!title || !comment) return alert("Fill both fields!");

  const uid = currentUser.uid;
  if (!isAdmin()) {
    const lastTime = cooldowns[uid]?.topic || 0;
    if (Date.now() - lastTime < 60000) return alert("Wait 1 minute between creating topics.");
    cooldowns[uid] = { ...cooldowns[uid], topic: Date.now() };
  }

  db.collection("users").doc(uid).get().then(userDoc => {
    const username = userDoc.data().username;
    const role = userDoc.data().role || "member";

    const topicRef = db.collection("topics").doc();
    topicRef.set({
      title,
      username,
      role,
      uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      return topicRef.collection("comments").doc().set({
        username,
        role,
        uid,
        text: comment,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }).then(() => {
      alert("Topic created!");
      document.getElementById("new-topic").value = "";
      document.getElementById("new-comment").value = "";
      loadTopics();
    }).catch(err => alert("Failed to create topic: " + err.message));
  }).catch(err => alert("Failed to fetch user info: " + err.message));
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
      const roleCls = roleClass(data.role);
      const canDelete = isAdmin() || (currentUser && currentUser.uid === data.uid);

      const div = document.createElement("div");
      div.className = "trello-card comment";

      let adminControls = "";
      if (isAdmin()) {
        if (data.uid) {
          adminControls += `<button class="ban-btn admin-delete" data-uid="${data.uid}" onclick="handleBanClick(event)">Ban User</button>`;
          adminControls += `<button class="unban-btn admin-delete" data-uid="${data.uid}" onclick="handleUnbanClick(event)">Unban User</button>`;
        }
        adminControls += canDelete ? `<button class="delete-btn admin-delete" onclick="deleteComment('${doc.id}')">Delete</button>` : "";
      } else {
        if (canDelete) adminControls += `<button class="delete-btn" onclick="deleteComment('${doc.id}')">Delete</button>`;
      }

      div.innerHTML = `
        <strong class="${roleCls}">${escapeHtml(data.username)}</strong>: ${escapeHtml(data.text)} <br>
        <small>${data.createdAt?.toDate().toLocaleString() || ""}</small>
        ${adminControls}
      `;
      commentsDiv.appendChild(div);
    });
  }).catch(err => {
    console.error("Failed to load comments:", err);
    alert("Failed to load comments: " + err.message);
  });
}

function addComment() {
  if (!currentUser) return alert("You must be logged in!");
  if (!currentTopicId) return;
  const text = commentInput.value.trim();
  if (!text) return alert("Enter a comment!");

  const uid = currentUser.uid;
  if (!isAdmin()) {
    const lastTime = cooldowns[uid]?.comment || 0;
    if (Date.now() - lastTime < 30000) return alert("Wait 30 seconds between comments.");
    cooldowns[uid] = { ...cooldowns[uid], comment: Date.now() };
  }

  db.collection("users").doc(uid).get().then(userDoc => {
    const username = userDoc.data().username;
    const role = userDoc.data().role || "member";

    db.collection("topics").doc(currentTopicId).collection("comments").doc().set({
      username,
      role,
      uid,
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      commentInput.value = "";
      loadComments();
    }).catch(err => alert("Failed to post comment: " + err.message));
  }).catch(err => alert("Failed to fetch user info: " + err.message));
}

function deleteTopic(topicId) {
  if (!isAdmin()) return alert("Only admins can delete topics.");
  if (!confirm("Are you sure you want to delete this topic?")) return;
  db.collection("topics").doc(topicId).delete().then(() => loadTopics()).catch(err => alert("Failed to delete topic: " + err.message));
}

function deleteComment(commentId) {
  if (!isAdmin() && !(currentUser && currentUser.uid)) return alert("You don't have permission.");
  if (!confirm("Delete this comment?")) return;
  db.collection("topics").doc(currentTopicId).collection("comments").doc(commentId).delete().then(() => loadComments()).catch(err => alert("Failed to delete comment: " + err.message));
}

async function handleBanClick(evt) {
  evt.stopPropagation?.();
  const btn = evt.currentTarget || evt.target;
  const uid = btn.getAttribute("data-uid");
  if (!uid) return alert("No user id found.");

  if (!isAdmin()) return alert("Only admins can ban users.");

  const reason = prompt("Enter ban reason (short):");
  if (reason === null) return;

  const appeal = prompt("Appeal instructions (optional) — e.g. 'Email support@example.com' (leave blank for defaults):");
  const appealInstructions = appeal ? appeal : "To appeal, contact support or open a ticket on our Discord.";

  try {
    await db.collection("banned").doc(uid).set({
      reason,
      bannedBy: auth.currentUser.uid,
      bannedAt: firebase.firestore.FieldValue.serverTimestamp(),
      appealInstructions
    });
    alert("User banned.");
  } catch (err) {
    alert("Failed to ban user: " + err.message);
    console.error(err);
  }
}

async function handleUnbanClick(evt) {
  evt.stopPropagation?.();
  const btn = evt.currentTarget || evt.target;
  const uid = btn.getAttribute("data-uid");
  if (!uid) return alert("No user id found.");

  if (!isAdmin()) return alert("Only admins can unban users.");

  if (!confirm("Unban this user?")) return;

  try {
    await db.collection("banned").doc(uid).delete();
    alert("User unbanned.");
  } catch (err) {
    alert("Failed to unban user: " + err.message);
    console.error(err);
  }
}

function escapeHtml(s) {
  if (typeof s !== "string") return s;
  return s.replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}
