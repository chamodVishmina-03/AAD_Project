// hotel.js — hotel.html (?id=<hotelId>)

requireAuth();
renderHeader("home");
initModalCloseHandlers();

const hotelId = new URLSearchParams(window.location.search).get("id");
let currentHotel = null;
let hotelExtraServicesCache = [];

if (!hotelId) {
    window.location.href = "index.html";
}

(async function init() {
    await loadHotel();
})();

async function loadHotel() {
    try {
        const res = await authAjax(`/api/hotels/${hotelId}`);
        if (!res.ok) throw new Error("Could not load that hotel.");
        currentHotel = await res.json();
    } catch (e) {
        showToast(e.message);
        setTimeout(() => window.location.href = "index.html", 1200);
        return;
    }

    document.title = `${currentHotel.name} — Just Click`;
    document.getElementById("hotel-name").textContent = currentHotel.name;
    document.getElementById("hotel-meta").textContent =
        `${currentHotel.cityName || "—"}${currentHotel.country ? ", " + currentHotel.country : ""} · ★ ${currentHotel.starRating != null ? currentHotel.starRating : "—"}`;
    document.getElementById("hotel-description").textContent = currentHotel.description || "No description yet.";
    document.getElementById("hotel-address").textContent = currentHotel.address || "—";
    document.getElementById("hotel-phone").textContent = currentHotel.phone || "—";
    document.getElementById("hotel-email").textContent = currentHotel.email || "—";
    renderHotelPhotos(currentHotel);

    await loadHotelRooms();
    resetAvailabilityWidget();
    await loadHotelExtraServices();
    await loadHotelReviews();
}

function renderHotelPhotos(hotel) {
    const card = document.getElementById("hotel-photos-card");
    const gallery = document.getElementById("hotel-photos-gallery");
    const images = hotel.images || (hotel.imageUrls || []).map(url => ({ imageUrl: url, caption: null }));

    if (!images.length) {
        card.classList.add("hidden");
        return;
    }

    card.classList.remove("hidden");
    gallery.innerHTML = images.map(img => `
        <div class="gallery-item">
            <img src="${img.imageUrl}" alt="${img.caption || hotel.name}" />
            ${img.caption ? `<div class="cap">${img.caption}</div>` : ""}
        </div>
    `).join("");
}

async function loadHotelRooms() {
    const tbody = document.querySelector("#hotel-rooms-table tbody");
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Loading…</td></tr>`;

    try {
        const res = await authAjax(`/api/rooms/hotel/${hotelId}`);
        if (!res.ok) throw new Error("Could not load rooms.");
        const rooms = await res.json();

        if (!rooms.length) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No rooms added yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = rooms.map(r => `
            <tr>
                <td>${r.roomNumber}</td>
                <td>${r.floorNo != null ? r.floorNo : "—"}</td>
                <td>${r.roomType}</td>
                <td>${fmtLKR(r.pricePerNight)}</td>
                <td><span class="badge badge-${(r.status || "").toLowerCase()}">${r.status}</span></td>
                <td>${(r.amenities || []).join(", ") || "—"}</td>
            </tr>
        `).join("");
    } catch (e) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">${e.message}</td></tr>`;
    }
}

function resetAvailabilityWidget() {
    document.getElementById("avail-checkin").value = isoDateInDays(1);
    document.getElementById("avail-checkout").value = isoDateInDays(2);
    document.getElementById("avail-guests").value = 2;
    document.getElementById("availability-error").classList.remove("show");
    document.querySelector("#available-rooms-table tbody").innerHTML = "";

    const empty = document.getElementById("available-rooms-empty");
    empty.textContent = "Pick your dates and check availability to see bookable rooms.";
    empty.classList.remove("hidden");
}

document.getElementById("check-availability-btn").addEventListener("click", checkAvailability);

async function checkAvailability() {
    const errorEl = document.getElementById("availability-error");
    errorEl.classList.remove("show");

    const checkIn = document.getElementById("avail-checkin").value;
    const checkOut = document.getElementById("avail-checkout").value;

    if (!checkIn || !checkOut || checkIn >= checkOut) {
        errorEl.textContent = "Pick a check-out date after the check-in date.";
        errorEl.classList.add("show");
        return;
    }

    const tbody = document.querySelector("#available-rooms-table tbody");
    const empty = document.getElementById("available-rooms-empty");

    tbody.innerHTML = "";
    empty.textContent = "Checking…";
    empty.classList.remove("hidden");

    try {
        const res = await authAjax(`/api/rooms/available?hotelId=${hotelId}&checkIn=${checkIn}&checkOut=${checkOut}`);
        if (!res.ok) throw new Error("Could not check availability.");
        const rooms = await res.json();

        if (!rooms.length) {
            empty.textContent = "No rooms are free for those dates — try different dates.";
            empty.classList.remove("hidden");
            return;
        }

        empty.classList.add("hidden");

        tbody.innerHTML = rooms.map(r => `
            <tr>
                <td>${r.roomNumber}</td>
                <td>${r.roomType}</td>
                <td>${fmtLKR(r.pricePerNight)}</td>
                <td class="text-right"><button class="btn btn-sm btn-primary" data-book-room="${r.id}">Book</button></td>
            </tr>
        `).join("");

        tbody.querySelectorAll("[data-book-room]").forEach(btn => {
            btn.addEventListener("click", () => {
                const room = rooms.find(r => r.id === Number(btn.dataset.bookRoom));
                openBookingModal(room, checkIn, checkOut);
            });
        });

    } catch (e) {
        errorEl.textContent = e.message;
        errorEl.classList.add("show");
        empty.textContent = "Could not load availability.";
        empty.classList.remove("hidden");
    }
}

async function loadHotelExtraServices() {
    const tbody = document.querySelector("#hotel-extra-services-table tbody");
    tbody.innerHTML = `<tr class="empty-row"><td colspan="3">Loading…</td></tr>`;

    try {
        const res = await authAjax(`/api/extra-services/hotel/${hotelId}`);
        if (!res.ok) throw new Error("Could not load extra services.");
        const wrapped = await res.json();
        hotelExtraServicesCache = wrapped.body || [];

        if (!hotelExtraServicesCache.length) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="3">No extra services for this hotel.</td></tr>`;
            return;
        }

        tbody.innerHTML = hotelExtraServicesCache.map(s => `
            <tr><td>${s.name}</td><td>${s.description || "—"}</td><td>${fmtLKR(s.price)}</td></tr>
        `).join("");
    } catch (e) {
        hotelExtraServicesCache = [];
        tbody.innerHTML = `<tr class="empty-row"><td colspan="3">${e.message}</td></tr>`;
    }
}

async function loadHotelReviews() {
    const list = document.getElementById("hotel-reviews-list");
    const empty = document.getElementById("hotel-reviews-empty");
    list.innerHTML = "";
    empty.classList.add("hidden");

    try {
        const res = await authAjax(`/api/reviews/hotel/${hotelId}`);
        if (!res.ok) throw new Error("Could not load reviews.");
        const reviews = await res.json();

        if (!reviews.length) {
            empty.textContent = "No reviews yet.";
            empty.classList.remove("hidden");
            return;
        }

        list.innerHTML = reviews.map(r => `
            <div class="review-item">
                <div class="head">
                    <span>${r.reviewerName}</span>
                    <span class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
                </div>
                <div class="comment">${r.comment || ""}</div>
            </div>
        `).join("");
    } catch (e) {
        empty.textContent = e.message;
        empty.classList.remove("hidden");
    }
}

document.getElementById("ai-summary-btn").addEventListener("click", async () => {
    const btn = document.getElementById("ai-summary-btn");
    const box = document.getElementById("ai-summary-box");
    const text = document.getElementById("ai-summary-text");

    btn.disabled = true;
    btn.textContent = "Summarizing…";
    box.classList.remove("hidden");
    text.textContent = "Reading the reviews…";

    try {
        const res = await authAjax(`/api/ai/hotels/${hotelId}/review-summary`);
        if (!res.ok) throw new Error(await errorMessage(res, "Could not summarize reviews right now."));
        const wrapped = await res.json();
        const summary = wrapped.body || {};
        text.textContent = summary.summary || "No summary available.";
    } catch (e) {
        text.textContent = e.message;
    } finally {
        btn.disabled = false;
        btn.textContent = "✨ AI summary";
    }
});

document.getElementById("submit-review-btn").addEventListener("click", async () => {
    const rating = Number(document.getElementById("review-rating").value);
    const comment = document.getElementById("review-comment").value.trim();

    try {
        const res = await authAjax("/api/reviews", {
            method: "POST",
            body: JSON.stringify({ hotelId: Number(hotelId), rating, comment: comment || null })
        });
        if (!res.ok) throw new Error(await errorMessage(res, "Could not post your review."));

        document.getElementById("review-comment").value = "";
        showToast("Review posted. Thank you!");
        loadHotelReviews();
    } catch (e) {
        showToast(e.message);
    }
});


// ------------------------------------------------------------
// Booking modal
// ------------------------------------------------------------

function openBookingModal(room, checkIn, checkOut) {
    const servicesHtml = hotelExtraServicesCache.length
        ? `<div class="field">
            <label>Extra services (optional)</label>
            <div class="checkbox-row" id="extra-services-row">
                ${hotelExtraServicesCache.map(s => `
                    <label>
                        <input type="checkbox" class="extra-service-check" value="${s.id}" />
                        ${s.name} (${fmtLKR(s.price)})
                        <input type="number" class="extra-service-qty" data-for="${s.id}" min="1" value="1" disabled
                               style="width:52px; margin-left:6px;" />
                    </label>
                `).join("")}
            </div>
        </div>`
        : "";

    const bodyHtml = `
        <form id="modal-form">
            <div class="field-row">
                <div class="field"><label>Check-in</label><input type="date" id="field-checkin" value="${checkIn}" required /></div>
                <div class="field"><label>Check-out</label><input type="date" id="field-checkout" value="${checkOut}" required /></div>
            </div>
            <div class="field"><label>Guests</label><input type="number" id="field-guests" min="1" value="2" required /></div>
            ${servicesHtml}
            <div class="field"><label>Coupon code (optional)</label><input type="text" id="field-coupon" /></div>
            <button type="submit" class="btn btn-primary btn-block">Confirm booking — Room ${room.roomNumber}</button>
        </form>
    `;

    openModal(`Book room ${room.roomNumber} — ${room.roomType}`, bodyHtml);

    document.querySelectorAll(".extra-service-check").forEach(cb => {
        cb.addEventListener("change", () => {
            const qtyInput = document.querySelector(`.extra-service-qty[data-for="${cb.value}"]`);
            if (qtyInput) qtyInput.disabled = !cb.checked;
        });
    });

    document.getElementById("modal-form").addEventListener("submit", async event => {
        event.preventDefault();
        document.getElementById("modal-error").classList.remove("show");

        const checkInDate = document.getElementById("field-checkin").value;
        const checkOutDate = document.getElementById("field-checkout").value;
        const numberOfGuests = Number(document.getElementById("field-guests").value);
        const couponCode = document.getElementById("field-coupon").value.trim();

        if (checkInDate >= checkOutDate) {
            modalErrorText("Check-out date must be after check-in date.");
            return;
        }

        const extraServices = Array.from(document.querySelectorAll(".extra-service-check:checked"))
            .map(cb => {
                const qtyInput = document.querySelector(`.extra-service-qty[data-for="${cb.value}"]`);
                const quantity = qtyInput ? Math.max(1, Number(qtyInput.value) || 1) : 1;
                return { extraServiceId: Number(cb.value), quantity };
            });

        try {
            const res = await authAjax("/api/bookings", {
                method: "POST",
                body: JSON.stringify({
                    roomId: room.id,
                    checkInDate,
                    checkOutDate,
                    numberOfGuests,
                    couponCode: couponCode || null,
                    extraServices
                })
            });
            if (!res.ok) throw new Error(await errorMessage(res, "This room is no longer available for those dates."));

            const booking = await res.json();
            closeModal();
            showToast(`Booked! Room ${booking.roomNumber}, ${booking.checkInDate} → ${booking.checkOutDate}.`);
            checkAvailability();
        } catch (e) {
            modalErrorText(e.message);
        }
    });
}
