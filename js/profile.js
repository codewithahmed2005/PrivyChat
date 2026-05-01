requireLogin();

function profileImageUrl(path) {
    if (!path) {
        return "https://via.placeholder.com/100";
    }

    return API_URL + path + "?t=" + new Date().getTime();
}

async function loadProfile() {
    try {
        const me = await apiFetch("/api/me", {
            headers: authHeaders()
        });

        document.getElementById("chatId").value = me.chat_id;
        document.getElementById("name").value = me.name;
        document.getElementById("username").value = me.username;
        document.getElementById("about").value = me.about || "";

        const preview = document.getElementById("profilePreview");

        if (me.profile_image) {
            preview.src = profileImageUrl(me.profile_image);
        } else {
            preview.src = "https://via.placeholder.com/100";
        }

        preview.onerror = function () {
            preview.src = "https://via.placeholder.com/100";
        };

    } catch (err) {
        alert(err.message);
        logout();
    }
}

async function updateProfile(e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const username = document.getElementById("username").value;
    const about = document.getElementById("about").value;

    try {
        await apiFetch("/api/profile/update", {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ name, username, about })
        });

        alert("Profile updated");
    } catch (err) {
        alert(err.message);
    }
}

async function uploadProfileImage() {
    const fileInput = document.getElementById("profileImage");
    const file = fileInput.files[0];

    if (!file) {
        alert("Choose image first");
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
    }

    try {
        const data = await uploadFile("/api/upload/profile", file);

        console.log("Uploaded profile image:", data);

        const preview = document.getElementById("profilePreview");
        preview.src = profileImageUrl(data.file_url);

        alert("Profile image uploaded");

        fileInput.value = "";

    } catch (err) {
        alert(err.message);
    }
}

async function removeProfileImage() {
    const ok = confirm("Are you sure you want to remove your DP?");

    if (!ok) return;

    try {
        await apiFetch("/api/profile/remove-dp", {
            method: "DELETE",
            headers: authHeaders()
        });

        document.getElementById("profilePreview").src = "https://via.placeholder.com/100";
        document.getElementById("profileImage").value = "";

        alert("DP removed successfully");
    } catch (err) {
        alert(err.message);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    loadProfile();
    document.getElementById("profileForm").addEventListener("submit", updateProfile);
});