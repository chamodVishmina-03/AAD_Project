// dashboard.js — index.html (the hotel panel)

requireAuth();
renderHeader("home");

let allHotels = [];

document.getElementById("city-filter").addEventListener("change", loadHotels);

(async function init() {
    await loadCities();
    await loadHotels();
})();

async function loadCities() {
    try {
        const res = await ajax("/api/cities");
        const cities = res.ok ? await res.json() : [];
        const select = document.getElementById("city-filter");
        select.innerHTML =
            `<option value="">All cities</option>` +
            cities.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
    } catch (e) {
        // city filter just stays on "All cities" if this fails
    }
}

async function loadHotels() {
    const grid = document.getElementById("hotel-grid");
    const empty = document.getElementById("hotel-grid-empty");

    grid.innerHTML = `<div class="card"><p class="text-muted">Loading hotels…</p></div>`;
    empty.classList.add("hidden");

    const cityId = document.getElementById("city-filter").value;
    const query = cityId ? `?cityId=${cityId}` : "";

    try {
        const res = await authAjax(`/api/hotels${query}`);
        if (!res.ok) throw new Error("Could not load hotels.");
        allHotels = await res.json();

        if (!allHotels.length) {
            grid.innerHTML = "";
            empty.classList.remove("hidden");
            empty.querySelector("p").textContent = "No hotels found.";
            updateStats(0, 0, 0);
            return;
        }

        // Pull rooms + today's availability for every hotel in parallel so the
        // panel's numbers reflect exactly what's in the database right now.
        const todayIso = isoDateInDays(0);
        const tomorrowIso = isoDateInDays(1);

        const details = await Promise.all(allHotels.map(async hotel => {
            let rooms = [];
            let availableTonight = [];
            try {
                const roomsRes = await authAjax(`/api/rooms/hotel/${hotel.id}`);
                rooms = roomsRes.ok ? await roomsRes.json() : [];
            } catch (e) { rooms = []; }
            try {
                const availRes = await authAjax(`/api/rooms/available?hotelId=${hotel.id}&checkIn=${todayIso}&checkOut=${tomorrowIso}`);
                availableTonight = availRes.ok ? await availRes.json() : [];
            } catch (e) { availableTonight = []; }
            return { hotel, rooms, availableTonight };
        }));

        renderHotelGrid(details);

        const totalRooms = details.reduce((sum, d) => sum + d.rooms.length, 0);
        const totalAvailable = details.reduce((sum, d) => sum + d.availableTonight.length, 0);
        updateStats(allHotels.length, totalRooms, totalAvailable);

    } catch (e) {
        grid.innerHTML = "";
        empty.classList.remove("hidden");
        empty.querySelector("p").textContent = e.message;
        updateStats("—", "—", "—");
    }
}

function updateStats(hotels, rooms, available) {
    document.getElementById("stat-hotels").textContent = hotels;
    document.getElementById("stat-rooms").textContent = rooms;
    document.getElementById("stat-available").textContent = available;
}

function renderHotelGrid(details) {
    const grid = document.getElementById("hotel-grid");
    const empty = document.getElementById("hotel-grid-empty");
    empty.classList.add("hidden");

    grid.innerHTML = details.map(({ hotel, rooms, availableTonight }) => {
        const prices = rooms.map(r => r.pricePerNight).filter(p => p != null);
        const minPrice = prices.length ? Math.min(...prices) : null;
        const availCount = availableTonight.length;
        const totalCount = rooms.length;

        const coverUrl = (hotel.imageUrls && hotel.imageUrls.length) ? hotel.imageUrls[0] : null;

        return `
            <div class="hotel-card ${coverUrl ? "" : "no-cover"}" data-hotel-id="${hotel.id}">
                ${coverUrl ? `<img class="cover-img" src="${coverUrl}" alt="${hotel.name}" />` : ""}
                <div class="top-row">
                    <div>
                        <div class="name">${hotel.name}</div>
                        <div class="location">${hotel.cityName || "—"}${hotel.country ? ", " + hotel.country : ""}</div>
                    </div>
                    <span class="rating-pill">★ ${hotel.starRating != null ? hotel.starRating : "—"}</span>
                </div>
                <div class="desc">${hotel.description || "No description yet."}</div>
                <div class="bottom-row">
                    <div class="price">
                        ${minPrice != null ? "from " + fmtLKR(minPrice) : "—"}
                        <small>per night</small>
                    </div>
                    <span class="avail-chip ${availCount > 0 ? "free" : "full"}">
                        ${totalCount ? `${availCount}/${totalCount} free tonight` : "No rooms yet"}
                    </span>
                </div>
            </div>
        `;
    }).join("");

    grid.querySelectorAll("[data-hotel-id]").forEach(card => {
        card.addEventListener("click", () => {
            window.location.href = `hotel.html?id=${card.dataset.hotelId}`;
        });
    });
}
