requireLogin();

let me = null;
let selectedContact = null;
let replyToMessageId = null;

const socket = io(API_URL, {
    auth: {
        token: getToken()
    }
});

socket.on("connected", function (data) {
    console.log("Socket connected:", data);
});

socket.on("receive_message", function (msg) {
    if (!selectedContact) return;

    const isCurrentConversation =
        (msg.sender_id === me.chat_id && msg.receiver_id === selectedContact.chat_id) ||
        (msg.sender_id === selectedContact.chat_id && msg.receiver_id === me.chat_id);

    if (isCurrentConversation) {
        appendMessage(msg);
    }

    loadContacts();
});

socket.on("message_edited", function (msg) {
    const el = document.getElementById(msg.id);
    if (el) {
        const textEl = el.querySelector(".msg-text");
        if (textEl) {
            textEl.innerText = msg.text + " (edited)";
        }
    }
});

socket.on("message_deleted", function (msg) {
    const el = document.getElementById(msg.id);
    if (el) {
        el.innerHTML = `<em>This message was deleted</em>`;
    }
});

async function loadMe() {
    me = await apiFetch("/api/me", {
        headers: authHeaders()
    });

    document.getElementById("myName").innerText = me.name;
    document.getElementById("myId").innerText = me.chat_id;

    const myDp = document.getElementById("myDp");

    if (me.profile_image) {
        myDp.src = API_URL + me.profile_image + "?t=" + new Date().getTime();
    } else {
        myDp.src = "https://via.placeholder.com/45";
    }

    myDp.onerror = function () {
        myDp.src = "https://via.placeholder.com/45";
    };
}

async function loadContacts() {
    const contacts = await apiFetch("/api/contacts", {
        headers: authHeaders()
    });

    const box = document.getElementById("contacts");
    box.innerHTML = "";

    contacts.forEach(item => {
        const user = item.user;

        const div = document.createElement("div");
        div.className = "contact";
        div.onclick = () => openChat(user);

        div.innerHTML = `
            <img src="${user.profile_image ? API_URL + user.profile_image + '?t=' + new Date().getTime() : 'https://via.placeholder.com/40'}">
            <div>
                <b>${user.name}</b>
                <small>${user.chat_id}</small>
            </div>
        `;

        box.appendChild(div);
    });
}

async function addContact() {
    const chatId = document.getElementById("contactIdInput").value.trim();

    if (!chatId) {
        alert("Enter user ID");
        return;
    }

    try {
        await apiFetch("/api/contacts/add", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ chat_id: chatId })
        });

        document.getElementById("contactIdInput").value = "";
        loadContacts();
    } catch (err) {
        alert(err.message);
    }
}

async function refreshApp() {
    try {
        await loadMe();
        await loadContacts();

        if (selectedContact) {
            await openChat(selectedContact);
        }

        console.log("App refreshed");
    } catch (err) {
        alert("Refresh failed: " + err.message);
    }
}

async function openChat(user) {
    selectedContact = user;
    replyToMessageId = null;

    document.getElementById("chatTitle").innerText = user.name;
    document.getElementById("chatSubTitle").innerText = user.chat_id;
    document.getElementById("replyBox").style.display = "none";

    const messages = await apiFetch("/api/messages/" + user.chat_id, {
        headers: authHeaders()
    });

    const box = document.getElementById("messages");
    box.innerHTML = "";

    messages.forEach(msg => appendMessage(msg));
}

function appendMessage(msg) {
    const box = document.getElementById("messages");

    if (document.getElementById(msg.id)) return;

    const div = document.createElement("div");
    div.id = msg.id;
    div.className = msg.sender_id === me.chat_id ? "message mine" : "message theirs";

    if (msg.deleted) {
        div.innerHTML = `<em>This message was deleted</em>`;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
        return;
    }

    let content = "";

    if (msg.reply_to) {
        content += `<div class="reply-preview">Reply to: ${msg.reply_to}</div>`;
    }

    if (msg.type === "text") {
        content += `<div class="msg-text">${msg.text}${msg.edited ? " (edited)" : ""}</div>`;
    }

    if (msg.type === "image") {
        content += `<img class="chat-media" src="${API_URL + msg.file_url}">`;
    }

    if (msg.type === "video") {
        content += `<video class="chat-media" controls src="${API_URL + msg.file_url}"></video>`;
    }

    if (msg.type === "voice") {
        content += `<audio controls src="${API_URL + msg.file_url}"></audio>`;
    }

    content += `<small>${msg.created_at}</small>`;

    content += `
        <div class="msg-actions">
            <button onclick="replyMessage('${msg.id}')">Reply</button>
    `;

    if (msg.sender_id === me.chat_id && msg.type === "text") {
        content += `<button onclick="editMessage('${msg.id}', '${encodeURIComponent(msg.text)}')">Edit</button>`;
    }

    if (msg.sender_id === me.chat_id) {
        content += `<button onclick="deleteMessage('${msg.id}')">Delete</button>`;
    }

    content += `</div>`;

    div.innerHTML = content;

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function sendTextMessage() {
    if (!selectedContact) {
        alert("Select a contact first");
        return;
    }

    const input = document.getElementById("messageInput");
    const text = input.value.trim();

    if (!text) return;

    socket.emit("send_message", {
        receiver_id: selectedContact.chat_id,
        type: "text",
        text: text,
        reply_to: replyToMessageId
    });

    input.value = "";
    replyToMessageId = null;
    document.getElementById("replyBox").style.display = "none";
}

async function sendMedia() {
    if (!selectedContact) {
        alert("Select a contact first");
        return;
    }

    const fileInput = document.getElementById("mediaInput");
    const file = fileInput.files[0];

    if (!file) return;

    let kind = "images";
    let type = "image";

    if (file.type.startsWith("video/")) {
        kind = "videos";
        type = "video";
    }

    try {
        const uploaded = await uploadFile("/api/upload/" + kind, file);

        socket.emit("send_message", {
            receiver_id: selectedContact.chat_id,
            type: type,
            file_url: uploaded.file_url,
            text: "",
            reply_to: replyToMessageId
        });

        fileInput.value = "";
        replyToMessageId = null;
        document.getElementById("replyBox").style.display = "none";
    } catch (err) {
        alert(err.message);
    }
}

function replyMessage(messageId) {
    replyToMessageId = messageId;
    document.getElementById("replyBox").style.display = "block";
    document.getElementById("replyText").innerText = "Replying to " + messageId;
}

function cancelReply() {
    replyToMessageId = null;
    document.getElementById("replyBox").style.display = "none";
}

async function editMessage(messageId, oldTextEncoded) {
    const oldText = decodeURIComponent(oldTextEncoded);
    const newText = prompt("Edit message:", oldText);

    if (!newText) return;

    try {
        await apiFetch("/api/messages/" + messageId + "/edit", {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ text: newText })
        });
    } catch (err) {
        alert(err.message);
    }
}

async function deleteMessage(messageId) {
    const ok = confirm("Delete this message for everyone?");

    if (!ok) return;

    try {
        await apiFetch("/api/messages/" + messageId + "/delete", {
            method: "DELETE",
            headers: authHeaders(),
            body: JSON.stringify({ mode: "everyone" })
        });
    } catch (err) {
        alert(err.message);
    }
}

let recording = false;

async function toggleRecording() {
    const btn = document.getElementById("voiceBtn");

    if (!selectedContact) {
        alert("Select a contact first");
        return;
    }

    if (!recording) {
        await startVoiceRecording();
        recording = true;
        btn.innerText = "Stop";
    } else {
        stopVoiceRecording(async function (blob) {
            const file = new File([blob], "voice.webm", { type: "audio/webm" });

            try {
                const uploaded = await uploadFile("/api/upload/voice", file);

                socket.emit("send_message", {
                    receiver_id: selectedContact.chat_id,
                    type: "voice",
                    file_url: uploaded.file_url,
                    text: "",
                    reply_to: replyToMessageId
                });

                replyToMessageId = null;
                document.getElementById("replyBox").style.display = "none";
            } catch (err) {
                alert(err.message);
            }
        });

        recording = false;
        btn.innerText = "Mic";
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    try {
        await loadMe();
        await loadContacts();
    } catch (err) {
        alert(err.message);
        logout();
    }
});
