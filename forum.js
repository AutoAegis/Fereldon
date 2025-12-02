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
    window.location.href = "login.html";
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
      const div = document.createElement("div");
      div.className = "panel trello-card clickable";

      const titleHtml = `<strong>${escapeHtml(data.title)}</strong>`;
      const usernameHtml = `<span class="${roleClass(data.role)}">${escapeHtml(data.username)}</span>`;
      const dateHtml = `<small>${data.createdAt?.toDate().toLocaleString() || ""}</small>`;

      let adminControls = "";
      if (isAdmin()) {
        adminControls += `<button class="topic-delete-btn admin-delete" onclick="event.stopPropagation(); deleteTopic('${doc.id}')">Delete</button>`;
        if (data.uid) {
          adminControls += `<button class="ban-btn admin-delete" data-uid="${data.uid}" onclick="event.stopPropagation(); handleBanClick(event)">Ban</button>`;
          adminControls += `<button class="unban-btn admin-delete" data-uid="${data.uid}" onclick="event.stopPropagation(); handleUnbanClick(event)">Unban</button>`;
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

async function handleBanClick(evt) {
  evt.stopPropagation?.();
  const btn = evt.currentTarget || evt.target;
  const uid = btn.getAttribute("data-uid");
  if (!uid) return alert("No user id found.");
  if (!isAdmin()) return alert("Only admins can ban users.");

  const reason = prompt("Enter ban reason (short):");
  if (reason === null) return; 

  const appeal = prompt("Appeal instructions (optional): Leave blank for default.");
  const appealInstructions = appeal ? appeal : "To appeal, contact support or open a ticket on our Discord.";

  try {
    await db.collection("banned").doc(uid).set({
      reason,
      bannedBy: auth.currentUser.uid,
      bannedAt: firebase.firestore.FieldValue.serverTimestamp(),
      appealInstructions
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
    } catch (e) {
    }

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

    try {
      const q = await db.collection("bannedDevices").where("bannedUid", "==", uid).get();
      const batch = db.batch();
      q.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.warn("Failed to clean up bannedDevices entries:", e);
    }

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
