// ============================================================
// common.js — shared by every page.
// Session handling, auth guards, the shared header, the generic
// modal, and small fetch helpers all live here so each page's
// own script only has to worry about its own content.
// ============================================================

const API_BASE = "";

let session = null;

function loadSession() {
    try {
        const raw = localStorage.getItem("jc_session");
        session = raw ? JSON.parse(raw) : null;
    } catch (e) {
        session = null;
    }
}

function saveSession(data) {
    session = data;
    localStorage.setItem("jc_session", JSON.stringify(data));
}

function clearSession() {
    session = null;
    localStorage.removeItem("jc_session");
}

function isLoggedIn() {
    return !!session;
}

function isAdmin() {
    return !!(session && session.roles && session.roles.includes("ADMIN"));
}

function isStaffOrAdmin() {
    return !!(session && session.roles && (session.roles.includes("ADMIN") || session.roles.includes("STAFF")));
}

// Call at the very top of any page that needs a logged-in user.
// Sends the visitor straight to the login page if there's no session.
function requireAuth() {
    loadSession();
    if (!isLoggedIn()) {
        window.location.href = "login.html";
    }
}

// Call at the top of login.html / register.html — if the visitor is
// already signed in there's no reason to show the auth form again.
function redirectIfAuthed() {
    loadSession();
    if (isLoggedIn()) {
        window.location.href = "index.html";
    }
}

// Call at the top of admin.html — requires staff or admin, not just any login.
function requireStaffOrAdmin() {
    requireAuth();
    if (!isStaffOrAdmin()) {
        window.location.href = "index.html";
    }
}

async function logout() {
    if (session && session.refreshToken) {
        try {
            await ajax("/api/auth/logout", {
                method: "POST",
                body: JSON.stringify({ refreshToken: session.refreshToken })
            });
        } catch (e) {
            // best-effort — log out locally regardless of network issues
        }
    }
    clearSession();
    window.location.href = "login.html";
}


// ============================================================
// Shared header (brand + nav + who's signed in + logout)
// Every protected page has <div id="app-header"></div> — this
// fills it in consistently so the nav never drifts between pages.
// ============================================================

function renderHeader(activePage) {
    const header = document.getElementById("app-header");
    if (!header) return;

    header.innerHTML = `
        <div class="brand" onclick="window.location.href='index.html'">
            <div class="logo">Jc</div>
            <div>
                <div class="brand-name">Just Click</div>
                <div class="brand-sub">Hotel Management</div>
            </div>
        </div>
        <nav>
            <button onclick="window.location.href='index.html'" class="${activePage === 'home' ? 'active' : ''}">Hotels</button>
            <button onclick="window.location.href='bookings.html'" class="${activePage === 'bookings' ? 'active' : ''}">My bookings</button>
            <button onclick="window.location.href='admin.html'" class="${activePage === 'admin' ? 'active' : ''} ${isStaffOrAdmin() ? '' : 'hidden'}">Admin</button>
        </nav>
        <div class="header-right">
            <span class="who-chip">Signed in as <strong>${session ? session.fullName : ""}</strong></span>
            <button class="btn btn-outline btn-sm" id="header-logout-btn">Log out</button>
        </div>
    `;

    document.getElementById("header-logout-btn").addEventListener("click", logout);
    initConciergeChat();
}


// ============================================================
// Concierge chat widget (floating button + panel)
// Talks to POST /api/ai/chat. Injected once per page, on top of
// whatever markup the page already has, so no page needs its own
// chat HTML — renderHeader() turns it on automatically.
// ============================================================

let conciergeChatHistory = [];

function initConciergeChat() {
    if (document.getElementById("concierge-widget")) return;

    const widget = document.createElement("div");
    widget.id = "concierge-widget";
    widget.innerHTML = `
        <button id="concierge-toggle-btn" class="concierge-toggle" type="button" title="Ask Concierge">💬</button>
        <div id="concierge-panel" class="concierge-panel hidden">
            <div class="concierge-head">
                <span>Concierge</span>
                <button id="concierge-close-btn" class="modal-close" type="button">&times;</button>
            </div>
            <div id="concierge-messages" class="concierge-messages">
                <div class="concierge-msg concierge-msg-bot">Hi! I'm Concierge — ask me about our hotels and I'll help you find the right one.</div>
            </div>
            <form id="concierge-form" class="concierge-form">
                <input type="text" id="concierge-input" placeholder="Ask about a hotel…" autocomplete="off" required />
                <button type="submit" class="btn btn-primary btn-sm">Send</button>
            </form>
        </div>
    `;
    document.body.appendChild(widget);

    document.getElementById("concierge-toggle-btn").addEventListener("click", () => {
        document.getElementById("concierge-panel").classList.toggle("hidden");
    });
    document.getElementById("concierge-close-btn").addEventListener("click", () => {
        document.getElementById("concierge-panel").classList.add("hidden");
    });

    document.getElementById("concierge-form").addEventListener("submit", async event => {
        event.preventDefault();
        const input = document.getElementById("concierge-input");
        const message = input.value.trim();
        if (!message) return;

        appendConciergeMessage(message, "user");
        input.value = "";
        input.disabled = true;

        const typingEl = appendConciergeMessage("Thinking…", "bot");

        try {
            const res = await ajax("/api/ai/chat", {
                method: "POST",
                body: JSON.stringify({ message })
            });
            if (!res.ok) throw new Error(await errorMessage(res, "Concierge couldn't reply right now."));
            const wrapped = await res.json();
            const reply = (wrapped.body && wrapped.body.reply) || "Sorry, I didn't get a reply.";
            typingEl.textContent = reply;
        } catch (e) {
            typingEl.textContent = e.message;
        } finally {
            input.disabled = false;
            input.focus();
        }
    });
}

function appendConciergeMessage(text, who) {
    const messages = document.getElementById("concierge-messages");
    const el = document.createElement("div");
    el.className = `concierge-msg concierge-msg-${who}`;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
}


// ============================================================
// Small helpers
// ============================================================

function fmtLKR(n) {
    return "LKR " + Number(n).toLocaleString("en-LK");
}

function isoDateInDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2600);
}

async function ajax(path, options = {}) {
    const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    try {
        return await fetch(`${API_BASE}${path}`, Object.assign({}, options, { headers }));
    } catch (e) {
        throw new Error("Could not reach the server. Is the backend running?");
    }
}

async function authAjax(path, options = {}) {
    const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    if (session && session.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
    try {
        return await fetch(`${API_BASE}${path}`, Object.assign({}, options, { headers }));
    } catch (e) {
        throw new Error("Could not reach the server. Is the backend running?");
    }
}

// Like authAjax, but for multipart file uploads — the browser must set its
// own "Content-Type: multipart/form-data; boundary=..." header, so we only
// attach the auth header here and let fetch handle the rest.
async function authUpload(path, formData) {
    const headers = {};
    if (session && session.accessToken) {
        headers["Authorization"] = `Bearer ${session.accessToken}`;
    }
    try {
        return await fetch(`${API_BASE}${path}`, { method: "POST", headers, body: formData });
    } catch (e) {
        throw new Error("Could not reach the server. Is the backend running?");
    }
}

async function errorMessage(res, fallback) {
    try {
        const body = await res.json();
        return body.message || fallback;
    } catch (e) {
        return fallback;
    }
}


// ============================================================
// Generic modal (dialog) — used on hotel.html and admin.html
// Both pages include <dialog id="modal">...</dialog> from the
// same markup block, so this code works on either page unchanged.
// ============================================================

function openModal(title, bodyHtml) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-error").classList.remove("show");
    document.getElementById("modal-body").innerHTML = bodyHtml;
    document.getElementById("modal").showModal();
}

function closeModal() {
    const dialog = document.getElementById("modal");
    if (dialog && dialog.open) dialog.close();
}

function modalErrorText(message) {
    const el = document.getElementById("modal-error");
    el.textContent = message;
    el.classList.add("show");
}

function initModalCloseHandlers() {
    const dialog = document.getElementById("modal");
    if (!dialog) return;

    document.getElementById("modal-close-btn").addEventListener("click", closeModal);

    dialog.addEventListener("click", event => {
        const rect = dialog.getBoundingClientRect();
        const inside =
            rect.top <= event.clientY && event.clientY <= rect.bottom &&
            rect.left <= event.clientX && event.clientX <= rect.right;
        if (!inside) closeModal();
    });
}
