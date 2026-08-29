// configuration and globle data

const API_BASE = "";

const GRADIENT_COUNT = 5;

let hotels = [];
let roomTypesCache = [];
let currentCityFilter = "";
let currentHotel = null;

let session = null;





// helper function

function fmtLKR(n) {
    return "LKR " + Number(n).toLocaleString("en-LK");
}

function roomTypeInfo(name) {
    return roomTypesCache.find(t => t.name === name) || {
        name,
        description: "",
        maxOccupancy: 2
    };
}


function showToast(text) {
    const toast = document.getElementById("toast");

    toast.textContent = text;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function openModal(id) {
    document.getElementById(id).classList.add("open");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("open");
}








// ajax calls XMLHttpRequest object and get data from backend

function ajaxRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const method = options.method || "GET";
        const xhr = new XMLHttpRequest();

        xhr.open(method, url, true);

        const headers = options.headers || {};
        Object.keys(headers).forEach(key => {
            xhr.setRequestHeader(key, headers[key]);
        });

        xhr.onload = function () {
            const status = xhr.status;
            const ok = status >= 200 && status < 300;

            resolve({
                ok,
                status,
                json: function () {
                    return new Promise((res, rej) => {
                        try {
                            res(xhr.responseText ? JSON.parse(xhr.responseText) : {});
                        } catch (e) {
                            rej(e);
                        }
                    });
                }
            });
        };

        xhr.onerror = function () {
            reject(new Error("Network error — could not reach the server."));
        };

        xhr.send(options.body || null);
    });
}








// public data roomtype

async function loadPublicRoomTypes() {
    try {
        const res = await ajaxRequest(`${API_BASE}/api/room-types`);

        roomTypesCache = res.ok
            ? await res.json()
            : [];

    } catch (e) {
        roomTypesCache = [];
    }
}





// public data hotels

async function loadPublicHotels() {

    const grid = document.getElementById("hotel-grid");
    const empty = document.getElementById("hotel-grid-empty");

    empty.classList.add("is-hidden");

    grid.replaceChildren();
    const loading = document.createElement("div");
    loading.className = "empty-state";
    loading.textContent = "Loading hotels…";
    grid.appendChild(loading);

    try {

        const res = await ajaxRequest(`${API_BASE}/api/hotels`);

        if (!res.ok) {
            throw new Error("Could not load hotels.");
        }

        const raw = await res.json();

        hotels = await Promise.all(
            raw.map(async (h, i) => {

                let rooms = [];

                try {

                    const rRes = await ajaxRequest(
                        `${API_BASE}/api/rooms/hotel/${h.id}`
                    );

                    rooms = rRes.ok
                        ? await rRes.json()
                        : [];

                } catch (e) {
                    rooms = [];
                }

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

                    gradientClass: `gradient-${i % GRADIENT_COUNT}`,

                    rooms: rooms.map(r => ({
                        id: r.id,
                        roomNumber: r.roomNumber,
                        floorNo: r.floorNo,
                        roomType: r.roomType,
                        pricePerNight: r.pricePerNight,
                        status: r.status,
                        amenities: r.amenities
                            ? Array.from(r.amenities)
                            : []
                    }))
                };
            })
        );

    } catch (e) {

        hotels = [];

        grid.replaceChildren();

        empty.classList.remove("is-hidden");

        empty.textContent =
            "Could not reach the server. Is the backend running?";

        renderStats();

        return;
    }

    populateCitySelect();
    renderHotelGrid();
    renderStats();
}








// Home page Hotel grid

function renderHotelGrid() {
    const grid = document.getElementById("hotel-grid");
    const empty = document.getElementById("hotel-grid-empty");
    const template = document.getElementById("hotel-card-template");

    const filtered = currentCityFilter
        ? hotels.filter(h => h.city === currentCityFilter)
        : hotels;

    grid.replaceChildren();

    if (filtered.length === 0) {
        empty.textContent = hotels.length === 0
            ? "No hotels yet — check back soon."
            : "No hotels match that city — try clearing the search.";
        empty.classList.add("is-visible");
        empty.classList.remove("is-hidden");
        return;
    }

    empty.classList.add("is-hidden");
    empty.classList.remove("is-visible");

    filtered.forEach(h => {
        const card = template.content.cloneNode(true);
        const root = card.querySelector(".hotel-card");
        const banner = card.querySelector(".hotel-banner");
        const cheapest = h.rooms.length
            ? Math.min(...h.rooms.map(r => r.pricePerNight))
            : null;
        const initials = h.name
            .split(" ")
            .map(w => w[0])
            .slice(0, 2)
            .join("");

        root.dataset.id = h.id;
        banner.classList.add(h.gradientClass);
        card.querySelector(".monogram").textContent = initials;
        card.querySelector(".rating-badge").textContent = `★ ${h.starRating != null ? h.starRating : "—"}`;
        card.querySelector(".hotel-name").textContent = h.name;
        card.querySelector(".hotel-location-text").textContent = `${h.city || "—"}${h.country ? ", " + h.country : ""}`;
        card.querySelector(".hotel-desc").textContent = h.description || "";
        card.querySelector(".price").textContent = cheapest != null ? `${fmtLKR(cheapest)} / night` : "No rooms yet";

        root.addEventListener("click", () => openHotel(Number(root.dataset.id)));
        grid.appendChild(card);
    });
}








// Home page city filter

function populateCitySelect() {

    const cities = [
        ...new Set(
            hotels
                .map(h => h.city)
                .filter(Boolean)
        )
    ];

    const select =
        document.getElementById("search-city");

    select.innerHTML =
        `<option value="">All cities</option>` +
        cities
            .map(
                c =>
                    `<option value="${c}">
                        ${c}
                    </option>`
            )
            .join("");
}

document
    .getElementById("search-btn")
    .addEventListener("click", () => {

        currentCityFilter =
            document.getElementById(
                "search-city"
            ).value;

        renderHotelGrid();

        document
            .getElementById("hotel-grid")
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
    });







// home filter tabs update

function renderStats() {

    document.getElementById(
        "stat-hotels"
    ).textContent = hotels.length;

    const allRooms =
        hotels.flatMap(h => h.rooms);

    document.getElementById(
        "stat-rooms"
    ).textContent = allRooms.length;

    document.getElementById(
        "stat-available"
    ).textContent =
        allRooms.filter(
            r => r.status === "AVAILABLE"
        ).length;
}





// hotel details view

function openHotel(id) {

    const hotel =
        hotels.find(h => h.id === id);

    if (!hotel) return;

    currentHotel = hotel;

    const detailBanner = document.getElementById("d-banner");
    detailBanner.classList.remove(
        "gradient-0", "gradient-1", "gradient-2", "gradient-3", "gradient-4"
    );
    detailBanner.classList.add(hotel.gradientClass);

    document.getElementById(
        "d-eyebrow"
    ).textContent =
        `${hotel.city || "—"} · ${hotel.country || "—"}`;

    document.getElementById(
        "d-name"
    ).textContent = hotel.name;

    document.getElementById(
        "d-desc"
    ).textContent =
        hotel.description || "";

    document.getElementById("d-rating").textContent =
        `★ ${hotel.starRating != null ? hotel.starRating : "—"} rating`;

    document.getElementById(
        "d-address"
    ).textContent =
        hotel.address || "—";

    document.getElementById(
        "d-phone"
    ).textContent =
        hotel.phone || "—";

    document.getElementById(
        "d-email"
    ).textContent =
        hotel.email || "—";


    /* ---------- Room Table ---------- */
    const tbody = document.querySelector("#rooms-table tbody");
    const roomTemplate = document.getElementById("room-row-template");
    const emptyRoomTemplate = document.getElementById("room-empty-row-template");
    tbody.replaceChildren();

    if (!hotel.rooms.length) {
        tbody.appendChild(emptyRoomTemplate.content.cloneNode(true));
    } else {
        hotel.rooms.forEach(room => {
            const row = roomTemplate.content.cloneNode(true);
            row.querySelector(".room-number").textContent = room.roomNumber;
            row.querySelector(".room-floor").textContent = room.floorNo != null ? room.floorNo : "—";
            row.querySelector(".room-type").textContent = room.roomType;
            row.querySelector(".room-price").textContent = fmtLKR(room.pricePerNight);
            const status = row.querySelector(".room-status");
            status.classList.add(`badge-${(room.status || "").toLowerCase()}`);
            status.textContent = room.status;

            const amenities = row.querySelector(".room-amenities");
            (room.amenities || []).forEach(amenity => {
                const tag = document.createElement("span");
                tag.className = "amenity-tag";
                tag.textContent = amenity;
                amenities.appendChild(tag);
            });
            tbody.appendChild(row);
        });
    }

    /* ---------- Room Categories ---------- */
    const usedTypes = [...new Set(hotel.rooms.map(r => r.roomType))];
    const typeWrap = document.getElementById("type-cards");
    const typeTemplate = document.getElementById("type-card-template");
    typeWrap.replaceChildren();

    usedTypes.forEach(typeName => {
        const type = roomTypeInfo(typeName);
        const priced = hotel.rooms.filter(r => r.roomType === typeName);
        const min = Math.min(...priced.map(r => r.pricePerNight));
        const maxGuests = type.maxOccupancy || 1;
        const card = typeTemplate.content.cloneNode(true);

        card.querySelector(".tname").textContent = type.name;
        card.querySelector(".tdesc").textContent = type.description || "";
        card.querySelector(".cap").textContent = `Max ${maxGuests} guest${maxGuests > 1 ? "s" : ""}`;
        card.querySelector(".price").textContent = `from ${fmtLKR(min)}`;
        typeWrap.appendChild(card);
    });

    showView("detail");
}






// == page nav ==

function showView(name) {

    document
        .getElementById("view-home")
        .classList.toggle(
        "active",
        name === "home"
    );

    document
        .getElementById("view-detail")
        .classList.toggle(
        "active",
        name === "detail"
    );

    document
        .getElementById("view-admin")
        .classList.toggle(
        "active",
        name === "admin"
    );

    if (name === "home") {
        currentHotel = null;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

document
    .getElementById("back-link")
    .addEventListener(
        "click",
        () => showView("home")
    );

document
    .getElementById("brand-home")
    .addEventListener(
        "click",
        () => showView("home")
    );

document
    .getElementById("nav-hotels")
    .addEventListener(
        "click",
        () => showView("home")
    );

document
    .getElementById("nav-contact")
    .addEventListener(
        "click",
        () => {

            showView("home");

            document
                .getElementById("contact-home")
                .scrollIntoView({
                    behavior: "smooth"
                });
        }
    );






// data load room type and hotel

Promise.all([
    loadPublicRoomTypes(),
    loadPublicHotels()
]);






// load session

function loadSession() {

    try {

        const raw =
            localStorage.getItem(
                "ceylon_session"
            );

        if (raw) {
            session = JSON.parse(raw);
        }

    } catch (e) {

        session = null;

    }

    renderAuthState();
}

function saveSession(data) {

    session = data;

    localStorage.setItem(
        "ceylon_session",
        JSON.stringify(data)
    );

    renderAuthState();
}

function clearSession() {

    session = null;

    localStorage.removeItem(
        "ceylon_session"
    );

    renderAuthState();
}





// ==  if user log change interface ===

function renderAuthState() {

    const buttons =
        document.getElementById(
            "auth-buttons"
        );

    const chip =
        document.getElementById(
            "user-chip"
        );

    if (session) {

        buttons.classList.add("is-hidden");

        chip.classList.add("is-flex");

        document.getElementById(
            "user-name"
        ).textContent =
            session.fullName;

        document.getElementById(
            "user-role"
        ).textContent =
            (
                session.roles &&
                session.roles[0]
            ) || "GUEST";

        document.getElementById(
            "user-avatar"
        ).textContent =
            session.fullName
                .trim()
                .charAt(0)
                .toUpperCase();

        document.getElementById(
            "admin-whoami"
        ).textContent =
            session.fullName;

    } else {

        buttons.classList.remove("is-hidden");

        chip.classList.remove("is-flex");

        document
            .getElementById("user-menu")
            .classList.remove("open");
    }
}







//====  authentication medel =====

document
    .getElementById("open-login")
    .addEventListener(
        "click",
        () => openModal("login-overlay")
    );

document
    .getElementById("open-register")
    .addEventListener(
        "click",
        () => openModal("register-overlay")
    );

document
    .querySelectorAll("[data-close]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                button
                    .closest(".modal-overlay")
                    .classList.remove("open");

            }
        );

    });

document
    .querySelectorAll(".modal-overlay")
    .forEach(overlay => {

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target === overlay
                ) {
                    overlay.classList.remove(
                        "open"
                    );
                }

            }
        );

    });

document
    .getElementById("switch-to-register")
    .addEventListener(
        "click",
        () => {

            closeModal("login-overlay");

            openModal(
                "register-overlay"
            );
        }
    );

document
    .getElementById("switch-to-login")
    .addEventListener(
        "click",
        () => {

            closeModal(
                "register-overlay"
            );

            openModal(
                "login-overlay"
            );
        }
    );






//====== user menu ====

document
    .getElementById("user-avatar")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("user-menu")
                .classList.toggle("open");

        }
    );

document.addEventListener(
    "click",
    event => {

        const chip =
            document.getElementById(
                "user-chip"
            );

        if (!chip.contains(event.target)) {

            document
                .getElementById("user-menu")
                .classList.remove("open");

        }

    }
);






// ===== login  =========

document
    .getElementById("login-form")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const errorElement =
                document.getElementById(
                    "login-error"
                );

            errorElement.classList.remove(
                "show"
            );

            const email =
                document
                    .getElementById(
                        "login-email"
                    )
                    .value
                    .trim();

            const password =
                document
                    .getElementById(
                        "login-password"
                    )
                    .value;

            try {

                const res =
                    await ajaxRequest(
                        `${API_BASE}/api/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email,
                                password
                            })
                        }
                    );

                if (!res.ok) {

                    const body =
                        await res
                            .json()
                            .catch(
                                () => ({})
                            );

                    throw new Error(
                        body.message ||
                        "Invalid email or password."
                    );
                }

                const data =
                    await res.json();

                saveSession(data);

                closeModal(
                    "login-overlay"
                );

                document
                    .getElementById(
                        "login-form"
                    )
                    .reset();

                showToast(
                    `Welcome back, ${
                        data.fullName
                            .split(" ")[0]
                    }.`
                );

            } catch (error) {

                errorElement.textContent =
                    error.message ||
                    "Could not reach the server. Is the backend running?";

                errorElement.classList.add(
                    "show"
                );
            }

        }
    );





// ===  register =========

document
    .getElementById("register-form")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const errorElement =
                document.getElementById(
                    "register-error"
                );

            errorElement.classList.remove(
                "show"
            );

            const fullName =
                document
                    .getElementById(
                        "reg-name"
                    )
                    .value
                    .trim();

            const email =
                document
                    .getElementById(
                        "reg-email"
                    )
                    .value
                    .trim();

            const phone =
                document
                    .getElementById(
                        "reg-phone"
                    )
                    .value
                    .trim();

            const password =
                document
                    .getElementById(
                        "reg-password"
                    )
                    .value;

            try {

                const res =
                    await ajaxRequest(
                        `${API_BASE}/api/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                fullName,
                                email,
                                password,
                                phone
                            })
                        }
                    );

                if (!res.ok) {

                    const body =
                        await res
                            .json()
                            .catch(
                                () => ({})
                            );

                    throw new Error(
                        body.message ||
                        "Could not create that account."
                    );
                }

                const data =
                    await res.json();

                saveSession(data);

                closeModal(
                    "register-overlay"
                );

                document
                    .getElementById(
                        "register-form"
                    )
                    .reset();

                showToast(
                    `Account created — welcome, ${
                        data.fullName
                            .split(" ")[0]
                    }.`
                );

            } catch (error) {

                errorElement.textContent =
                    error.message ||
                    "Could not reach the server. Is the backend running?";

                errorElement.classList.add(
                    "show"
                );
            }

        }
    );









// ==== logout ====

document
    .getElementById("logout-btn")
    .addEventListener(
        "click",
        async () => {

            if (
                session &&
                session.refreshToken
            ) {

                try {

                    await ajaxRequest(
                        `${API_BASE}/api/auth/logout`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                refreshToken:
                                session.refreshToken
                            })
                        }
                    );

                } catch (e) {
                    /* Backend unreachable.
                       Clear session locally anyway. */
                }
            }

            clearSession();

            showToast(
                "Logged out."
            );

            showView("home");
        }
    );


/* ============================================================
   18. AUTHENTICATED AJAX HELPER
   ============================================================ */

function authAjax(
    path,
    options = {}
) {

    const headers =
        Object.assign(
            {
                "Content-Type":
                    "application/json"
            },
            options.headers || {}
        );

    if (
        session &&
        session.accessToken
    ) {

        headers["Authorization"] =
            `Bearer ${session.accessToken}`;
    }

    return ajaxRequest(
        `${API_BASE}${path}`,
        Object.assign(
            {},
            options,
            { headers }
        )
    );
}


/* ============================================================
   19. ADMIN — GLOBAL DATA
   ============================================================ */

let apiCities = [];
let apiRoomTypesReal = [];
let apiHotels = [];
let selectedRoomHotelId = null;
let apiRoomsForHotel = [];


/* ============================================================
   20. ADMIN — PERMISSION CHECK
   ============================================================ */

function isStaffOrAdmin() {

    return !!(
        session &&
        session.roles &&
        session.roles.some(
            role =>
                role === "ADMIN" ||
                role === "STAFF" ||
                role === "ROLE_ADMIN" ||
                role === "ROLE_STAFF"
        )
    );
}

function isAdmin() {

    return !!(
        session &&
        session.roles &&
        session.roles.some(
            role =>
                role === "ADMIN" ||
                role === "ROLE_ADMIN"
        )
    );
}


/* ============================================================
   21. ADMIN — NAVIGATION VISIBILITY
   ============================================================ */

function refreshAdminNavVisibility() {

    const show =
        isStaffOrAdmin();

    document.getElementById("nav-admin").classList.toggle("is-hidden", !show);

    document.getElementById("admin-menu-link").classList.toggle("is-hidden", !show);
}

const originalRenderAuthState =
    renderAuthState;

renderAuthState = function () {

    originalRenderAuthState();

    refreshAdminNavVisibility();

    if (
        !isStaffOrAdmin() &&
        document
            .getElementById(
                "view-admin"
            )
            .classList.contains(
            "active"
        )
    ) {

        showView("home");
    }
};

refreshAdminNavVisibility();


/* ============================================================
   22. ADMIN — ENTER PANEL
   ============================================================ */

function enterAdmin() {

    if (!isStaffOrAdmin()) {
        return;
    }

    document
        .getElementById("user-menu")
        .classList.remove("open");

    showView("admin");

    loadAdminHotels();
}

document
    .getElementById("nav-admin")
    .addEventListener(
        "click",
        enterAdmin
    );

document
    .getElementById("admin-menu-link")
    .addEventListener(
        "click",
        enterAdmin
    );

document
    .getElementById("admin-back-link")
    .addEventListener(
        "click",
        () => showView("home")
    );


/* ============================================================
   23. ADMIN — TABS
   ============================================================ */

document
    .getElementById("tab-hotels")
    .addEventListener(
        "click",
        () => setAdminTab("hotels")
    );

document
    .getElementById("tab-rooms")
    .addEventListener(
        "click",
        () => setAdminTab("rooms")
    );

function setAdminTab(tab) {

    document
        .getElementById("tab-hotels")
        .classList.toggle(
        "active",
        tab === "hotels"
    );

    document
        .getElementById("tab-rooms")
        .classList.toggle(
        "active",
        tab === "rooms"
    );

    document
        .getElementById("panel-hotels")
        .classList.toggle(
        "active",
        tab === "hotels"
    );

    document
        .getElementById("panel-rooms")
        .classList.toggle(
        "active",
        tab === "rooms"
    );

    document
        .getElementById(
            "admin-panel-title"
        )
        .textContent =
        tab === "hotels"
            ? "Hotels"
            : "Rooms";

    if (
        tab === "rooms" &&
        apiHotels.length === 0
    ) {

        loadAdminHotels();
    }
}


/* ============================================================
   24. ADMIN — LOAD CITIES
   ============================================================ */

async function loadCities() {

    try {

        const res =
            await ajaxRequest(
                `${API_BASE}/api/cities`
            );

        apiCities =
            res.ok
                ? await res.json()
                : [];

    } catch (e) {

        apiCities = [];
    }

    const select =
        document.getElementById(
            "hotel-city"
        );

    select.innerHTML =
        apiCities
            .map(
                city =>
                    `<option value="${city.id}">
                        ${city.name}, ${city.country}
                    </option>`
            )
            .join("")

        ||

        `<option value="">
            No cities found — add one via /api/cities
        </option>`;
}


/* ============================================================
   25. ADMIN — LOAD ROOM TYPES
   ============================================================ */

async function loadRoomTypesReal() {

    try {

        const res =
            await ajaxRequest(
                `${API_BASE}/api/room-types`
            );

        apiRoomTypesReal =
            res.ok
                ? await res.json()
                : [];

    } catch (e) {

        apiRoomTypesReal = [];
    }

    const select =
        document.getElementById(
            "room-type"
        );

    select.innerHTML =
        apiRoomTypesReal
            .map(
                type =>
                    `<option value="${type.id}">
                        ${type.name}
                    </option>`
            )
            .join("")

        ||

        `<option value="">
            No room types found — add one via /api/room-types
        </option>`;
}


/* ============================================================
   26. ADMIN — LOAD HOTELS
   ============================================================ */

async function loadAdminHotels() {

    try {

        const res =
            await ajaxRequest(
                `${API_BASE}/api/hotels`
            );

        apiHotels =
            res.ok
                ? await res.json()
                : [];

    } catch (e) {

        apiHotels = [];
    }

    renderAdminHotels();
    renderRoomHotelSelect();
}


/* ============================================================
   27. ADMIN — ICONS
   ============================================================ */

/* ============================================================
   28. ADMIN — HOTEL TABLE
   ============================================================ */

function renderAdminHotels() {
    const tbody = document.querySelector("#admin-hotels-table tbody");
    const empty = document.getElementById("admin-hotels-empty");
    const template = document.getElementById("admin-hotel-row-template");

    tbody.replaceChildren();

    if (apiHotels.length === 0) {
        empty.classList.remove("is-hidden");
        return;
    }

    empty.classList.add("is-hidden");

    apiHotels.forEach(hotel => {
        const row = template.content.cloneNode(true);
        const root = row.querySelector("tr");
        root.querySelector(".admin-hotel-name").textContent = hotel.name;
        root.querySelector(".admin-hotel-city").textContent = hotel.cityName || "—";
        root.querySelector(".admin-hotel-address").textContent = hotel.address || "—";
        root.querySelector(".admin-hotel-rating").textContent = hotel.starRating != null ? `★ ${hotel.starRating}` : "—";
        root.querySelector(".admin-hotel-phone").textContent = hotel.phone || "—";

        const editButton = root.querySelector("[data-edit]");
        const deleteButton = root.querySelector("[data-delete]");
        editButton.dataset.edit = hotel.id;
        deleteButton.dataset.delete = hotel.id;
        deleteButton.classList.toggle("is-hidden", !isAdmin());

        editButton.addEventListener("click", () => openHotelModal(hotel));
        deleteButton.addEventListener("click", () => deleteHotel(hotel.id));
        tbody.appendChild(row);
    });
}

/* ============================================================
   29. ADMIN — ADD HOTEL BUTTON
   ============================================================ */

document
    .getElementById("add-hotel-btn")
    .addEventListener(
        "click",
        () => openHotelModal(null)
    );


/* ============================================================
   30. ADMIN — HOTEL MODAL
   ============================================================ */

async function openHotelModal(hotel) {

    await loadCities();

    const errorElement =
        document.getElementById(
            "hotel-error"
        );

    errorElement.classList.remove(
        "show"
    );

    document
        .getElementById("hotel-form")
        .reset();


    if (hotel) {

        document.getElementById(
            "hotel-modal-eyebrow"
        ).textContent =
            "Admin · Edit hotel";

        document.getElementById(
            "hotel-modal-title"
        ).textContent =
            "Edit hotel";

        document.getElementById(
            "hotel-id"
        ).value =
            hotel.id;

        document.getElementById(
            "hotel-name"
        ).value =
            hotel.name || "";

        document.getElementById(
            "hotel-description"
        ).value =
            hotel.description || "";

        document.getElementById(
            "hotel-address"
        ).value =
            hotel.address || "";

        document.getElementById(
            "hotel-rating"
        ).value =
            hotel.starRating || "";

        document.getElementById(
            "hotel-phone"
        ).value =
            hotel.phone || "";

        document.getElementById(
            "hotel-email"
        ).value =
            hotel.email || "";


        const match =
            apiCities.find(
                city =>
                    city.name ===
                    hotel.cityName
            );

        if (match) {

            document.getElementById(
                "hotel-city"
            ).value =
                match.id;
        }

    } else {

        document.getElementById(
            "hotel-modal-eyebrow"
        ).textContent =
            "Admin · New hotel";

        document.getElementById(
            "hotel-modal-title"
        ).textContent =
            "Add hotel";

        document.getElementById(
            "hotel-id"
        ).value = "";
    }

    openModal(
        "hotel-modal-overlay"
    );
}


/* ============================================================
   31. ADMIN — SAVE HOTEL
   ============================================================ */

document
    .getElementById("hotel-form")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const errorElement =
                document.getElementById(
                    "hotel-error"
                );

            errorElement.classList.remove(
                "show"
            );

            const id =
                document.getElementById(
                    "hotel-id"
                ).value;

            const payload = {

                name:
                    document
                        .getElementById(
                            "hotel-name"
                        )
                        .value
                        .trim(),

                description:
                    document
                        .getElementById(
                            "hotel-description"
                        )
                        .value
                        .trim(),

                address:
                    document
                        .getElementById(
                            "hotel-address"
                        )
                        .value
                        .trim(),

                cityId:
                    Number(
                        document
                            .getElementById(
                                "hotel-city"
                            )
                            .value
                    ),

                starRating:
                    document
                        .getElementById(
                            "hotel-rating"
                        )
                        .value
                        ? Number(
                            document
                                .getElementById(
                                    "hotel-rating"
                                )
                                .value
                        )
                        : null,

                phone:
                    document
                        .getElementById(
                            "hotel-phone"
                        )
                        .value
                        .trim(),

                email:
                    document
                        .getElementById(
                            "hotel-email"
                        )
                        .value
                        .trim()
            };


            try {

                const res =
                    await authAjax(
                        id
                            ? `/api/hotels/${id}`
                            : "/api/hotels",
                        {
                            method:
                                id
                                    ? "PUT"
                                    : "POST",

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                if (!res.ok) {

                    const body =
                        await res
                            .json()
                            .catch(
                                () => ({})
                            );

                    throw new Error(
                        body.message ||
                        "Could not save the hotel."
                    );
                }

                closeModal(
                    "hotel-modal-overlay"
                );

                showToast(
                    id
                        ? "Hotel updated."
                        : "Hotel added."
                );

                loadAdminHotels();

            } catch (error) {

                errorElement.textContent =
                    error.message ||
                    "Could not reach the server.";

                errorElement.classList.add(
                    "show"
                );
            }
        }
    );


/* ============================================================
   32. ADMIN — DELETE HOTEL
   ============================================================ */

async function deleteHotel(id) {

    if (
        !confirm(
            "Delete this hotel? This cannot be undone."
        )
    ) {
        return;
    }

    try {

        const res =
            await authAjax(
                `/api/hotels/${id}`,
                {
                    method: "DELETE"
                }
            );

        if (
            !res.ok &&
            res.status !== 204
        ) {
            throw new Error(
                "Could not delete the hotel."
            );
        }

        showToast(
            "Hotel deleted."
        );

        loadAdminHotels();

    } catch (error) {

        showToast(
            error.message ||
            "Could not delete the hotel."
        );
    }
}


/* ============================================================
   33. ADMIN — ROOM HOTEL SELECT
   ============================================================ */

function renderRoomHotelSelect() {

    const select =
        document.getElementById(
            "room-hotel-select"
        );

    const current =
        select.value;

    select.innerHTML =
        `
            <option value="">
                Select a hotel…
            </option>
        ` +

        apiHotels
            .map(
                hotel =>
                    `<option value="${hotel.id}">
                        ${hotel.name}
                    </option>`
            )
            .join("");

    if (current) {
        select.value =
            current;
    }
}

document
    .getElementById(
        "room-hotel-select"
    )
    .addEventListener(
        "change",
        event => {

            selectedRoomHotelId =
                event.target.value
                    ? Number(
                        event.target.value
                    )
                    : null;

            document.getElementById(
                "add-room-btn"
            ).disabled =
                !selectedRoomHotelId;

            if (
                selectedRoomHotelId
            ) {

                loadAdminRooms(
                    selectedRoomHotelId
                );

            } else {

                document.querySelector(
                    "#admin-rooms-table tbody"
                ).innerHTML = "";

                const empty =
                    document.getElementById(
                        "admin-rooms-empty"
                    );

                empty.classList.remove("is-hidden");

                empty.textContent =
                    "Pick a hotel above to see and manage its rooms.";
            }
        }
    );


/* ============================================================
   34. ADMIN — LOAD ROOMS
   ============================================================ */

async function loadAdminRooms(hotelId) {

    try {

        const res =
            await ajaxRequest(
                `${API_BASE}/api/rooms/hotel/${hotelId}`
            );

        apiRoomsForHotel =
            res.ok
                ? await res.json()
                : [];

    } catch (e) {

        apiRoomsForHotel = [];
    }

    renderAdminRooms();
}


/* ============================================================
   35. ADMIN — ROOM TABLE
   ============================================================ */

function renderAdminRooms() {
    const tbody = document.querySelector("#admin-rooms-table tbody");
    const empty = document.getElementById("admin-rooms-empty");
    const template = document.getElementById("admin-room-row-template");

    tbody.replaceChildren();

    if (apiRoomsForHotel.length === 0) {
        empty.textContent = "This hotel has no rooms yet — add the first one above.";
        empty.classList.remove("is-hidden");
        return;
    }

    empty.classList.add("is-hidden");

    apiRoomsForHotel.forEach(room => {
        const row = template.content.cloneNode(true);
        const root = row.querySelector("tr");
        root.querySelector(".admin-room-number").textContent = room.roomNumber;
        root.querySelector(".admin-room-floor").textContent = room.floorNo != null ? room.floorNo : "—";
        root.querySelector(".admin-room-type").textContent = room.roomType;
        root.querySelector(".admin-room-price").textContent = fmtLKR(room.pricePerNight);
        const status = root.querySelector(".admin-room-status");
        status.classList.add(`badge-${(room.status || "available").toLowerCase()}`);
        status.textContent = room.status;

        const editButton = root.querySelector("[data-edit]");
        const deleteButton = root.querySelector("[data-delete]");
        editButton.dataset.edit = room.id;
        deleteButton.dataset.delete = room.id;
        editButton.addEventListener("click", () => openRoomModal(room));
        deleteButton.addEventListener("click", () => deleteRoom(room.id));
        tbody.appendChild(row);
    });
}

/* ============================================================
   36. ADMIN — ADD ROOM
   ============================================================ */

document
    .getElementById("add-room-btn")
    .addEventListener(
        "click",
        () => openRoomModal(null)
    );


/* ============================================================
   37. ADMIN — ROOM MODAL
   ============================================================ */

async function openRoomModal(room) {

    await loadRoomTypesReal();

    const errorElement =
        document.getElementById(
            "room-error"
        );

    errorElement.classList.remove(
        "show"
    );

    document
        .getElementById("room-form")
        .reset();


    if (room) {

        document.getElementById(
            "room-modal-eyebrow"
        ).textContent =
            "Admin · Edit room";

        document.getElementById(
            "room-modal-title"
        ).textContent =
            "Edit room";

        document.getElementById(
            "room-id"
        ).value =
            room.id;

        document.getElementById(
            "room-number"
        ).value =
            room.roomNumber || "";

        document.getElementById(
            "room-floor"
        ).value =
            room.floorNo != null
                ? room.floorNo
                : "";

        document.getElementById(
            "room-price"
        ).value =
            room.pricePerNight || "";


        const match =
            apiRoomTypesReal.find(
                type =>
                    type.name ===
                    room.roomType
            );

        if (match) {

            document.getElementById(
                "room-type"
            ).value =
                match.id;
        }

    } else {

        document.getElementById(
            "room-modal-eyebrow"
        ).textContent =
            "Admin · New room";

        document.getElementById(
            "room-modal-title"
        ).textContent =
            "Add room";

        document.getElementById(
            "room-id"
        ).value = "";
    }

    openModal(
        "room-modal-overlay"
    );
}


/* ============================================================
   38. ADMIN — SAVE ROOM
   ============================================================ */

document
    .getElementById("room-form")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const errorElement =
                document.getElementById(
                    "room-error"
                );

            errorElement.classList.remove(
                "show"
            );

            if (!selectedRoomHotelId) {

                errorElement.textContent =
                    "Pick a hotel first.";

                errorElement.classList.add(
                    "show"
                );

                return;
            }

            const id =
                document.getElementById(
                    "room-id"
                ).value;

            const payload = {

                hotelId:
                selectedRoomHotelId,

                roomTypeId:
                    Number(
                        document
                            .getElementById(
                                "room-type"
                            )
                            .value
                    ),

                roomNumber:
                    document
                        .getElementById(
                            "room-number"
                        )
                        .value
                        .trim(),

                floorNo:
                    document
                        .getElementById(
                            "room-floor"
                        )
                        .value
                        ? Number(
                            document
                                .getElementById(
                                    "room-floor"
                                )
                                .value
                        )
                        : null,

                pricePerNight:
                    Number(
                        document
                            .getElementById(
                                "room-price"
                            )
                            .value
                    ),

                amenityIds: []
            };


            try {

                const res =
                    await authAjax(
                        id
                            ? `/api/rooms/${id}`
                            : "/api/rooms",
                        {
                            method:
                                id
                                    ? "PUT"
                                    : "POST",

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                if (!res.ok) {

                    const body =
                        await res
                            .json()
                            .catch(
                                () => ({})
                            );

                    throw new Error(
                        body.message ||
                        "Could not save the room."
                    );
                }

                closeModal(
                    "room-modal-overlay"
                );

                showToast(
                    id
                        ? "Room updated."
                        : "Room added."
                );

                loadAdminRooms(
                    selectedRoomHotelId
                );

            } catch (error) {

                errorElement.textContent =
                    error.message ||
                    "Could not reach the server.";

                errorElement.classList.add(
                    "show"
                );
            }
        }
    );


/* ============================================================
   39. ADMIN — DELETE ROOM
   ============================================================ */

async function deleteRoom(id) {

    if (
        !confirm(
            "Delete this room? This cannot be undone."
        )
    ) {
        return;
    }

    try {

        const res =
            await authAjax(
                `/api/rooms/${id}`,
                {
                    method: "DELETE"
                }
            );

        if (
            !res.ok &&
            res.status !== 204
        ) {

            throw new Error(
                "Could not delete the room."
            );
        }

        showToast(
            "Room deleted."
        );

        loadAdminRooms(
            selectedRoomHotelId
        );

    } catch (error) {

        showToast(
            error.message ||
            "Could not delete the room."
        );
    }
}


/* ============================================================
   40. RULE-BASED CHATBOT
   ============================================================ */

const chatToggle =
    document.getElementById(
        "chat-toggle"
    );

const chatPanel =
    document.getElementById(
        "chat-panel"
    );

const chatClose =
    document.getElementById(
        "chat-close"
    );

const messages =
    document.getElementById(
        "chat-messages"
    );

const quickReplies =
    document.getElementById(
        "quick-replies"
    );


/* ---------- Open Chat ---------- */

chatToggle.addEventListener(
    "click",
    () => {

        chatPanel.classList.add(
            "open"
        );

        if (
            messages.children.length === 0
        ) {

            addMessage(
                "bot",
                "Ayubowan! I'm the Ceylon Collection concierge. Ask me about check-in time, room prices, Wi-Fi, or our hotel locations — or tap a question below."
            );
        }
    }
);


/* ---------- Close Chat ---------- */

chatClose.addEventListener(
    "click",
    () =>
        chatPanel.classList.remove(
            "open"
        )
);


/* ---------- Quick Replies ---------- */

const suggestions = [
    "What time is check-in?",
    "How much is a room?",
    "Which hotels do you have?",
    "Where is this hotel?"
];

const quickReplyTemplate = document.getElementById("quick-reply-template");
quickReplies.replaceChildren();
suggestions.forEach(question => {
    const button = quickReplyTemplate.content.cloneNode(true).querySelector(".qr-btn");
    button.textContent = question;
    button.addEventListener("click", () => handleUserMessage(question));
    quickReplies.appendChild(button);
});


/* ---------- Chat Form ---------- */

document
    .getElementById("chat-form")
    .addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const input =
                document.getElementById(
                    "chat-input"
                );

            const text =
                input.value.trim();

            if (!text) return;

            handleUserMessage(text);

            input.value = "";
        }
    );


/* ---------- Add Message ---------- */

function addMessage(who, text) {
    const template = document.getElementById("message-template");
    const div = template.content.cloneNode(true).querySelector(".msg");
    div.classList.add(who);
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}


/* ---------- User Message ---------- */

function handleUserMessage(
    rawText
) {

    addMessage(
        "user",
        rawText
    );

    const reply =
        getBotReply(rawText);

    setTimeout(
        () =>
            addMessage(
                "bot",
                reply
            ),
        350
    );
}


/* ============================================================
   41. CHATBOT — RESPONSE LOGIC
   ============================================================ */

function getBotReply(
    rawText
) {

    const msg =
        rawText.toLowerCase();


    /* ---------- Check-in ---------- */

    if (
        msg.includes("check-in") ||
        msg.includes("check in") ||
        msg.includes("checkin")
    ) {

        return "Check-in is from 2:00 PM at every Ceylon Collection property. Early check-in is possible if a room is ready.";
    }


    /* ---------- Check-out ---------- */

    else if (
        msg.includes("check-out") ||
        msg.includes("check out") ||
        msg.includes("checkout")
    ) {

        return "Check-out is by 11:00 AM. Late check-out until 1:00 PM is free for Suite guests.";
    }


    /* ---------- Price ---------- */

    else if (
        msg.includes("price") ||
        msg.includes("rate") ||
        msg.includes("cost") ||
        msg.includes("how much")
    ) {

        if (
            currentHotel &&
            currentHotel.rooms.length
        ) {

            const min =
                Math.min(
                    ...currentHotel.rooms.map(
                        room =>
                            room.pricePerNight
                    )
                );

            const max =
                Math.max(
                    ...currentHotel.rooms.map(
                        room =>
                            room.pricePerNight
                    )
                );

            return `At ${currentHotel.name}, rates range from ${fmtLKR(min)} to ${fmtLKR(max)} per night. See the Rooms table above for each room.`;
        }

        return "Rates vary by property, roughly LKR 6,500 to LKR 34,000 per night. Open a hotel to see its exact prices.";
    }


    /* ---------- Wi-Fi ---------- */

    else if (
        msg.includes("wifi") ||
        msg.includes("wi-fi") ||
        msg.includes("internet")
    ) {

        return "Yes — free high-speed Wi-Fi is included in every room across all our hotels.";
    }


    /* ---------- Hotels ---------- */

    else if (
        msg.includes("which hotel") ||
        msg.includes("hotels do you") ||
        msg.includes("list of hotel") ||
        msg.includes("locations")
    ) {

        return (
            "We manage " +
            hotels.length +
            " properties: " +
            hotels
                .map(
                    hotel =>
                        `${hotel.name} (${hotel.city})`
                )
                .join(", ") +
            "."
        );
    }


    /* ---------- Current Hotel Location ---------- */

    else if (
        msg.includes("this hotel") ||
        (
            currentHotel &&
            (
                msg.includes("location") ||
                msg.includes("address") ||
                msg.includes("where")
            )
        )
    ) {

        if (currentHotel) {

            return `${currentHotel.name} is located at ${currentHotel.address}.`;
        }

        return "Open a hotel first, then ask again and I'll give you its exact address.";
    }


    /* ---------- General Location ---------- */

    else if (
        msg.includes("location") ||
        msg.includes("address") ||
        msg.includes("where")
    ) {

        return "Our head office is at 12 Galle Face Terrace, Colombo 03. Open a specific hotel to see its own address.";
    }


    /* ---------- Contact ---------- */

    else if (
        msg.includes("phone") ||
        msg.includes("contact") ||
        msg.includes("number")
    ) {

        if (currentHotel) {

            return `You can reach ${currentHotel.name} on ${currentHotel.phone} or ${currentHotel.email}.`;
        }

        return "Head office reservations: +94 11 234 5678, reservations@ceyloncollection.lk.";
    }


    /* ---------- Available Rooms ---------- */

    else if (
        msg.includes("available") ||
        msg.includes("vacant") ||
        (
            msg.includes("room") &&
            msg.includes("free")
        )
    ) {

        if (currentHotel) {

            const free =
                currentHotel.rooms.filter(
                    room =>
                        room.status ===
                        "AVAILABLE"
                ).length;

            return `${currentHotel.name} currently has ${free} rooms marked AVAILABLE.`;
        }

        const free =
            hotels
                .flatMap(
                    hotel =>
                        hotel.rooms
                )
                .filter(
                    room =>
                        room.status ===
                        "AVAILABLE"
                )
                .length;

        return `${free} rooms are marked AVAILABLE across all properties right now.`;
    }


    /* ---------- Login / Account ---------- */

    else if (
        msg.includes("login") ||
        msg.includes("log in") ||
        msg.includes("sign up") ||
        msg.includes("register") ||
        msg.includes("account")
    ) {

        return session
            ? `You're logged in as ${session.fullName}. Use the account menu at the top-right to sign out.`
            : 'Use the "Log in" or "Sign up" button at the top-right to create or access your account.';
    }


    /* ---------- Greeting ---------- */

    else if (
        msg.includes("hi") ||
        msg.includes("hello") ||
        msg.includes("ayubowan")
    ) {

        return "Ayubowan! How can I help — check-in time, room prices, Wi-Fi, or our hotel locations?";
    }


    /* ---------- Thank You ---------- */

    else if (
        msg.includes("thank")
    ) {

        return "You're most welcome! Anything else I can help with?";
    }


    /* ---------- Default ---------- */

    else {

        return "I didn't quite catch that. I can help with: check-in/check-out time, room prices, Wi-Fi, hotel locations, or contact details.";
    }
}


/* ============================================================
   42. FINAL INITIALIZATION
   ============================================================ */

loadSession();

refreshAdminNavVisibility();
