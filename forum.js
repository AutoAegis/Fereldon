const ADMINS = ["autoaegis"];
const db = firebase.firestore();
const auth = firebase.auth();

let currentUser = null;
let currentUsername = null;
let lastTopicPost = 0;
let lastCommentPost = 0;

auth.onAuthStateChanged(async user => {
    if (!user) {
        document.getElementById("user-info").innerText = "Not logged in.";
        return;
    }

    currentUser = user;

    const doc = await db.collection("users").doc(user.uid).get();
    currentUsername = doc.exists ? doc.data().username : "Unknown";

    document.getElementById("user-info").innerHTML = "Logged in as: <b>" + currentUsername + "</b>";
    loadTopics();
});

async function createTopic() {
    if (!currentUser) return alert("You must be logged in.");

    const title = document.getElementById("topic-title").value.trim();
    const content = document.getElementById("topic-content").value.trim();
    if (!title || !content) return alert("Fill in all fields.");

    const isAdmin = ADMINS.includes(currentUsername);
    if (!isAdmin && Date.now() - lastTopicPost < 30000) return alert("Wait 30 seconds before posting another topic.");

    await db.collection("topics").add({
        title,
        content,
        author: currentUsername,
        timestamp: Date.now()
    });

    lastTopicPost = Date.now();
    document.getElementById("topic-title").value = "";
    document.getElementById("topic-content").value = "";
}

function loadTopics() {
    db.collection("topics").orderBy("timestamp", "desc")
        .onSnapshot(snapshot => {
            const container = document.getElementById("topics");
            container.innerHTML = "";

            snapshot.forEach(doc => {
                const t = doc.data();
                const id = doc.id;

                const div = document.createElement("div");
                div.className = "topic";

                div.innerHTML = `
                    <h3>${t.title}</h3>
                    <p>${t.content}</p>
                    <small>Posted by ${t.author}</small>
                    ${ADMINS.includes(currentUsername) ? `<span class="delete-btn" onclick="deleteTopic('${id}')">[delete]</span>` : ""}
                    <br><br>

                    <textarea id="comment-${id}" placeholder="Write a comment..." rows="2" cols="50"></textarea>
                    <br>
                    <button onclick="postComment('${id}')">Comment</button>

                    <div id="comments-${id}"></div>
                `;

                container.appendChild(div);
                loadComments(id);
            });
        });
}

async function deleteTopic(id) {
    if (!ADMINS.includes(currentUsername)) return;
    await db.collection("topics").doc(id).delete();
    const comments = await db.collection("topics").doc(id).collection("comments").get();
    comments.forEach(c => c.ref.delete());
}

async function postComment(topicId) {
    if (!currentUser) return alert("You must be logged in.");

    const text = document.getElementById("comment-" + topicId).value.trim();
    if (!text) return alert("Enter a comment.");

    const isAdmin = ADMINS.includes(currentUsername);
    if (!isAdmin && Date.now() - lastCommentPost < 30000) return alert("Wait 30 seconds before commenting again.");

    await db.collection("topics").doc(topicId).collection("comments").add({
        text,
        author: currentUsername,
        timestamp: Date.now()
    });

    lastCommentPost = Date.now();
    document.getElementById("comment-" + topicId).value = "";
}

function loadComments(topicId) {
    db.collection("topics").doc(topicId).collection("comments")
        .orderBy("timestamp")
        .onSnapshot(snapshot => {
            const container = document.getElementById("comments-" + topicId);
            container.innerHTML = "";

            snapshot.forEach(doc => {
                const c = doc.data();
                const id = doc.id;

                const div = document.createElement("div");
                div.className = "comment";
                div.innerHTML = `
                    <b>${c.author}:</b> ${c.text}
                    ${ADMINS.includes(currentUsername) ? `<span class="delete-btn" onclick="deleteComment('${topicId}', '${id}')">[delete]</span>` : ""}
                `;

                container.appendChild(div);
            });
        });
}

async function deleteComment(topicId, commentId) {
    if (!ADMINS.includes(currentUsername)) return;
    await db.collection("topics").doc(topicId).collection("comments").doc(commentId).delete();
}
