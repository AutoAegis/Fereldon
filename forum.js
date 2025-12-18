// Ariselle 2025 || All rights reserved to John, Demi, and Nyx || Website authored by AutoAegis and 7espion //

const forumPanel = document.getElementById("forum-panel");
const topicDetailPanel = document.getElementById("topic-detail-panel");
const topicsDiv = document.getElementById("topics");
const topicTitleEl = document.getElementById("topic-title");
const commentsDiv = document.getElementById("comments");
const commentInput = document.getElementById("comment-input");
const newTopicInput = document.getElementById("new-topic");
const newCommentInput = document.getElementById("new-comment");

let currentTopicId = null;
let currentUser = null;
let currentUserRole = "member";
const cooldowns = {};

auth.onAuthStateChanged(async user => {
  currentUser = user;
  if (!user) {
    if (window.location.pathname.split("/").pop() === "forum.html") {
      alert("You must be logged in to access the forum!");
      window.location.href = "login.html";
    }
    return;
  }
  try {
    const ud = await db.collection("users").doc(user.uid).get();
    currentUserRole = ud.exists ? (ud.data().role || "member") : "member";
  } catch (e) {
    currentUserRole = "member";
  }
  loadTopics();
});

function isAdmin() { return currentUserRole === "admin"; }
function isTester() { return currentUserRole === "tester"; }

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
      const topicCard = document.createElement("div");
      topicCard.className = "topic-card trello-card";

      const left = document.createElement("div");
      left.className = "topic-left";
      left.innerHTML = `
        <div class="card-title">${escapeHtml(data.title)}</div>
        <div class="card-meta">by <span class="${roleClass(data.role)}">${escapeHtml(data.username)}</span></div>
        <div class="card-time"><small>${data.createdAt?.toDate().toLocaleString() || ""}</small></div>
      `;
      left.onclick = () => openTopic(doc.id, data.title);

      const actions = document.createElement("div");
      actions.className = "topic-actions";

      if (isAdmin() && data.uid) {
        const banBtn = document.createElement("button");
        banBtn.className = "admin-ban-btn admin-delete";
        banBtn.textContent = "Ban User";
        banBtn.setAttribute("data-uid", data.uid);
        banBtn.addEventListener("click", e => {
          e.stopPropagation();
          openBanModalForUid(data.uid);
        });

        const unbanBtn = document.createElement("button");
        unbanBtn.className = "admin-unban-btn";
        unbanBtn.textContent = "Unban User";
        unbanBtn.setAttribute("data-uid", data.uid);
        unbanBtn.addEventListener("click", e => {
          e.stopPropagation();
          handleUnban(data.uid);
        });

        actions.appendChild(banBtn);
        actions.appendChild(unbanBtn);
      }

      topicCard.appendChild(left);
      topicCard.appendChild(actions);
      topicsDiv.appendChild(topicCard);
    });
  }).catch(err => {
    console.error("Failed to load topics:", err);
    alert("Failed to load topics: " + err.message);
  });
}

function createTopic() {
  if (!currentUser) return alert("You must be logged in!");
  const title = (newTopicInput?.value || "").trim();
  const comment = (newCommentInput?.value || "").trim();
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
      if (newTopicInput) newTopicInput.value = "";
      if (newCommentInput) newCommentInput.value = "";
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
      const card = document.createElement("div");
      card.className = "trello-card comment";

      const left = document.createElement("div");
      left.className = "comment-left";
      left.innerHTML = `
        <div><strong class="${roleClass(data.role)}">${escapeHtml(data.username)}</strong>: ${escapeHtml(data.text)}</div>
        <div><small>${data.createdAt?.toDate().toLocaleString() || ""}</small></div>
      `;

      const right = document.createElement("div");
      right.className = "comment-actions";

      if (isAdmin()) {
        if (data.uid) {
          const banBtn = document.createElement("button");
          banBtn.className = "admin-ban-btn admin-delete";
          banBtn.textContent = "Ban";
          banBtn.setAttribute("data-uid", data.uid);
          banBtn.addEventListener("click", e => { e.stopPropagation(); openBanModalForUid(data.uid); });
          right.appendChild(banBtn);

          const unbanBtn = document.createElement("button");
          unbanBtn.className = "admin-unban-btn";
          unbanBtn.textContent = "Unban";
          unbanBtn.setAttribute("data-uid", data.uid);
          unbanBtn.addEventListener("click", e => { e.stopPropagation(); handleUnban(data.uid); });
          right.appendChild(unbanBtn);
        }

        const delBtn = document.createElement("button");
        delBtn.className = "delete-btn admin-delete";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", e => { e.stopPropagation(); deleteComment(doc.id); });
        right.appendChild(delBtn);
      } else {
        if (currentUser && currentUser.uid === data.uid) {
          const delBtn = document.createElement("button");
          delBtn.className = "delete-btn";
          delBtn.textContent = "Delete";
          delBtn.addEventListener("click", e => { e.stopPropagation(); deleteComment(doc.id); });
          right.appendChild(delBtn);
        }
      }

      card.appendChild(left);
      card.appendChild(right);
      commentsDiv.appendChild(card);
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
  if (!isAdmin() && !isTester()) {
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
  if (!currentUser) return;
  if (!confirm("Delete this comment?")) return;
  db.collection("topics").doc(currentTopicId).collection("comments").doc(commentId).delete().then(() => loadComments()).catch(err => alert("Failed to delete comment: " + err.message));
}

async function openBanModalForUid(uid) {
  if (!isAdmin()) return alert("Only admins can ban users.");
  const reason = prompt("Enter ban reason (short):");
  if (reason === null) return;
  const preset = prompt("Duration presets:\n1) 1 hour\n2) 24 hours\n3) 7 days\n4) 30 days\n5) Permanent\n6) Custom (enter hours)\n\nEnter 1-6:");
  if (preset === null) return;
  let expiresAt = null;
  const now = Date.now();
  if (preset === "1") expiresAt = new Date(now + 1 * 3600000);
  else if (preset === "2") expiresAt = new Date(now + 24 * 3600000);
  else if (preset === "3") expiresAt = new Date(now + 7 * 24 * 3600000);
  else if (preset === "4") expiresAt = new Date(now + 30 * 24 * 3600000);
  else if (preset === "5") expiresAt = null;
  else if (preset === "6") {
    const hours = prompt("Enter custom ban length in hours (0 = permanent):");
    if (hours === null) return;
    const h = Number(hours);
    if (isNaN(h) || h < 0) return alert("Invalid number.");
    expiresAt = h === 0 ? null : new Date(now + h * 3600000);
  } else return alert("Invalid selection.");

  const appeal = prompt("Appeal instructions (optional): leave blank for default.");
  const appealInstructions = appeal ? appeal : "To appeal, contact support or open a ticket on our Discord.";

  try {
    await db.collection("banned").doc(uid).set({
      reason,
      bannedBy: auth.currentUser.uid,
      bannedAt: firebase.firestore.FieldValue.serverTimestamp(),
      appealInstructions,
      expiresAt: expiresAt ? firebase.firestore.Timestamp.fromDate(expiresAt) : null
    });
    alert("User banned.");

    try {
      const fp = await computeFingerprint();
      if (fp) {
        const devRef = db.collection("bannedDevices").doc(fp);
        const devSnap = await devRef.get();
        if (!devSnap.exists) {
          await devRef.set({
            bannedUid: uid,
            recordedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    } catch (e) { console.warn("Fingerprint mapping failed:", e); }

  } catch (err) {
    alert("Failed to ban user: " + err.message);
    console.error(err);
  }
}

async function handleUnban(uid) {
  if (!isAdmin()) return alert("Only admins can unban users.");
  if (!confirm("Unban this user?")) return;
  try {
    await db.collection("banned").doc(uid).delete();

    try {
      const q = await db.collection("bannedDevices").where("bannedUid", "==", uid).get();
      const batch = db.batch();
      q.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (e) { console.warn("Failed to cleanup bannedDevices:", e); }

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

window.createTopic = createTopic;
window.addComment = addComment;
window.backToForum = backToForum;
