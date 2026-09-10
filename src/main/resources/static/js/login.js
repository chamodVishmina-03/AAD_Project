// login.js — login.html

redirectIfAuthed();

document.getElementById("login-form").addEventListener("submit", async event => {
    event.preventDefault();

    const errorBox = document.getElementById("login-error");
    errorBox.classList.remove("show");

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    const btn = document.getElementById("login-submit-btn");
    btn.disabled = true;
    btn.textContent = "Signing in…";

    try {
        const res = await ajax("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) {
            throw new Error(await errorMessage(res, "Invalid email or password."));
        }

        const data = await res.json();
        saveSession(data);
        window.location.href = "index.html";
    } catch (e) {
        errorBox.textContent = e.message;
        errorBox.classList.add("show");
    } finally {
        btn.disabled = false;
        btn.textContent = "Sign in";
    }
});
