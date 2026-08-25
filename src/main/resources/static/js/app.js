

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





