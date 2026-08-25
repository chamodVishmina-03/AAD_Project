

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

