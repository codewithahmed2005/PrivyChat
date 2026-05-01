requireLogin();

async function loadSettings() {
    try {
        const settings = await apiFetch("/api/settings", {
            headers: authHeaders()
        });

        document.getElementById("themeSelect").value = settings.theme;
        applyTheme(settings.theme);
    } catch (err) {
        alert(err.message);
    }
}

async function saveTheme() {
    const theme = document.getElementById("themeSelect").value;

    try {
        await apiFetch("/api/settings/theme", {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({ theme })
        });

        applyTheme(theme);
        alert("Theme saved");
    } catch (err) {
        alert(err.message);
    }
}

async function deleteAccount() {
    const ok = confirm("Are you sure? This will delete your account and all your chats.");

    if (!ok) return;

    try {
        await apiFetch("/api/account/delete", {
            method: "DELETE",
            headers: authHeaders()
        });

        localStorage.removeItem("token");
        alert("Account deleted");
        window.location.href = "register.html";
    } catch (err) {
        alert(err.message);
    }
}

document.addEventListener("DOMContentLoaded", loadSettings);