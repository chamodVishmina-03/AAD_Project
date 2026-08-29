

// =====================================   Configuration ======================================

const API_BASE = "";

const gradients = {
    indigo: "linear-gradient(135deg,#4F46E5,#7C3AED)",
    teal: "linear-gradient(135deg,#0EA5A4,#0284C7)",
    amber: "linear-gradient(135deg,#F59E0B,#DC2626)",
    sky: "linear-gradient(135deg,#0EA5E9,#4F46E5)",
    rose: "linear-gradient(135deg,#EC4899,#7C3AED)"
};

const gradientList = Object.values(gradients);

let hotels = [];
let roomTypesCache = [];
let currentCityFilter = "";
let currentHotel = null;

let session = null;






//================================ Common functions    ==============================


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

function typeIconSvg() {
    return `
        <svg class="icon"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor">
            <path d="M3 18v-7a2 2 0 012-2h14a2 2 0 012 2v7
                     M3 18h18
                     M3 18v2
                     M21 18v2
                     M7 9V6a2 2 0 012-2h6a2 2 0 012 2v3"/>
        </svg>
    `;
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


//  get room data from backend endpoint
async function loadPublicRoomTypes() {
    try {
        const res = await fetch(`${API_BASE}/api/room-types`);

        roomTypesCache = res.ok
            ? await res.json()
            : [];

    } catch (e) {
        roomTypesCache = [];
    }
}





//  get hotels and rooms from back end show that details on frontend
async function loadPublicHotels() {

    const grid = document.getElementById("hotel-grid");
    const empty = document.getElementById("hotel-grid-empty");

    empty.style.display = "none";

    grid.innerHTML = `
        <div class="empty-state">
            Loading hotels…
        </div>
    `;

    try {

        const res = await fetch(`${API_BASE}/api/hotels`);

        if (!res.ok) {
            throw new Error("Could not load hotels.");
        }

        const raw = await res.json();

        hotels = await Promise.all(
            raw.map(async (h, i) => {

                let rooms = [];

                try {

                    const rRes = await fetch(
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

                    grad: gradientList[
                    i % gradientList.length
                        ],

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

        grid.innerHTML = "";

        empty.style.display = "block";

        empty.textContent =
            "Could not reach the server. Is the backend running?";

        renderStats();

        return;
    }

    populateCitySelect();
    renderHotelGrid();
    renderStats();
}





// ========================      Hotel ========================


function renderHotelGrid() {

    const grid = document.getElementById("hotel-grid");
    const empty = document.getElementById("hotel-grid-empty");

    const filtered = currentCityFilter
        ? hotels.filter(h => h.city === currentCityFilter)
        : hotels;

    if (filtered.length === 0) {

        grid.innerHTML = "";

        empty.textContent =
            hotels.length === 0
                ? "No hotels yet — check back soon."
                : "No hotels match that city — try clearing the search.";

        empty.style.display = "block";

        return;
    }

    empty.style.display = "none";

    grid.innerHTML = filtered.map(h => {

        const cheapest = h.rooms.length
            ? Math.min(
                ...h.rooms.map(r => r.pricePerNight)
            )
            : null;

        const initials = h.name
            .split(" ")
            .map(w => w[0])
            .slice(0, 2)
            .join("");

        return `
            <div class="hotel-card" data-id="${h.id}">

                <div class="hotel-banner"
                     style="background:${h.grad};">

                    <span class="monogram">
                        ${initials}
                    </span>

                    <span class="rating-badge">
                        ★ ${h.starRating != null
            ? h.starRating
            : "—"}
                    </span>

                </div>

                <div class="hotel-body">

                    <div class="hotel-name">
                        ${h.name}
                    </div>

                    <div class="hotel-city">

                        <svg class="icon"
                             style="width:12px;height:12px;"
                             viewBox="0 0 24 24"
                             fill="none"
                             stroke="currentColor">

                            <path d="M21 10c0 6-9 12-9 12
                                     s-9-6-9-12a9 9 0 0118 0z"/>

                            <circle cx="12"
                                    cy="10"
                                    r="3"/>

                        </svg>

                        ${h.city || "—"}
                        ${h.country
            ? ", " + h.country
            : ""}
                    </div>

                    <div class="hotel-desc">
                        ${h.description || ""}
                    </div>

                    <div class="hotel-footer">

                        <div class="price">

                            ${cheapest != null
            ? fmtLKR(cheapest)
            : "No rooms yet"}

                            ${cheapest != null
            ? "<span> / night</span>"
            : ""}

                        </div>

                        <div class="view-btn">
                            View rooms →
                        </div>

                    </div>

                </div>

            </div>
        `;

    }).join("");

    grid.querySelectorAll(".hotel-card").forEach(card => {

        card.addEventListener("click", () => {

            openHotel(
                Number(card.dataset.id)
            );

        });

    });
}


// ============  filter cities===============

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




// =======  show  num of hotels ,rooms,available rooms  =======

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





//==========   hotel detail view =========

function openHotel(id) {

    const hotel =
        hotels.find(h => h.id === id);

    if (!hotel) return;

    currentHotel = hotel;

    document.getElementById(
        "d-banner"
    ).style.background = hotel.grad;

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

    document.getElementById(
        "d-rating"
    ).innerHTML =
        `★ ${
            hotel.starRating != null
                ? hotel.starRating
                : "—"
        } rating`;

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


    /* Room Table  */

    const tbody =
        document.querySelector(
            "#rooms-table tbody"
        );

    tbody.innerHTML =
        hotel.rooms.length

            ? hotel.rooms.map(room => `
                <tr>

                    <td class="mono-cell">
                        ${room.roomNumber}
                    </td>

                    <td class="mono-cell">
                        ${
                room.floorNo != null
                    ? room.floorNo
                    : "—"
            }
                    </td>

                    <td>
                        ${room.roomType}
                    </td>

                    <td class="mono-cell">
                        ${fmtLKR(
                room.pricePerNight
            )}
                    </td>

                    <td>
                        <span class="badge badge-${
                room.status.toLowerCase()
            }">
                            ${room.status}
                        </span>
                    </td>

                    <td>
                        ${room.amenities
                .map(
                    a =>
                        `<span class="amenity-tag">
                                        ${a}
                                    </span>`
                )
                .join("")}
                    </td>

                </tr>
            `).join("")

            : `
                <tr>
                    <td colspan="6"
                        style="
                            text-align:center;
                            color:var(--text-muted);
                        ">
                        No rooms added for this hotel yet.
                    </td>
                </tr>
            `;


    /* Room Categories  */

    const usedTypes = [
        ...new Set(
            hotel.rooms.map(
                r => r.roomType
            )
        )
    ];

    const typeWrap =
        document.getElementById(
            "type-cards"
        );

    typeWrap.innerHTML =
        usedTypes.length

            ? usedTypes.map(typeName => {

                const type =
                    roomTypeInfo(typeName);

                const priced =
                    hotel.rooms.filter(
                        r =>
                            r.roomType === typeName
                    );

                const min =
                    Math.min(
                        ...priced.map(
                            r => r.pricePerNight
                        )
                    );

                const maxGuests =
                    type.maxOccupancy || 1;

                return `
                    <div class="type-card">

                        <div class="icon-wrap">
                            ${typeIconSvg()}
                        </div>

                        <div class="tname">
                            ${type.name}
                        </div>

                        <div class="tdesc">
                            ${type.description || ""}
                        </div>

                        <div class="tfoot">

                            <span class="cap">
                                Max ${maxGuests}
                                guest${
                    maxGuests > 1
                        ? "s"
                        : ""
                }
                            </span>

                            <span class="price">
                                from ${fmtLKR(min)}
                            </span>

                        </div>

                    </div>
                `;

            }).join("")

            : "";

    showView("detail");
}







//========= page navigation ========

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




// run pb room type and public hotels in one time

Promise.all([
    loadPublicRoomTypes(),
    loadPublicHotels()
]);


//============= sesion ==============


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

        buttons.style.display = "none";

        chip.style.display = "flex";

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

        buttons.style.display = "flex";

        chip.style.display = "none";

        document
            .getElementById("user-menu")
            .classList.remove("open");
    }
}







// ======= authentication  models==========
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








// ===========  user menu ==========
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







// =========== Login  ===============

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
                    await fetch(
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










// ==========   register =============

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
                    await fetch(
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










//========  logout  ===============


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

                    await fetch(
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




// = ===== authenticated fetch helper ======

function authFetch(
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

    return fetch(
        `${API_BASE}${path}`,
        Object.assign(
            {},
            options,
            { headers }
        )
    );
}





//==============================    Admin data  ================================================


let apiCities = [];
let apiRoomTypesReal = [];
let apiHotels = [];
let selectedRoomHotelId = null;
let apiRoomsForHotel = [];




// admin permission checking

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



//    admin nav view


function refreshAdminNavVisibility() {

    const show =
        isStaffOrAdmin();

    document.getElementById(
        "nav-admin"
    ).style.display =
        show
            ? "inline-flex"
            : "none";

    document.getElementById(
        "admin-menu-link"
    ).style.display =
        show
            ? "block"
            : "none";
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





// admin enter pannel


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


// admin tabs


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



// admin load cities



async function loadCities() {

    try {

        const res =
            await fetch(
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




// admin load room types


async function loadRoomTypesReal() {

    try {

        const res =
            await fetch(
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




// admin load hotels


async function loadAdminHotels() {

    try {

        const res =
            await fetch(
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





// admin icon

const editIconSvg = `
    <svg class="icon"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor">
        <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5
                 2 22l1.5-5.5L17 3z"/>
    </svg>
`;

const trashIconSvg = `
    <svg class="icon"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor">
        <path d="M3 6h18
                 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2
                 m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/>
    </svg>
`;







// admin hotels table
function renderAdminHotels() {

    const tbody =
        document.querySelector(
            "#admin-hotels-table tbody"
        );

    const empty =
        document.getElementById(
            "admin-hotels-empty"
        );

    if (apiHotels.length === 0) {

        tbody.innerHTML = "";

        empty.style.display =
            "block";

        return;
    }

    empty.style.display =
        "none";

    tbody.innerHTML =
        apiHotels.map(hotel => `
            <tr>

                <td style="font-weight:600;">
                    ${hotel.name}
                </td>

                <td>
                    ${hotel.cityName || "—"}
                </td>

                <td>
                    ${hotel.address || "—"}
                </td>

                <td class="mono-cell">
                    ${
            hotel.starRating != null
                ? "★ " +
                hotel.starRating
                : "—"
        }
                </td>

                <td class="mono-cell">
                    ${hotel.phone || "—"}
                </td>

                <td class="row-actions">

                    <button
                        class="icon-btn"
                        data-edit="${hotel.id}"
                        type="button"
                        title="Edit">

                        ${editIconSvg}

                    </button>

                    ${
            isAdmin()
                ? `
                                    <button
                                        class="icon-btn danger"
                                        data-delete="${hotel.id}"
                                        type="button"
                                        title="Delete">
    
                                        ${trashIconSvg}
    
                                    </button>
                            `
                : ""
        }

                </td>

            </tr>
        `).join("");


    tbody
        .querySelectorAll("[data-edit]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    openHotelModal(
                        apiHotels.find(
                            hotel =>
                                hotel.id ===
                                Number(
                                    button.dataset.edit
                                )
                        )
                    );

                }
            );
        });


    tbody
        .querySelectorAll("[data-delete]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteHotel(
                        Number(
                            button.dataset.delete
                        )
                    );

                }
            );
        });
}






// == Ajax authentication helper ===
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






// =====  admin  global data ====

let apiCities = [];
let apiRoomTypesReal = [];
let apiHotels = [];
let selectedRoomHotelId = null;
let apiRoomsForHotel = [];



// ========  admin permission check====


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





// ==  ===  admin nav visibility =====


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








// =========  admin enter pannel ====
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







//==========  admin tabs =========


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









// ===  admin load cities =======


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







// ====== admin load roomtype =========


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





// ==== admin load hotels =======

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
