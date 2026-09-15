// bookings.js — bookings.html

requireAuth();
renderHeader("bookings");
initModalCloseHandlers();

const CANCELLABLE_STATUSES = ["PENDING", "CONFIRMED"];
const PAYABLE_STATUSES = ["PENDING"];
const INVOICE_STATUSES = ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "COMPLETED"];
const PAYMENT_METHODS = ["CREDIT_CARD", "DEBIT_CARD", "CASH", "BANK_TRANSFER", "ONLINE"];

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
                ${PAYABLE_STATUSES.includes(b.status)
        ? `<button class="btn btn-sm btn-primary" data-pay="${b.id}">Pay now</button>`
        : ""}
                ${INVOICE_STATUSES.includes(b.status)
        ? `<button class="btn btn-sm btn-outline" data-invoice="${b.id}">Invoice</button>`
        : ""}
                ${CANCELLABLE_STATUSES.includes(b.status)
        ? `<button class="btn btn-sm btn-danger" data-cancel="${b.id}">Cancel</button>`
        : ""}
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll("[data-cancel]").forEach(btn => {
        btn.addEventListener("click", () => cancelBooking(Number(btn.dataset.cancel)));
    });
    tbody.querySelectorAll("[data-pay]").forEach(btn => {
        btn.addEventListener("click", () => openPaymentModal(Number(btn.dataset.pay)));
    });
    tbody.querySelectorAll("[data-invoice]").forEach(btn => {
        btn.addEventListener("click", () => openInvoiceModal(Number(btn.dataset.invoice)));
    });
}

function openPaymentModal(bookingId) {
    const bodyHtml = `
        <form id="payment-form">
            <div class="field">
                <label>Payment method</label>
                <select id="field-payment-method" required>
                    ${PAYMENT_METHODS.map(m => `<option value="${m}">${m.replace("_", " ")}</option>`).join("")}
                </select>
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="payment-submit-btn">Pay now</button>
        </form>
    `;
    openModal("Pay for this booking", bodyHtml);

    document.getElementById("payment-form").addEventListener("submit", async event => {
        event.preventDefault();
        document.getElementById("modal-error").classList.remove("show");

        const method = document.getElementById("field-payment-method").value;
        const btn = document.getElementById("payment-submit-btn");
        btn.disabled = true;
        btn.textContent = "Processing…";

        try {
            const res = await authAjax("/api/payments", {
                method: "POST",
                body: JSON.stringify({ bookingId, method })
            });
            if (!res.ok) throw new Error(await errorMessage(res, "Could not process this payment."));

            closeModal();
            showToast("Payment successful — booking confirmed.");
            loadMyBookings();
        } catch (e) {
            modalErrorText(e.message);
        } finally {
            btn.disabled = false;
            btn.textContent = "Pay now";
        }
    });
}

async function openInvoiceModal(bookingId) {
    openModal("Invoice", `<p class="text-muted">Loading…</p>`);
    try {
        const res = await authAjax(`/api/invoices/booking/${bookingId}`);
        if (!res.ok) throw new Error(await errorMessage(res, "No invoice found for this booking."));
        const inv = await res.json();

        document.getElementById("modal-body").innerHTML = `
            <div class="field-row"><strong>Invoice #</strong><span>${inv.invoiceNumber}</span></div>
            <div class="field-row"><strong>Issued</strong><span>${inv.issuedDate}</span></div>
            <hr />
            <div class="field-row"><span>Subtotal</span><span>${fmtLKR(inv.subTotal)}</span></div>
            <div class="field-row"><span>Tax</span><span>${fmtLKR(inv.taxAmount)}</span></div>
            <div class="field-row"><strong>Total</strong><strong>${fmtLKR(inv.totalAmount)}</strong></div>
        `;
    } catch (e) {
        document.getElementById("modal-body").innerHTML = `<p class="text-muted">${e.message}</p>`;
    }
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