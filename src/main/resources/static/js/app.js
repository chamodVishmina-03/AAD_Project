/* ============================================================
   LIVE DATA — talks to the real Spring Boot backend.
   GET /api/hotels, /api/rooms/hotel/{id}, /api/room-types
   are all public endpoints (see SecurityConfig), so the
   homepage works without logging in.
   ============================================================ */
const API_BASE = ""; // same origin as the Spring Boot app; e.g. "http://localhost:8080" if opened separately

const gradients = {
    indigo:  "linear-gradient(135deg,#4F46E5,#7C3AED)",
    teal:    "linear-gradient(135deg,#0EA5A4,#0284C7)",
    amber:   "linear-gradient(135deg,#F59E0B,#DC2626)",
    sky:     "linear-gradient(135deg,#0EA5E9,#4F46E5)",
    rose:    "linear-gradient(135deg,#EC4899,#7C3AED)",
};
const gradientList = Object.values(gradients);

let hotels = [];          // populated from GET /api/hotels (+ rooms per hotel)
let roomTypesCache = [];  // populated from GET /api/room-types

function fmtLKR(n){ return "LKR " + Number(n).toLocaleString("en-LK"); }
function roomTypeInfo(name){
    return roomTypesCache.find(t => t.name === name)
        || { name, description: "", maxOccupancy: 2 };
}
function typeIconSvg(){
    return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 18v-7a2 2 0 012-2h14a2 2 0 012 2v7M3 18h18M3 18v2M21 18v2M7 9V6a2 2 0 012-2h6a2 2 0 012 2v3"/></svg>`;
}

async function loadPublicRoomTypes(){
    try {
        const res = await fetch(`${API_BASE}/api/room-types`);
        roomTypesCache = res.ok ? await res.json() : [];
    } catch (e) { roomTypesCache = []; }
}

async function loadPublicHotels(){
    const grid = document.getElementById("hotel-grid");
    const empty = document.getElementById("hotel-grid-empty");
    empty.style.display = "none";
    grid.innerHTML = `<div class="empty-state">Loading hotels…</div>`;

    try {
        const res = await fetch(`${API_BASE}/api/hotels`);
        if (!res.ok) throw new Error("Could not load hotels.");
        const raw = await res.json();

        hotels = await Promise.all(raw.map(async (h, i) => {
            let rooms = [];
            try {
                const rRes = await fetch(`${API_BASE}/api/rooms/hotel/${h.id}`);
                rooms = rRes.ok ? await rRes.json() : [];
            } catch (e) { rooms = []; }
            return {
                id: h.id,
                name: h.name,
                city: h.cityName,
                country: h.country,
                address: h.address,
                phone: h.phone,
                email: h.email,
                starRating: h.starRating,
                description: h.description,
                grad: gradientList[i % gradientList.length],
                rooms: rooms.map(r => ({
                    roomNumber: r.roomNumber,
                    floorNo: r.floorNo,
                    roomType: r.roomType,
                    pricePerNight: r.pricePerNight,
                    status: r.status,
                    amenities: r.amenities ? Array.from(r.amenities) : []
                }))
            };
        }));
    } catch (e) {
        hotels = [];
        grid.innerHTML = "";
        empty.style.display = "block";
        empty.textContent = "Could not reach the server. Is the backend running?";
        renderStats();
        return;
    }

    populateCitySelect();
    renderHotelGrid();
    renderStats();
}

/* ---- render: home grid ---- */
let currentCityFilter = "";

function renderHotelGrid(){
    const grid = document.getElementById("hotel-grid");
    const empty = document.getElementById("hotel-grid-empty");
    const filtered = currentCityFilter ? hotels.filter(h => h.city === currentCityFilter) : hotels;

    if (filtered.length === 0) {
        grid.innerHTML = "";
        empty.textContent = hotels.length === 0
            ? "No hotels yet — check back soon."
            : "No hotels match that city — try clearing the search.";
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";

    grid.innerHTML = filtered.map(h => {
        const cheapest = h.rooms.length ? Math.min(...h.rooms.map(r => r.pricePerNight)) : null;
        const initials = h.name.split(" ").map(w => w[0]).slice(0,2).join("");
        return `
    <div class="hotel-card" data-id="${h.id}">
      <div class="hotel-banner" style="background:${h.grad};">
        <span class="monogram">${initials}</span>
        <span class="rating-badge">★ ${h.starRating != null ? h.starRating : "—"}</span>
      </div>
      <div class="hotel-body">
        <div class="hotel-name">${h.name}</div>
        <div class="hotel-city">
          <svg class="icon" style="width:12px;height:12px;" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${h.city || "—"}${h.country ? ", " + h.country : ""}
        </div>
        <div class="hotel-desc">${h.description || ""}</div>
        <div class="hotel-footer">
          <div class="price">${cheapest != null ? fmtLKR(cheapest) : "No rooms yet"}${cheapest != null ? "<span> / night</span>" : ""}</div>
          <div class="view-btn">View rooms →</div>
        </div>
      </div>
    </div>`;
    }).join("");

    grid.querySelectorAll(".hotel-card").forEach(card => {
        card.addEventListener("click", () => openHotel(Number(card.dataset.id)));
    });
}

function populateCitySelect(){
    const cities = [...new Set(hotels.map(h => h.city).filter(Boolean))];
    const sel = document.getElementById("search-city");
    sel.innerHTML = `<option value="">All cities</option>` + cities.map(c => `<option value="${c}">${c}</option>`).join("");
}

document.getElementById("search-btn").addEventListener("click", () => {
    currentCityFilter = document.getElementById("search-city").value;
    renderHotelGrid();
    document.getElementById("hotel-grid").scrollIntoView({ behavior: "smooth", block: "start" });
});

function renderStats(){
    document.getElementById("stat-hotels").textContent = hotels.length;
    const allRooms = hotels.flatMap(h => h.rooms);
    document.getElementById("stat-rooms").textContent = allRooms.length;
    document.getElementById("stat-available").textContent = allRooms.filter(r => r.status === "AVAILABLE").length;
}

/* ---- render: detail view ---- */
let currentHotel = null;

function openHotel(id){
    const h = hotels.find(x => x.id === id);
    if (!h) return;
    currentHotel = h;

    document.getElementById("d-banner").style.background = h.grad;
    document.getElementById("d-eyebrow").textContent = `${h.city || "—"} · ${h.country || "—"}`;
    document.getElementById("d-name").textContent = h.name;
    document.getElementById("d-desc").textContent = h.description || "";
    document.getElementById("d-rating").innerHTML = `★ ${h.starRating != null ? h.starRating : "—"} rating`;
    document.getElementById("d-address").textContent = h.address || "—";
    document.getElementById("d-phone").textContent = h.phone || "—";
    document.getElementById("d-email").textContent = h.email || "—";

    const tbody = document.querySelector("#rooms-table tbody");
    tbody.innerHTML = h.rooms.length ? h.rooms.map(r => `
    <tr>
      <td class="mono-cell">${r.roomNumber}</td>
      <td class="mono-cell">${r.floorNo != null ? r.floorNo : "—"}</td>
      <td>${r.roomType}</td>
      <td class="mono-cell">${fmtLKR(r.pricePerNight)}</td>
      <td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
      <td>${r.amenities.map(a => `<span class="amenity-tag">${a}</span>`).join("")}</td>
    </tr>
  `).join("") : `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No rooms added for this hotel yet.</td></tr>`;

    const usedTypes = [...new Set(h.rooms.map(r => r.roomType))];
    const typeWrap = document.getElementById("type-cards");
    typeWrap.innerHTML = usedTypes.length ? usedTypes.map(tn => {
        const t = roomTypeInfo(tn);
        const priced = h.rooms.filter(r => r.roomType === tn);
        const min = Math.min(...priced.map(r => r.pricePerNight));
        return `
      <div class="type-card">
        <div class="icon-wrap">${typeIconSvg()}</div>
        <div class="tname">${t.name}</div>
        <div class="tdesc">${t.description || ""}</div>
        <div class="tfoot"><span class="cap">Max ${t.maxOccupancy || 1} guest${(t.maxOccupancy || 1) > 1 ? "s" : ""}</span><span class="price">from ${fmtLKR(min)}</span></div>
      </div>`;
    }).join("") : "";

    showView("detail");
}

function showView(name){
    document.getElementById("view-home").classList.toggle("active", name === "home");
    document.getElementById("view-detail").classList.toggle("active", name === "detail");
    document.getElementById("view-admin").classList.toggle("active", name === "admin");
    if (name === "home") currentHotel = null;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("back-link").addEventListener("click", () => showView("home"));
document.getElementById("brand-home").addEventListener("click", () => showView("home"));
document.getElementById("nav-hotels").addEventListener("click", () => showView("home"));
document.getElementById("nav-contact").addEventListener("click", () => {
    showView("home");
    document.getElementById("contact-home").scrollIntoView({ behavior: "smooth" });
});

Promise.all([loadPublicRoomTypes(), loadPublicHotels()]);

/* ============================================================
   AUTH — talks to the real Spring Boot backend
   (POST /api/auth/login, POST /api/auth/register).
   Requires the backend running with its database configured,
   since this file is served from src/main/resources/static/.
   ============================================================ */
let session = null;

function loadSession(){
    try {
        const raw = localStorage.getItem("ceylon_session");
        if (raw) session = JSON.parse(raw);
    } catch (e) { session = null; }
    renderAuthState();
}
function saveSession(data){
    session = data;
    localStorage.setItem("ceylon_session", JSON.stringify(data));
    renderAuthState();
}
function clearSession(){
    session = null;
    localStorage.removeItem("ceylon_session");
    renderAuthState();
}

function renderAuthState(){
    const buttons = document.getElementById("auth-buttons");
    const chip = document.getElementById("user-chip");
    if (session) {
        buttons.style.display = "none";
        chip.style.display = "flex";
        document.getElementById("user-name").textContent = session.fullName;
        document.getElementById("user-role").textContent = (session.roles && session.roles[0]) || "GUEST";
        document.getElementById("user-avatar").textContent = session.fullName.trim().charAt(0).toUpperCase();
        document.getElementById("admin-whoami").textContent = session.fullName;
    } else {
        buttons.style.display = "flex";
        chip.style.display = "none";
        document.getElementById("user-menu").classList.remove("open");
    }
}

function showToast(text){
    const t = document.getElementById("toast");
    t.textContent = text;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2600);
}

function openModal(id){ document.getElementById(id).classList.add("open"); }
function closeModal(id){ document.getElementById(id).classList.remove("open"); }

document.getElementById("open-login").addEventListener("click", () => openModal("login-overlay"));
document.getElementById("open-register").addEventListener("click", () => openModal("register-overlay"));
document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => btn.closest(".modal-overlay").classList.remove("open"));
});
document.querySelectorAll(".modal-overlay").forEach(ov => {
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.remove("open"); });
});
document.getElementById("switch-to-register").addEventListener("click", () => { closeModal("login-overlay"); openModal("register-overlay"); });
document.getElementById("switch-to-login").addEventListener("click", () => { closeModal("register-overlay"); openModal("login-overlay"); });

document.getElementById("user-avatar").addEventListener("click", () => {
    document.getElementById("user-menu").classList.toggle("open");
});
document.addEventListener("click", (e) => {
    const chip = document.getElementById("user-chip");
    if (!chip.contains(e.target)) document.getElementById("user-menu").classList.remove("open");
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("login-error");
    errEl.classList.remove("show");
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || "Invalid email or password.");
        }
        const data = await res.json();
        saveSession(data);
        closeModal("login-overlay");
        document.getElementById("login-form").reset();
        showToast(`Welcome back, ${data.fullName.split(" ")[0]}.`);
    } catch (err) {
        errEl.textContent = err.message || "Could not reach the server. Is the backend running?";
        errEl.classList.add("show");
    }
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("register-error");
    errEl.classList.remove("show");
    const fullName = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();
    const password = document.getElementById("reg-password").value;

    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, email, password, phone })
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || "Could not create that account.");
        }
        const data = await res.json();
        saveSession(data);
        closeModal("register-overlay");
        document.getElementById("register-form").reset();
        showToast(`Account created — welcome, ${data.fullName.split(" ")[0]}.`);
    } catch (err) {
        errEl.textContent = err.message || "Could not reach the server. Is the backend running?";
        errEl.classList.add("show");
    }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
    if (session && session.refreshToken) {
        try {
            await fetch(`${API_BASE}/api/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken: session.refreshToken })
            });
        } catch (e) { /* backend unreachable — clear locally anyway */ }
    }
    clearSession();
    showToast("Logged out.");
    showView("home");
});

function authFetch(path, options = {}){
    const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    if (session && session.accessToken) headers["Authorization"] = `Bearer ${session.accessToken}`;
    return fetch(`${API_BASE}${path}`, Object.assign({}, options, { headers }));
}

loadSession();

/* ============================================================
   ADMIN PANEL — CRUD against the real backend.
   Only shown to logged-in users with ADMIN or STAFF role.
   ============================================================ */
let apiCities = [];
let apiRoomTypesReal = [];
let apiHotels = [];
let selectedRoomHotelId = null;

function isStaffOrAdmin(){
    return !!(session && session.roles && session.roles.some(r => r === "ADMIN" || r === "STAFF" || r === "ROLE_ADMIN" || r === "ROLE_STAFF"));
}
function isAdmin(){
    return !!(session && session.roles && session.roles.some(r => r === "ADMIN" || r === "ROLE_ADMIN"));
}

function refreshAdminNavVisibility(){
    const show = isStaffOrAdmin();
    document.getElementById("nav-admin").style.display = show ? "inline-flex" : "none";
    document.getElementById("admin-menu-link").style.display = show ? "block" : "none";
}

const _origRenderAuthState = renderAuthState;
renderAuthState = function(){
    _origRenderAuthState();
    refreshAdminNavVisibility();
    if (!isStaffOrAdmin() && document.getElementById("view-admin").classList.contains("active")) {
        showView("home");
    }
};
refreshAdminNavVisibility();

function enterAdmin(){
    if (!isStaffOrAdmin()) return;
    document.getElementById("user-menu").classList.remove("open");
    showView("admin");
    loadAdminHotels();
}
document.getElementById("nav-admin").addEventListener("click", enterAdmin);
document.getElementById("admin-menu-link").addEventListener("click", enterAdmin);
document.getElementById("admin-back-link").addEventListener("click", () => showView("home"));

document.getElementById("tab-hotels").addEventListener("click", () => setAdminTab("hotels"));
document.getElementById("tab-rooms").addEventListener("click", () => setAdminTab("rooms"));

function setAdminTab(tab){
    document.getElementById("tab-hotels").classList.toggle("active", tab === "hotels");
    document.getElementById("tab-rooms").classList.toggle("active", tab === "rooms");
    document.getElementById("panel-hotels").classList.toggle("active", tab === "hotels");
    document.getElementById("panel-rooms").classList.toggle("active", tab === "rooms");
    document.getElementById("admin-panel-title").textContent = tab === "hotels" ? "Hotels" : "Rooms";
    if (tab === "rooms" && apiHotels.length === 0) loadAdminHotels();
}

async function loadCities(){
    try {
        const res = await fetch(`${API_BASE}/api/cities`);
        apiCities = res.ok ? await res.json() : [];
    } catch (e) { apiCities = []; }
    const sel = document.getElementById("hotel-city");
    sel.innerHTML = apiCities.map(c => `<option value="${c.id}">${c.name}, ${c.country}</option>`).join("")
        || `<option value="">No cities found — add one via /api/cities</option>`;
}

async function loadRoomTypesReal(){
    try {
        const res = await fetch(`${API_BASE}/api/room-types`);
        apiRoomTypesReal = res.ok ? await res.json() : [];
    } catch (e) { apiRoomTypesReal = []; }
    const sel = document.getElementById("room-type");
    sel.innerHTML = apiRoomTypesReal.map(t => `<option value="${t.id}">${t.name}</option>`).join("")
        || `<option value="">No room types found — add one via /api/room-types</option>`;
}

async function loadAdminHotels(){
    try {
        const res = await fetch(`${API_BASE}/api/hotels`);
        apiHotels = res.ok ? await res.json() : [];
    } catch (e) { apiHotels = []; }
    renderAdminHotels();
    renderRoomHotelSelect();
}

const editIconSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`;
const trashIconSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>`;

function renderAdminHotels(){
    const tbody = document.querySelector("#admin-hotels-table tbody");
    const empty = document.getElementById("admin-hotels-empty");
    if (apiHotels.length === 0) {
        tbody.innerHTML = "";
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";
    tbody.innerHTML = apiHotels.map(h => `
    <tr>
      <td style="font-weight:600;">${h.name}</td>
      <td>${h.cityName || "—"}</td>
      <td>${h.address || "—"}</td>
      <td class="mono-cell">${h.starRating != null ? "★ " + h.starRating : "—"}</td>
      <td class="mono-cell">${h.phone || "—"}</td>
      <td class="row-actions">
        <button class="icon-btn" data-edit="${h.id}" type="button" title="Edit">${editIconSvg}</button>
        ${isAdmin() ? `<button class="icon-btn danger" data-delete="${h.id}" type="button" title="Delete">${trashIconSvg}</button>` : ""}
      </td>
    </tr>
  `).join("");

    tbody.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => openHotelModal(apiHotels.find(h => h.id === Number(btn.dataset.edit))));
    });
    tbody.querySelectorAll("[data-delete]").forEach(btn => {
        btn.addEventListener("click", () => deleteHotel(Number(btn.dataset.delete)));
    });
}

document.getElementById("add-hotel-btn").addEventListener("click", () => openHotelModal(null));

async function openHotelModal(hotel){
    await loadCities();
    const errEl = document.getElementById("hotel-error");
    errEl.classList.remove("show");
    document.getElementById("hotel-form").reset();

    if (hotel) {
        document.getElementById("hotel-modal-eyebrow").textContent = "Admin · Edit hotel";
        document.getElementById("hotel-modal-title").textContent = "Edit hotel";
        document.getElementById("hotel-id").value = hotel.id;
        document.getElementById("hotel-name").value = hotel.name || "";
        document.getElementById("hotel-description").value = hotel.description || "";
        document.getElementById("hotel-address").value = hotel.address || "";
        document.getElementById("hotel-rating").value = hotel.starRating || "";
        document.getElementById("hotel-phone").value = hotel.phone || "";
        document.getElementById("hotel-email").value = hotel.email || "";
        const match = apiCities.find(c => c.name === hotel.cityName);
        if (match) document.getElementById("hotel-city").value = match.id;
    } else {
        document.getElementById("hotel-modal-eyebrow").textContent = "Admin · New hotel";
        document.getElementById("hotel-modal-title").textContent = "Add hotel";
        document.getElementById("hotel-id").value = "";
    }
    openModal("hotel-modal-overlay");
}

document.getElementById("hotel-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("hotel-error");
    errEl.classList.remove("show");
    const id = document.getElementById("hotel-id").value;
    const payload = {
        name: document.getElementById("hotel-name").value.trim(),
        description: document.getElementById("hotel-description").value.trim(),
        address: document.getElementById("hotel-address").value.trim(),
        cityId: Number(document.getElementById("hotel-city").value),
        starRating: document.getElementById("hotel-rating").value ? Number(document.getElementById("hotel-rating").value) : null,
        phone: document.getElementById("hotel-phone").value.trim(),
        email: document.getElementById("hotel-email").value.trim(),
    };
    try {
        const res = await authFetch(id ? `/api/hotels/${id}` : "/api/hotels", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || "Could not save the hotel.");
        }
        closeModal("hotel-modal-overlay");
        showToast(id ? "Hotel updated." : "Hotel added.");
        loadAdminHotels();
    } catch (err) {
        errEl.textContent = err.message || "Could not reach the server.";
        errEl.classList.add("show");
    }
});

async function deleteHotel(id){
    if (!confirm("Delete this hotel? This cannot be undone.")) return;
    try {
        const res = await authFetch(`/api/hotels/${id}`, { method: "DELETE" });
        if (!res.ok && res.status !== 204) throw new Error("Could not delete the hotel.");
        showToast("Hotel deleted.");
        loadAdminHotels();
    } catch (err) {
        showToast(err.message || "Could not delete the hotel.");
    }
}

function renderRoomHotelSelect(){
    const sel = document.getElementById("room-hotel-select");
    const current = sel.value;
    sel.innerHTML = `<option value="">Select a hotel…</option>` + apiHotels.map(h => `<option value="${h.id}">${h.name}</option>`).join("");
    if (current) sel.value = current;
}

document.getElementById("room-hotel-select").addEventListener("change", (e) => {
    selectedRoomHotelId = e.target.value ? Number(e.target.value) : null;
    document.getElementById("add-room-btn").disabled = !selectedRoomHotelId;
    if (selectedRoomHotelId) loadAdminRooms(selectedRoomHotelId);
    else {
        document.querySelector("#admin-rooms-table tbody").innerHTML = "";
        document.getElementById("admin-rooms-empty").style.display = "block";
        document.getElementById("admin-rooms-empty").textContent = "Pick a hotel above to see and manage its rooms.";
    }
});

let apiRoomsForHotel = [];
async function loadAdminRooms(hotelId){
    try {
        const res = await fetch(`${API_BASE}/api/rooms/hotel/${hotelId}`);
        apiRoomsForHotel = res.ok ? await res.json() : [];
    } catch (e) { apiRoomsForHotel = []; }
    renderAdminRooms();
}

function renderAdminRooms(){
    const tbody = document.querySelector("#admin-rooms-table tbody");
    const empty = document.getElementById("admin-rooms-empty");
    if (apiRoomsForHotel.length === 0) {
        tbody.innerHTML = "";
        empty.textContent = "This hotel has no rooms yet — add the first one above.";
        empty.style.display = "block";
        return;
    }
    empty.style.display = "none";
    tbody.innerHTML = apiRoomsForHotel.map(r => `
    <tr>
      <td class="mono-cell">${r.roomNumber}</td>
      <td class="mono-cell">${r.floorNo != null ? r.floorNo : "—"}</td>
      <td>${r.roomType}</td>
      <td class="mono-cell">${fmtLKR(r.pricePerNight)}</td>
      <td><span class="badge badge-${(r.status || "available").toLowerCase()}">${r.status}</span></td>
      <td class="row-actions">
        <button class="icon-btn" data-edit="${r.id}" type="button" title="Edit">${editIconSvg}</button>
        <button class="icon-btn danger" data-delete="${r.id}" type="button" title="Delete">${trashIconSvg}</button>
      </td>
    </tr>
  `).join("");

    tbody.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => openRoomModal(apiRoomsForHotel.find(r => r.id === Number(btn.dataset.edit))));
    });
    tbody.querySelectorAll("[data-delete]").forEach(btn => {
        btn.addEventListener("click", () => deleteRoom(Number(btn.dataset.delete)));
    });
}

document.getElementById("add-room-btn").addEventListener("click", () => openRoomModal(null));

async function openRoomModal(room){
    await loadRoomTypesReal();
    const errEl = document.getElementById("room-error");
    errEl.classList.remove("show");
    document.getElementById("room-form").reset();

    if (room) {
        document.getElementById("room-modal-eyebrow").textContent = "Admin · Edit room";
        document.getElementById("room-modal-title").textContent = "Edit room";
        document.getElementById("room-id").value = room.id;
        document.getElementById("room-number").value = room.roomNumber || "";
        document.getElementById("room-floor").value = room.floorNo != null ? room.floorNo : "";
        document.getElementById("room-price").value = room.pricePerNight || "";
        const match = apiRoomTypesReal.find(t => t.name === room.roomType);
        if (match) document.getElementById("room-type").value = match.id;
    } else {
        document.getElementById("room-modal-eyebrow").textContent = "Admin · New room";
        document.getElementById("room-modal-title").textContent = "Add room";
        document.getElementById("room-id").value = "";
    }
    openModal("room-modal-overlay");
}

document.getElementById("room-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errEl = document.getElementById("room-error");
    errEl.classList.remove("show");
    if (!selectedRoomHotelId) { errEl.textContent = "Pick a hotel first."; errEl.classList.add("show"); return; }
    const id = document.getElementById("room-id").value;
    const payload = {
        hotelId: selectedRoomHotelId,
        roomTypeId: Number(document.getElementById("room-type").value),
        roomNumber: document.getElementById("room-number").value.trim(),
        floorNo: document.getElementById("room-floor").value ? Number(document.getElementById("room-floor").value) : null,
        pricePerNight: Number(document.getElementById("room-price").value),
        amenityIds: []
    };
    try {
        const res = await authFetch(id ? `/api/rooms/${id}` : "/api/rooms", {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.message || "Could not save the room.");
        }
        closeModal("room-modal-overlay");
        showToast(id ? "Room updated." : "Room added.");
        loadAdminRooms(selectedRoomHotelId);
    } catch (err) {
        errEl.textContent = err.message || "Could not reach the server.";
        errEl.classList.add("show");
    }
});

async function deleteRoom(id){
    if (!confirm("Delete this room? This cannot be undone.")) return;
    try {
        const res = await authFetch(`/api/rooms/${id}`, { method: "DELETE" });
        if (!res.ok && res.status !== 204) throw new Error("Could not delete the room.");
        showToast("Room deleted.");
        loadAdminRooms(selectedRoomHotelId);
    } catch (err) {
        showToast(err.message || "Could not delete the room.");
    }
}

/* ============================================================
   RULE-BASED CHATBOT
   Plain if/else keyword matching — no external AI call.
   Aware of which hotel (if any) is currently open.
   ============================================================ */
const chatToggle = document.getElementById("chat-toggle");
const chatPanel  = document.getElementById("chat-panel");
const chatClose  = document.getElementById("chat-close");
const messages   = document.getElementById("chat-messages");
const quickReplies = document.getElementById("quick-replies");

chatToggle.addEventListener("click", () => {
    chatPanel.classList.add("open");
    if (messages.children.length === 0) {
        addMessage("bot", "Ayubowan! I'm the Ceylon Collection concierge. Ask me about check-in time, room prices, Wi-Fi, or our hotel locations — or tap a question below.");
    }
});
chatClose.addEventListener("click", () => chatPanel.classList.remove("open"));

const suggestions = [
    "What time is check-in?",
    "How much is a room?",
    "Which hotels do you have?",
    "Where is this hotel?"
];
quickReplies.innerHTML = suggestions.map(q => `<button class="qr-btn" type="button">${q}</button>`).join("");
quickReplies.querySelectorAll(".qr-btn").forEach(btn => {
    btn.addEventListener("click", () => handleUserMessage(btn.textContent));
});

document.getElementById("chat-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("chat-input");
    const text = input.value.trim();
    if (!text) return;
    handleUserMessage(text);
    input.value = "";
});

function addMessage(who, text){
    const div = document.createElement("div");
    div.className = "msg " + who;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function handleUserMessage(rawText){
    addMessage("user", rawText);
    const reply = getBotReply(rawText);
    setTimeout(() => addMessage("bot", reply), 350);
}

function getBotReply(rawText){
    const msg = rawText.toLowerCase();

    if (msg.includes("check-in") || msg.includes("check in") || msg.includes("checkin")) {
        return "Check-in is from 2:00 PM at every Ceylon Collection property. Early check-in is possible if a room is ready.";
    }
    else if (msg.includes("check-out") || msg.includes("check out") || msg.includes("checkout")) {
        return "Check-out is by 11:00 AM. Late check-out until 1:00 PM is free for Suite guests.";
    }
    else if (msg.includes("price") || msg.includes("rate") || msg.includes("cost") || msg.includes("how much")) {
        if (currentHotel) {
            const min = Math.min(...currentHotel.rooms.map(r => r.pricePerNight));
            const max = Math.max(...currentHotel.rooms.map(r => r.pricePerNight));
            return `At ${currentHotel.name}, rates range from ${fmtLKR(min)} to ${fmtLKR(max)} per night. See the Rooms table above for each room.`;
        }
        return "Rates vary by property, roughly LKR 6,500 to LKR 34,000 per night. Open a hotel to see its exact prices.";
    }
    else if (msg.includes("wifi") || msg.includes("wi-fi") || msg.includes("internet")) {
        return "Yes — free high-speed Wi-Fi is included in every room across all our hotels.";
    }
    else if (msg.includes("which hotel") || msg.includes("hotels do you") || msg.includes("list of hotel") || msg.includes("locations")) {
        return "We manage 5 properties: " + hotels.map(h => `${h.name} (${h.city})`).join(", ") + ".";
    }
    else if (msg.includes("this hotel") || (currentHotel && (msg.includes("location") || msg.includes("address") || msg.includes("where")))) {
        if (currentHotel) return `${currentHotel.name} is located at ${currentHotel.address}.`;
        return "Open a hotel first, then ask again and I'll give you its exact address.";
    }
    else if (msg.includes("location") || msg.includes("address") || msg.includes("where")) {
        return "Our head office is at 12 Galle Face Terrace, Colombo 03. Open a specific hotel to see its own address.";
    }
    else if (msg.includes("phone") || msg.includes("contact") || msg.includes("number")) {
        if (currentHotel) return `You can reach ${currentHotel.name} on ${currentHotel.phone} or ${currentHotel.email}.`;
        return "Head office reservations: +94 11 234 5678, reservations@ceyloncollection.lk.";
    }
    else if (msg.includes("available") || msg.includes("vacant") || (msg.includes("room") && msg.includes("free"))) {
        if (currentHotel) {
            const free = currentHotel.rooms.filter(r => r.status === "AVAILABLE").length;
            return `${currentHotel.name} currently has ${free} rooms marked AVAILABLE.`;
        }
        const free = hotels.flatMap(h => h.rooms).filter(r => r.status === "AVAILABLE").length;
        return `${free} rooms are marked AVAILABLE across all properties right now.`;
    }
    else if (msg.includes("login") || msg.includes("log in") || msg.includes("sign up") || msg.includes("register") || msg.includes("account")) {
        return session
            ? `You're logged in as ${session.fullName}. Use the account menu at the top-right to sign out.`
            : "Use the \"Log in\" or \"Sign up\" button at the top-right to create or access your account.";
    }
    else if (msg.includes("hi") || msg.includes("hello") || msg.includes("ayubowan")) {
        return "Ayubowan! How can I help — check-in time, room prices, Wi-Fi, or our hotel locations?";
    }
    else if (msg.includes("thank")) {
        return "You're most welcome! Anything else I can help with?";
    }
    else {
        return "I didn't quite catch that. I can help with: check-in/check-out time, room prices, Wi-Fi, hotel locations, or contact details.";
    }
}