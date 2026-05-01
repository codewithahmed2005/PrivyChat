const API_URL = "http://127.0.0.1:5000";

function getToken() {
    return localStorage.getItem("token");
}

function saveToken(token) {
    localStorage.setItem("token", token);
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + getToken()
    };
}

async function apiFetch(path, options = {}) {
    const response = await fetch(API_URL + path, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
    }

    return data;
}

async function uploadFile(path, file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(API_URL + path, {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + getToken()
        },
        body: formData
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Upload failed");
    }

    return data;
}

function requireLogin() {
    if (!getToken()) {
        window.location.href = "login.html";
    }
}

function applyTheme(theme) {
    document.body.classList.remove("theme-light", "theme-dark", "theme-blue", "theme-green");
    document.body.classList.add("theme-" + theme);
    localStorage.setItem("theme", theme);
}

const savedTheme = localStorage.getItem("theme") || "light";
document.addEventListener("DOMContentLoaded", () => {
    applyTheme(savedTheme);
});