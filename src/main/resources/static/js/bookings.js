// bookings.js — bookings.html

requireAuth();
renderHeader("bookings");

const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED"];

(async function init() {
    await loadMyBookings();
})();

async function loadMyBookings() {
    const tbody = document.getElementById("bookings-table-body");
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">Loading…</td></tr>`;

    try {
        const res = await authAjax("/api/bookings/me");
        if (!res.ok) throw new Error("Could not load your bookings.");
        const bookings = await res.json();
        renderBookings(bookings);
    } catch (e) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="8">${e.message}</td></tr>`;
    }
}

function renderBookings(bookings) {
    const tbody = document.getElementById("bookings-table-body");

    if (!bookings.length) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="8">You have no bookings yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = bookings.map(b => `
        <tr>
            <td>${b.hotelName || "—"}</td>
            <td>${b.roomNumber || "—"}</td>
            <td>${b.checkInDate}</td>
            <td>${b.checkOutDate}</td>
            <td>${b.numberOfGuests}</td>
            <td>${fmtLKR(b.totalAmount)}</td>
            <td><span class="badge badge-${(b.status || "").toLowerCase()}">${b.status}</span></td>
            <td class="row-actions">
                ${CANCELLABLE_STATUSES.includes(b.status)
                    ? `<button class="btn btn-sm btn-danger" data-cancel="${b.id}">Cancel</button>`
                    : ""}
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll("[data-cancel]").forEach(btn => {
        btn.addEventListener("click", () => cancelBooking(Number(btn.dataset.cancel)));
    });
}

async function cancelBooking(id) {
    if (!confirm("Cancel this booking?")) return;
    try {
        const res = await authAjax(`/api/bookings/${id}/cancel`, { method: "PATCH" });
        if (!res.ok) throw new Error(await errorMessage(res, "Could not cancel this booking."));
        showToast("Booking cancelled.");
        loadMyBookings();
    } catch (e) {
        showToast(e.message);
    }
}
