const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const data = await apiFetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, username, password })
            });

            saveToken(data.token);
            alert("Account created. Your ID is: " + data.user.chat_id);
            window.location.href = "chat.html";
        } catch (err) {
            alert(err.message);
        }
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const data = await apiFetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });

            saveToken(data.token);
            window.location.href = "chat.html";
        } catch (err) {
            alert(err.message);
        }
    });
}