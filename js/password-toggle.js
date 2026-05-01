function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);

    if (input.type === "password") {
        input.type = "text";
        button.innerText = "Hide";
    } else {
        input.type = "password";
        button.innerText = "Show";
    }
}