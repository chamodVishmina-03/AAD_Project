// register.js — register.html

redirectIfAuthed();

document.getElementById("register-form").addEventListener("submit", async event => {
    event.preventDefault();

    const errorBox = document.getElementById("register-error");
    errorBox.classList.remove("show");

    const fullName = document.getElementById("register-fullname").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const phone = document.getElementById("register-phone").value.trim();
    const password = document.getElementById("register-password").value;

    const btn = document.getElementById("register-submit-btn");
    btn.disabled = true;
    btn.textContent = "Creating account…";

    try {
        const res = await ajax("/api/auth/register", {
            method: "POST",
            body: JSON.stringify({ fullName, email, password, phone: phone || null })
        });

        if (!res.ok) {
            throw new Error(await errorMessage(res, "Could not create your account."));
        }

        const data = await res.json();
        saveSession(data);
        window.location.href = "index.html";
    } catch (e) {
        errorBox.textContent = e.message;
        errorBox.classList.add("show");
    } finally {
        btn.disabled = false;
        btn.textContent = "Create account";
    }
});
