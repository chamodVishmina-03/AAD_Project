const API_BASE = "";

const gradients = {
    indigo:  "linear-gradient(135deg,#4F46E5,#7C3AED)",
    teal:    "linear-gradient(135deg,#0EA5A4,#0284C7)",
    amber:   "linear-gradient(135deg,#F59E0B,#DC2626)",
    sky:     "linear-gradient(135deg,#0EA5E9,#4F46E5)",
    rose:    "linear-gradient(135deg,#EC4899,#7C3AED)",
};


const gradientList = Object.values(gradients);


let hotels = [];   // hotels
let roomTypesCache = [];// rooms cache



// rupees format and check input value larger than 1000 after add , for money
function fmtLKR(n){
    return "LKR " + Number(n).toLocaleString("en-LK");
}




//===============================================  ROOM   ========================================

// room type
function roomTypeInfo(name){
    return roomTypesCache.find(t => t.name === name)
        || {
        name, description: "", maxOccupancy: 2
    };

}


// card icon shape
function typeIconSvg(){
    return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
<path d="M3 18v-7a2 2 0 012-2h14a2 2 0 012 2v7M3 18h18M3 18v2M21 18v2M7 9V6a2 2 0 012-2h6a2 2 0 012 2v3"/></svg>`;
}


// load rooms types from backend end point, wait work using async
async function loadPublicRoomTypes(){
    try {
        const res = await fetch(`${API_BASE}/api/room-types`);
        roomTypesCache = res.ok ? await res.json() : [];
    } catch (e) { roomTypesCache = []; }
}




//  load public hotels  from end point
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






// search city
let currentCityFilter = "";


// create view frontend cards hotels
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


// create unique city name list
function populateCitySelect(){
    const cities = [...new Set(hotels.map(h => h.city).filter(Boolean))];
    const sel = document.getElementById("search-city");
    sel.innerHTML = `<option value="">All cities</option>` + cities.map(c => `<option value="${c}">${c}</option>`).join("");
}


// search btn
document.getElementById("search-btn").addEventListener("click", () => {
    currentCityFilter = document.getElementById("search-city").value;
    renderHotelGrid();
    document.getElementById("hotel-grid").scrollIntoView({ behavior: "smooth", block: "start" });
});



// update search bar status
function renderStats(){
    document.getElementById("stat-hotels").textContent = hotels.length;
    const allRooms = hotels.flatMap(h => h.rooms);
    document.getElementById("stat-rooms").textContent = allRooms.length;
    document.getElementById("stat-available").textContent = allRooms.filter(r => r.status === "AVAILABLE").length;
}



// render: detail view
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


