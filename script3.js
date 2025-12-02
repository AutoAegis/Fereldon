const db = firebase.firestore();
const auth = firebase.auth();

function getRoleBadge(role) {
  if (role === "admin") {
    return `<span class="role-badge admin-badge">Admin</span>`;
  }
  if (role === "tester") {
    return `<span class="role-badge tester-badge">Tester</span>`;
  }
  return "";
}

function loadTopics() {
  const topicList = document.getElementById("topic-list");
  if (!topicList) return;

  db.collection("forumTopics")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      topicList.innerHTML = "";
      snapshot.forEach(doc => {
        const topic = doc.data();

        const item = document.createElement("div");
        item.classList.add("topic-item");

        item.innerHTML = `
          <h3>${topic.title}</h3>
          <p>${topic.content}</p>

          <div class="topic-meta">
            Posted by <strong>${topic.username}</strong>
            ${getRoleBadge(topic.role || "user")}
          </div>

          <a href="topic.html?id=${doc.id}" class="view-topic">Open</a>
          <div class="delete-topic-container"></div>
        `;

        topicList.appendChild(item);
        
        auth.onAuthStateChanged(user => {
          if (!user) return;

          db.collection("users").doc(user.uid).get().then(profile => {
            const role = profile.data()?.role || "user";

            if (role === "admin") {
              const delBtn = document.createElement("button");
              delBtn.textContent = "Delete Topic";
              delBtn.classList.add("delete-btn", "admin-delete");

              delBtn.onclick = () =>
                deleteTopic(doc.id);

              item.querySelector(".delete-topic-container").appendChild(delBtn);
            }
          });
        });

      });
    });
}

function deleteTopic(topicId) {
  if (!confirm("Are you sure you want to delete this topic?")) return;

  db.collection("forumTopics").doc(topicId).delete()
    .then(() => alert("Topic deleted"))
    .catch(err => alert("Failed: " + err.message));
}

function loadComments(topicId) {
  const commentList = document.getElementById("comment-list");
  if (!commentList) return;

  db.collection("forumTopics")
    .doc(topicId)
    .collection("comments")
    .orderBy("createdAt", "asc")
    .onSnapshot(snapshot => {
      commentList.innerHTML = "";
      snapshot.forEach(doc => {
        const c = doc.data();

        const div = document.createElement("div");
        div.classList.add("comment-item");

        div.innerHTML = `
          <p>${c.text}</p>
          <div class="comment-meta">
            <strong>${c.username}</strong>
            ${getRoleBadge(c.role || "user")}
          </div>
          <div class="delete-comment-container"></div>
        `;

        commentList.appendChild(div);

        auth.onAuthStateChanged(user => {
          if (!user) return;

          db.collection("users").doc(user.uid).get().then(profile => {
            const role = profile.data()?.role || "user";

            if (role === "admin" || role === "tester") {
              const delBtn = document.createElement("button");
              delBtn.textContent = "Delete Comment";
              delBtn.classList.add("delete-btn");

              if (role === "admin") delBtn.classList.add("admin-delete");
              if (role === "tester") delBtn.classList.add("tester-delete");

              delBtn.onclick = () =>
                deleteComment(topicId, doc.id);

              div.querySelector(".delete-comment-container").appendChild(delBtn);
            }
          });
        });

      });
    });
}

function deleteComment(topicId, commentId) {
  if (!confirm("Delete this comment?")) return;

  db.collection("forumTopics")
    .doc(topicId)
    .collection("comments")
    .doc(commentId)
    .delete()
    .then(() => alert("Comment deleted"))
    .catch(err => alert("Failed: " + err.message));
}

function setupTopicCreation() {
  const form = document.getElementById("create-topic-form");
  if (!form) return;

  form.addEventListener("submit", e => {
    e.preventDefault();

    const title = document.getElementById("topic-title").value.trim();
    const content = document.getElementById("topic-content").value.trim();

    auth.onAuthStateChanged(user => {
      if (!user) return alert("Login required");

      db.collection("users").doc(user.uid).get().then(profile => {
        const data = profile.data();

        db.collection("forumTopics").add({
          title,
          content,
          uid: user.uid,
          username: data.username,
          role: data.role || "user",
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
          alert("Topic created!");
          window.location.href = "forum.html";
        });

      });
    });
  });
}

window.loadTopics = loadTopics;
window.loadComments = loadComments;
window.setupTopicCreation = setupTopicCreation;
