// admin.js — admin.html

requireStaffOrAdmin();
renderHeader("admin");
initModalCloseHandlers();

document.getElementById("admin-tab-users").classList.toggle("hidden", !isAdmin());

let cities = [];
let roomTypesCache = [];
let amenitiesCache = [];

let currentAdminTab = "hotels";
let adminRoomsHotelId = null;
let adminRoomsCache = [];
let adminExtraServicesHotelId = null;
let adminExtraServicesCache = [];

(async function init() {
    await loadLookupCaches();
    switchAdminTab("hotels");
})();

async function loadLookupCaches() {
    try {
        const [cRes, rtRes, aRes] = await Promise.all([
            authAjax("/api/cities"),
            authAjax("/api/room-types"),
            authAjax("/api/amenities")
        ]);
        cities = cRes.ok ? await cRes.json() : [];
        roomTypesCache = rtRes.ok ? await rtRes.json() : [];
        const aWrapped = aRes.ok ? await aRes.json() : { body: [] };
        amenitiesCache = aWrapped.body || [];
    } catch (e) {
        cities = [];
        roomTypesCache = [];
        amenitiesCache = [];
    }
}

document.getElementById("admin-tabs").addEventListener("click", event => {
    const btn = event.target.closest("button[data-tab]");
    if (!btn) return;
    switchAdminTab(btn.dataset.tab);
});

function switchAdminTab(tab) {
    currentAdminTab = tab;
    document.querySelectorAll("#admin-tabs button").forEach(b => b.classList.remove("active"));
    const btn = document.querySelector(`#admin-tabs button[data-tab="${tab}"]`);
    if (btn) btn.classList.add("active");
    document.getElementById("admin-error").classList.remove("show");
    ADMIN_TABS[tab].render();
}



// generatic


const RESOURCES = {


    cities: {
        title: "City",
        listPath: "/api/cities",
        unwrap: d => d,
        columns: [
            { key: "name", label: "Name" },
            { key: "country", label: "Country" }
        ],
        fields: [
            { key: "name", label: "Name", type: "text", required: true },
            { key: "country", label: "Country", type: "text", required: true }
        ],
        createPath: () => "/api/cities",
        updatePath: id => `/api/cities/${id}`,
        deletePath: id => `/api/cities/${id}`,
        canDelete: () => isAdmin()
    },


    roomTypes: {
        title: "Room type",
        listPath: "/api/room-types",
        unwrap: d => d,
        columns: [
            { key: "name", label: "Name" },
            { key: "description", label: "Description" },
            { key: "maxOccupancy", label: "Max occupancy" }
        ],
        fields: [
            { key: "name", label: "Name", type: "text", required: true },
            { key: "description", label: "Description", type: "textarea" },
            { key: "maxOccupancy", label: "Max occupancy", type: "number" }
        ],
        createPath: () => "/api/room-types",
        updatePath: id => `/api/room-types/${id}`,
        deletePath: id => `/api/room-types/${id}`,
        canDelete: () => isAdmin()
    },

    amenities: {
        title: "Amenity",
        listPath: "/api/amenities",
        unwrap: d => d.body || [],
        columns: [
            { key: "name", label: "Name" },
            { key: "description", label: "Description" },
            { key: "icon", label: "Icon" }
        ],
        fields: [
            { key: "name", label: "Name", type: "text", required: true },
            { key: "description", label: "Description", type: "textarea" },
            { key: "icon", label: "Icon", type: "text" }
        ],
        createPath: () => "/api/amenities",
        updatePath: id => `/api/amenities/${id}`,
        deletePath: id => `/api/amenities/${id}`,
        canDelete: () => isAdmin()
    },

    coupons: {
        title: "Coupon",
        listPath: "/api/coupons",
        unwrap: d => d,
        columns: [
            { key: "code", label: "Code" },
            { key: "discountType", label: "Type" },
            { key: "discountValue", label: "Value" },
            { key: "minBookingAmount", label: "Min booking" },
            { key: "expiryDate", label: "Expiry" },
            { key: "active", label: "Active", render: v => v ? "Yes" : "No" }
        ],
        fields: [
            { key: "code", label: "Code", type: "text", required: true },
            { key: "discountType", label: "Discount type", type: "select", required: true,
                options: [["PERCENTAGE", "Percentage"], ["FIXED", "Fixed amount"]] },
            { key: "discountValue", label: "Discount value", type: "number", step: "0.01", required: true },
            { key: "minBookingAmount", label: "Min booking amount", type: "number", step: "0.01" },
            { key: "expiryDate", label: "Expiry date", type: "date" }
        ],
        createPath: () => "/api/coupons",
        updatePath: null, // backend has no edit endpoint for coupons — only create / deactivate / delete
        deletePath: id => `/api/coupons/${id}`,
        canDelete: () => isAdmin(),
        extraAction: item => item.active
            ? `<button class="btn btn-sm btn-outline" data-act="custom" data-id="${item.id}">Deactivate</button>`
            : "",
        onCustomAction: async id => {
            try {
                const res = await authAjax(`/api/coupons/${id}/deactivate`, { method: "PATCH" });
                if (!res.ok) throw new Error(await errorMessage(res, "Could not deactivate this coupon."));
                showToast("Coupon deactivated.");
                ADMIN_TABS.coupons.render();
            } catch (e) {
                showToast(e.message);
            }
        }
    }
};



function renderField(f, item) {
    const value = item ? (item[f.key] != null ? item[f.key] : "") : "";

    if (f.type === "select") {
        return `
            <div class="field">
                <label>${f.label}</label>
                <select id="field-${f.key}" ${f.required ? "required" : ""}>
                    ${f.options.map(([v, l]) => `<option value="${v}" ${v === value ? "selected" : ""}>${l}</option>`).join("")}
                </select>
            </div>`;
    }
    if (f.type === "textarea") {
        return `
            <div class="field">
                <label>${f.label}</label>
                <textarea id="field-${f.key}" ${f.required ? "required" : ""}>${value}</textarea>
            </div>`;
    }
    return `
        <div class="field">
            <label>${f.label}</label>
            <input type="${f.type}" id="field-${f.key}" value="${value}" ${f.step ? `step="${f.step}"` : ""} ${f.required ? "required" : ""} />
        </div>`;
}

function openResourceForm(cfg, item) {
    const isEdit = !!item;
    const bodyHtml = `
        <form id="modal-form">
            ${cfg.fields.map(f => renderField(f, item)).join("")}
            <button type="submit" class="btn btn-primary btn-block">${isEdit ? "Save changes" : "Create"}</button>
        </form>
    `;

    openModal(`${isEdit ? "Edit" : "Add"} ${cfg.title.toLowerCase()}`, bodyHtml);

    document.getElementById("modal-form").addEventListener("submit", async event => {
        event.preventDefault();
        document.getElementById("modal-error").classList.remove("show");

        const payload = {};
        cfg.fields.forEach(f => {
            const el = document.getElementById(`field-${f.key}`);
            let val = el.value;
            if (val === "") val = null;
            if (val !== null && f.type === "number") val = Number(val);
            payload[f.key] = val;
        });

        try {
            const path = isEdit ? cfg.updatePath(item.id) : cfg.createPath();
            const res = await authAjax(path, {
                method: isEdit ? "PUT" : "POST",
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(await errorMessage(res, `Could not save this ${cfg.title.toLowerCase()}.`));

            closeModal();
            showToast(`${cfg.title} saved.`);
            ADMIN_TABS[currentAdminTab].render();
        } catch (e) {
            modalErrorText(e.message);
        }
    });
}

async function deleteResourceItem(cfg, id) {
    if (!confirm(`Delete this ${cfg.title.toLowerCase()}?`)) return;
    try {
        const res = await authAjax(cfg.deletePath(id), { method: "DELETE" });
        if (!res.ok) throw new Error(await errorMessage(res, `Could not delete this ${cfg.title.toLowerCase()}.`));
        showToast(`${cfg.title} deleted.`);
        ADMIN_TABS[currentAdminTab].render();
    } catch (e) {
        showToast(e.message);
    }
}


function renderGenericRows(cfg, items) {
    const tbody = document.getElementById("admin-table-body");

    if (!items.length) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="${cfg.columns.length + 1}">No records yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const cells = cfg.columns.map(c => {
            let v = item[c.key];
            if (c.render) v = c.render(v, item);
            return `<td>${v != null && v !== "" ? v : "—"}</td>`;
        }).join("");

        const actions = [];
        if (cfg.updatePath) actions.push(`<button class="btn btn-sm btn-outline" data-act="edit" data-id="${item.id}">Edit</button>`);
        if (cfg.extraAction) {
            const html = cfg.extraAction(item);
            if (html) actions.push(html);
        }
        if (cfg.deletePath && cfg.canDelete()) actions.push(`<button class="btn btn-sm btn-danger" data-act="delete" data-id="${item.id}">Delete</button>`);

        return `<tr>${cells}<td class="row-actions">${actions.join("")}</td></tr>`;
    }).join("");

    tbody.querySelectorAll("[data-act]").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            const item = items.find(i => i.id === id);
            const act = btn.dataset.act;
            if (act === "edit") openResourceForm(cfg, item);
            else if (act === "delete") deleteResourceItem(cfg, id);
            else if (act === "custom" && cfg.onCustomAction) cfg.onCustomAction(id, item);
        });
    });
}


function makeGenericTab(cfg) {
    return {
        async render() {
            document.getElementById("admin-toolbar").innerHTML =
                `<div class="toolbar-spacer"></div><button class="btn btn-primary btn-sm" id="admin-add-btn">Add ${cfg.title.toLowerCase()}</button>`;
            document.getElementById("admin-add-btn").addEventListener("click", () => openResourceForm(cfg, null));

            document.getElementById("admin-table-head").innerHTML =
                "<tr>" + cfg.columns.map(c => `<th>${c.label}</th>`).join("") + "<th></th></tr>";

            const tbody = document.getElementById("admin-table-body");
            tbody.innerHTML = `<tr class="empty-row"><td colspan="${cfg.columns.length + 1}">Loading…</td></tr>`;

            try {
                const res = await authAjax(cfg.listPath);
                if (!res.ok) throw new Error("Could not load data.");
                const items = cfg.unwrap(await res.json());
                renderGenericRows(cfg, items);
            } catch (e) {
                tbody.innerHTML = `<tr class="empty-row"><td colspan="${cfg.columns.length + 1}">${e.message}</td></tr>`;
            }
        }
    };
}




//  ----   hotels ------------

const hotelsTab = {
    async render() {
        document.getElementById("admin-toolbar").innerHTML =
            `<div class="toolbar-spacer"></div><button class="btn btn-primary btn-sm" id="admin-add-btn">Add hotel</button>`;
        document.getElementById("admin-add-btn").addEventListener("click", () => openHotelForm(null));

        document.getElementById("admin-table-head").innerHTML =
            "<tr><th>Name</th><th>City</th><th>Address</th><th>Rating</th><th>Phone</th><th>Photos</th><th></th></tr>";

        const tbody = document.getElementById("admin-table-body");
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Loading…</td></tr>`;

        try {
            const res = await authAjax("/api/hotels");
            if (!res.ok) throw new Error("Could not load hotels.");
            const hotels = await res.json();

            if (!hotels.length) {
                tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No hotels yet.</td></tr>`;
                return;
            }

            tbody.innerHTML = hotels.map(h => `
                <tr>
                    <td>${h.name}</td>
                    <td>${h.cityName || "—"}</td>
                    <td>${h.address || "—"}</td>
                    <td>${h.starRating != null ? h.starRating : "—"}</td>
                    <td>${h.phone || "—"}</td>
                    <td>${(h.images || []).length}</td>
                    <td class="row-actions">
                        <button class="btn btn-sm btn-outline" data-act="images" data-id="${h.id}">Images</button>
                        <button class="btn btn-sm btn-outline" data-act="edit" data-id="${h.id}">Edit</button>
                        ${isAdmin() ? `<button class="btn btn-sm btn-danger" data-act="delete" data-id="${h.id}">Delete</button>` : ""}
                    </td>
                </tr>
            `).join("");

            tbody.querySelectorAll("[data-act]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const id = Number(btn.dataset.id);
                    const hotel = hotels.find(x => x.id === id);
                    if (btn.dataset.act === "edit") openHotelForm(hotel);
                    else if (btn.dataset.act === "images") openHotelImagesModal(hotel);
                    else deleteHotel(id);
                });
            });
        } catch (e) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="7">${e.message}</td></tr>`;
        }
    }
};

function openHotelForm(hotel) {
    const isEdit = !!hotel;
    const matchedCity = hotel ? cities.find(c => c.name === hotel.cityName) : null;

    const bodyHtml = `
        <form id="modal-form">
            <div class="field"><label>Hotel name</label><input type="text" id="field-name" value="${hotel ? hotel.name : ""}" required /></div>
            <div class="field"><label>Description</label><textarea id="field-description">${hotel && hotel.description ? hotel.description : ""}</textarea></div>
            <div class="field"><label>Address</label><input type="text" id="field-address" value="${hotel ? hotel.address : ""}" required /></div>
            <div class="field-row">
                <div class="field">
                    <label>City</label>
                    <select id="field-cityId" required>
                        <option value="">Select…</option>
                        ${cities.map(c => `<option value="${c.id}" ${matchedCity && matchedCity.id === c.id ? "selected" : ""}>${c.name}, ${c.country}</option>`).join("")}
                    </select>
                </div>
                <div class="field"><label>Star rating</label><input type="number" id="field-starRating" min="0" max="5" step="0.1" value="${hotel && hotel.starRating != null ? hotel.starRating : ""}" /></div>
            </div>
            <div class="field-row">
                <div class="field"><label>Phone</label><input type="text" id="field-phone" value="${hotel && hotel.phone ? hotel.phone : ""}" /></div>
                <div class="field"><label>Email</label><input type="email" id="field-email" value="${hotel && hotel.email ? hotel.email : ""}" /></div>
            </div>
            <button type="submit" class="btn btn-primary btn-block">${isEdit ? "Save changes" : "Create hotel"}</button>
        </form>
    `;

    openModal(`${isEdit ? "Edit" : "Add"} hotel`, bodyHtml);

    document.getElementById("modal-form").addEventListener("submit", async event => {
        event.preventDefault();
        document.getElementById("modal-error").classList.remove("show");

        const payload = {
            name: document.getElementById("field-name").value,
            description: document.getElementById("field-description").value || null,
            address: document.getElementById("field-address").value,
            cityId: Number(document.getElementById("field-cityId").value),
            starRating: document.getElementById("field-starRating").value ? Number(document.getElementById("field-starRating").value) : null,
            phone: document.getElementById("field-phone").value || null,
            email: document.getElementById("field-email").value || null
        };

        try {
            const path = isEdit ? `/api/hotels/${hotel.id}` : "/api/hotels";
            const res = await authAjax(path, { method: isEdit ? "PUT" : "POST", body: JSON.stringify(payload) });
            if (!res.ok) throw new Error(await errorMessage(res, "Could not save this hotel."));

            closeModal();
            showToast("Hotel saved.");
            hotelsTab.render();
        } catch (e) {
            modalErrorText(e.message);
        }
    });
}

async function deleteHotel(id) {
    if (!confirm("Delete this hotel? This cannot be undone.")) return;
    try {
        const res = await authAjax(`/api/hotels/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await errorMessage(res, "Could not delete this hotel."));
        showToast("Hotel deleted.");
        hotelsTab.render();
    } catch (e) {
        showToast(e.message);
    }
}




// ----  hotel img -------

function hotelImagesModalBody(hotel) {
    const images = hotel.images || [];
    const galleryHtml = images.length
        ? `<div class="gallery-grid">
            ${images.map(img => `
                <div class="gallery-item" data-image-id="${img.id}">
                    <img src="${img.imageUrl}" alt="${img.caption || hotel.name}" />
                    <div class="cap">${img.caption || "—"}</div>
                    <button type="button" class="btn btn-sm btn-danger" data-del-image="${img.id}">Delete</button>
                </div>
            `).join("")}
        </div>`
        : `<p class="text-muted">No photos yet — add the hotel's first photo below.</p>`;

    return `
        ${galleryHtml}
        <form id="hotel-image-upload-form" style="margin-top:16px; border-top:1px solid var(--border); padding-top:14px;">
            <div class="field"><label>Photo</label><input type="file" id="field-image-file" accept="image/*" required /></div>
            <div class="field"><label>Caption (optional)</label><input type="text" id="field-image-caption" placeholder="e.g. Lobby, Pool view" /></div>
            <button type="submit" class="btn btn-primary btn-block" id="hotel-image-upload-btn">Upload &amp; add photo</button>
        </form>
    `;
}

async function openHotelImagesModal(hotel) {
    let currentHotel = hotel;
    openModal(`Photos — ${hotel.name}`, hotelImagesModalBody(currentHotel));
    wireHotelImagesModal(currentHotel, (updated) => {
        currentHotel = updated;
    });
}

function wireHotelImagesModal(hotel, onUpdate) {
    document.querySelectorAll("#modal-body [data-del-image]").forEach(btn => {
        btn.addEventListener("click", () => deleteHotelImage(hotel, Number(btn.dataset.delImage), onUpdate));
    });

    document.getElementById("hotel-image-upload-form").addEventListener("submit", async event => {
        event.preventDefault();
        document.getElementById("modal-error").classList.remove("show");

        const fileInput = document.getElementById("field-image-file");
        const caption = document.getElementById("field-image-caption").value.trim();
        const file = fileInput.files[0];

        if (!file) {
            modalErrorText("Choose a photo to upload.");
            return;
        }

        const uploadBtn = document.getElementById("hotel-image-upload-btn");
        uploadBtn.disabled = true;
        uploadBtn.textContent = "Uploading…";

        try {
            const formData = new FormData();
            formData.append("file", file);

            const uploadRes = await authUpload("/api/uploads/image", formData);
            if (!uploadRes.ok) throw new Error(await errorMessage(uploadRes, "Could not upload that photo."));
            const uploadBody = await uploadRes.json();
            const imageUrl = (uploadBody.body || uploadBody).url;

            const addRes = await authAjax(`/api/hotels/${hotel.id}/images`, {
                method: "POST",
                body: JSON.stringify({ imageUrl, caption: caption || null })
            });
            if (!addRes.ok) throw new Error(await errorMessage(addRes, "Could not attach that photo to the hotel."));

            showToast("Photo added.");
            await refreshHotelImagesModal(hotel, onUpdate);
            hotelsTab.render();
        } catch (e) {
            modalErrorText(e.message);
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = "Upload & add photo";
        }
    });
}

async function deleteHotelImage(hotel, imageId, onUpdate) {
    if (!confirm("Delete this photo?")) return;
    try {
        const res = await authAjax(`/api/hotels/${hotel.id}/images/${imageId}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await errorMessage(res, "Could not delete this photo."));
        showToast("Photo deleted.");
        await refreshHotelImagesModal(hotel, onUpdate);
        hotelsTab.render();
    } catch (e) {
        showToast(e.message);
    }
}

async function refreshHotelImagesModal(hotel, onUpdate) {
    try {
        const res = await authAjax(`/api/hotels/${hotel.id}`);
        if (!res.ok) throw new Error("Could not refresh photos.");
        const updated = await res.json();
        onUpdate(updated);
        document.getElementById("modal-body").innerHTML = hotelImagesModalBody(updated);
        wireHotelImagesModal(updated, onUpdate);
    } catch (e) {
        modalErrorText(e.message);
    }
}






// ------  hotels   ---------------

const roomsTab = {
    async render() {
        const toolbar = document.getElementById("admin-toolbar");
        toolbar.innerHTML = `
            <div class="field" style="margin:0; min-width:220px;">
                <label>Hotel</label>
                <select id="admin-rooms-hotel-select"><option value="">Select a hotel…</option></select>
            </div>
            <div class="toolbar-spacer"></div>
            <button class="btn btn-primary btn-sm" id="admin-add-btn" disabled>Add room</button>
        `;

        document.getElementById("admin-table-head").innerHTML =
            "<tr><th>Room No.</th><th>Floor</th><th>Type</th><th>Price / night</th><th>Status</th><th></th></tr>";

        let hotelsList = [];
        try {
            const res = await authAjax("/api/hotels");
            hotelsList = res.ok ? await res.json() : [];
        } catch (e) {
            hotelsList = [];
        }

        const hotelSelect = document.getElementById("admin-rooms-hotel-select");
        hotelSelect.innerHTML =
            `<option value="">Select a hotel…</option>` +
            hotelsList.map(h => `<option value="${h.id}" ${adminRoomsHotelId === h.id ? "selected" : ""}>${h.name}</option>`).join("");

        hotelSelect.addEventListener("change", () => {
            adminRoomsHotelId = hotelSelect.value ? Number(hotelSelect.value) : null;
            document.getElementById("admin-add-btn").disabled = !adminRoomsHotelId;
            loadAdminRooms();
        });

        document.getElementById("admin-add-btn").disabled = !adminRoomsHotelId;
        document.getElementById("admin-add-btn").addEventListener("click", () => openRoomForm(null));

        if (adminRoomsHotelId) {
            await loadAdminRooms();
        } else {
            document.getElementById("admin-table-body").innerHTML =
                `<tr class="empty-row"><td colspan="6">Pick a hotel above to see its rooms.</td></tr>`;
        }
    }
};

async function loadAdminRooms() {
    const tbody = document.getElementById("admin-table-body");
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Loading…</td></tr>`;

    try {
        const res = await authAjax(`/api/rooms/hotel/${adminRoomsHotelId}`);
        if (!res.ok) throw new Error("Could not load rooms.");
        adminRoomsCache = await res.json();
        renderAdminRoomsTable();
    } catch (e) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">${e.message}</td></tr>`;
    }
}

function renderAdminRoomsTable() {
    const tbody = document.getElementById("admin-table-body");

    if (!adminRoomsCache.length) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No rooms yet for this hotel.</td></tr>`;
        return;
    }

    tbody.innerHTML = adminRoomsCache.map(r => `
        <tr>
            <td>${r.roomNumber}</td>
            <td>${r.floorNo != null ? r.floorNo : "—"}</td>
            <td>${r.roomType}</td>
            <td>${fmtLKR(r.pricePerNight)}</td>
            <td><span class="badge badge-${(r.status || "").toLowerCase()}">${r.status}</span></td>
            <td class="row-actions">
                <button class="btn btn-sm btn-outline" data-act="edit" data-id="${r.id}">Edit</button>
                <button class="btn btn-sm btn-danger" data-act="delete" data-id="${r.id}">Delete</button>
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll("[data-act]").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            const room = adminRoomsCache.find(r => r.id === id);
            if (btn.dataset.act === "edit") openRoomForm(room);
            else deleteRoom(id);
        });
    });
}

function openRoomForm(room) {
    const isEdit = !!room;
    const matchedType = room ? roomTypesCache.find(t => t.name === room.roomType) : null;
    const selectedAmenityNames = room ? (room.amenities || []) : [];

    const bodyHtml = `
        <form id="modal-form">
            <div class="field"><label>Room number</label><input type="text" id="field-roomNumber" value="${room ? room.roomNumber : ""}" required /></div>
            <div class="field-row">
                <div class="field"><label>Floor</label><input type="number" id="field-floorNo" min="0" value="${room && room.floorNo != null ? room.floorNo : ""}" /></div>
                <div class="field">
                    <label>Room type</label>
                    <select id="field-roomTypeId" required>
                        <option value="">Select…</option>
                        ${roomTypesCache.map(t => `<option value="${t.id}" ${matchedType && matchedType.id === t.id ? "selected" : ""}>${t.name}</option>`).join("")}
                    </select>
                </div>
            </div>
            <div class="field"><label>Price per night (LKR)</label><input type="number" id="field-pricePerNight" min="0" step="1" value="${room ? room.pricePerNight : ""}" required /></div>
            <div class="field">
                <label>Amenities</label>
                <div class="checkbox-row">
                    ${amenitiesCache.map(a => `
                        <label><input type="checkbox" value="${a.id}" ${selectedAmenityNames.includes(a.name) ? "checked" : ""} /> ${a.name}</label>
                    `).join("")}
                </div>
            </div>
            <button type="submit" class="btn btn-primary btn-block">${isEdit ? "Save changes" : "Add room"}</button>
        </form>
    `;

    openModal(`${isEdit ? "Edit" : "Add"} room`, bodyHtml);

    document.getElementById("modal-form").addEventListener("submit", async event => {
        event.preventDefault();
        document.getElementById("modal-error").classList.remove("show");

        const amenityIds = Array.from(document.querySelectorAll('#modal-form input[type="checkbox"]:checked'))
            .map(cb => Number(cb.value));

        const payload = {
            hotelId: adminRoomsHotelId,
            roomTypeId: Number(document.getElementById("field-roomTypeId").value),
            roomNumber: document.getElementById("field-roomNumber").value,
            floorNo: document.getElementById("field-floorNo").value ? Number(document.getElementById("field-floorNo").value) : null,
            pricePerNight: Number(document.getElementById("field-pricePerNight").value),
            amenityIds
        };

        try {
            const path = isEdit ? `/api/rooms/${room.id}` : "/api/rooms";
            const res = await authAjax(path, { method: isEdit ? "PUT" : "POST", body: JSON.stringify(payload) });
            if (!res.ok) throw new Error(await errorMessage(res, "Could not save this room."));

            closeModal();
            showToast("Room saved.");
            loadAdminRooms();
        } catch (e) {
            modalErrorText(e.message);
        }
    });
}

async function deleteRoom(id) {
    if (!confirm("Delete this room?")) return;
    try {
        const res = await authAjax(`/api/rooms/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await errorMessage(res, "Could not delete this room."));
        showToast("Room deleted.");
        loadAdminRooms();
    } catch (e) {
        showToast(e.message);
    }
}








// --------       extra services   --------

const extraServicesTab = {
    async render() {
        const toolbar = document.getElementById("admin-toolbar");
        toolbar.innerHTML = `
            <div class="field" style="margin:0; min-width:220px;">
                <label>Hotel</label>
                <select id="admin-es-hotel-select"><option value="">Select a hotel…</option></select>
            </div>
            <div class="toolbar-spacer"></div>
            <button class="btn btn-primary btn-sm" id="admin-add-btn" disabled>Add service</button>
        `;

        document.getElementById("admin-table-head").innerHTML =
            "<tr><th>Name</th><th>Description</th><th>Price</th><th></th></tr>";

        let hotelsList = [];
        try {
            const res = await authAjax("/api/hotels");
            hotelsList = res.ok ? await res.json() : [];
        } catch (e) {
            hotelsList = [];
        }

        const hotelSelect = document.getElementById("admin-es-hotel-select");
        hotelSelect.innerHTML =
            `<option value="">Select a hotel…</option>` +
            hotelsList.map(h => `<option value="${h.id}" ${adminExtraServicesHotelId === h.id ? "selected" : ""}>${h.name}</option>`).join("");

        hotelSelect.addEventListener("change", () => {
            adminExtraServicesHotelId = hotelSelect.value ? Number(hotelSelect.value) : null;
            document.getElementById("admin-add-btn").disabled = !adminExtraServicesHotelId;
            loadAdminExtraServices();
        });

        document.getElementById("admin-add-btn").disabled = !adminExtraServicesHotelId;
        document.getElementById("admin-add-btn").addEventListener("click", () => openExtraServiceForm(null));

        if (adminExtraServicesHotelId) {
            await loadAdminExtraServices();
        } else {
            document.getElementById("admin-table-body").innerHTML =
                `<tr class="empty-row"><td colspan="4">Pick a hotel above to see its extra services.</td></tr>`;
        }
    }
};

async function loadAdminExtraServices() {
    const tbody = document.getElementById("admin-table-body");
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Loading…</td></tr>`;

    try {
        const res = await authAjax(`/api/extra-services/hotel/${adminExtraServicesHotelId}`);
        if (!res.ok) throw new Error("Could not load extra services.");
        const wrapped = await res.json();
        adminExtraServicesCache = wrapped.body || [];
        renderAdminExtraServicesTable();
    } catch (e) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="4">${e.message}</td></tr>`;
    }
}

function renderAdminExtraServicesTable() {
    const tbody = document.getElementById("admin-table-body");

    if (!adminExtraServicesCache.length) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="4">No extra services yet for this hotel.</td></tr>`;
        return;
    }

    tbody.innerHTML = adminExtraServicesCache.map(s => `
        <tr>
            <td>${s.name}</td>
            <td>${s.description || "—"}</td>
            <td>${fmtLKR(s.price)}</td>
            <td class="row-actions">
                <button class="btn btn-sm btn-outline" data-act="edit" data-id="${s.id}">Edit</button>
                <button class="btn btn-sm btn-danger" data-act="delete" data-id="${s.id}">Delete</button>
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll("[data-act]").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = Number(btn.dataset.id);
            const item = adminExtraServicesCache.find(s => s.id === id);
            if (btn.dataset.act === "edit") openExtraServiceForm(item);
            else deleteExtraService(id);
        });
    });
}

function openExtraServiceForm(item) {
    const isEdit = !!item;
    const bodyHtml = `
        <form id="modal-form">
            <div class="field"><label>Name</label><input type="text" id="field-name" value="${item ? item.name : ""}" required /></div>
            <div class="field"><label>Description</label><textarea id="field-description">${item && item.description ? item.description : ""}</textarea></div>
            <div class="field"><label>Price (LKR)</label><input type="number" id="field-price" min="0" step="0.01" value="${item ? item.price : ""}" required /></div>
            <button type="submit" class="btn btn-primary btn-block">${isEdit ? "Save changes" : "Add service"}</button>
        </form>
    `;

    openModal(`${isEdit ? "Edit" : "Add"} extra service`, bodyHtml);

    document.getElementById("modal-form").addEventListener("submit", async event => {
        event.preventDefault();
        document.getElementById("modal-error").classList.remove("show");

        const payload = {
            hotelId: adminExtraServicesHotelId,
            name: document.getElementById("field-name").value,
            description: document.getElementById("field-description").value || null,
            price: Number(document.getElementById("field-price").value)
        };

        try {
            const path = isEdit ? `/api/extra-services/${item.id}` : "/api/extra-services";
            const res = await authAjax(path, { method: isEdit ? "PUT" : "POST", body: JSON.stringify(payload) });
            if (!res.ok) throw new Error(await errorMessage(res, "Could not save this service."));

            closeModal();
            showToast("Extra service saved.");
            loadAdminExtraServices();
        } catch (e) {
            modalErrorText(e.message);
        }
    });
}

async function deleteExtraService(id) {
    if (!confirm("Delete this service?")) return;
    try {
        const res = await authAjax(`/api/extra-services/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error(await errorMessage(res, "Could not delete this service."));
        showToast("Deleted.");
        loadAdminExtraServices();
    } catch (e) {
        showToast(e.message);
    }
}




// -------  booking --------

const bookingsTab = {
    async render() {
        document.getElementById("admin-toolbar").innerHTML = "";
        document.getElementById("admin-table-head").innerHTML =
            "<tr><th>Guest</th><th>Hotel</th><th>Room</th><th>Dates</th><th>Guests</th><th>Total</th><th>Status</th></tr>";

        const tbody = document.getElementById("admin-table-body");
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Loading…</td></tr>`;

        try {
            const res = await authAjax("/api/bookings");
            if (!res.ok) throw new Error("Could not load bookings.");
            const bookings = await res.json();

            if (!bookings.length) {
                tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No bookings yet.</td></tr>`;
                return;
            }

            const statuses = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "COMPLETED"];

            tbody.innerHTML = bookings.map(b => `
                <tr>
                    <td>${b.guestName}</td>
                    <td>${b.hotelName}</td>
                    <td>${b.roomNumber}</td>
                    <td>${b.checkInDate} &rarr; ${b.checkOutDate}</td>
                    <td>${b.numberOfGuests}</td>
                    <td>${fmtLKR(b.totalAmount)}</td>
                    <td>
                        <select data-booking-status="${b.id}">
                            ${statuses.map(s => `<option value="${s}" ${s === b.status ? "selected" : ""}>${s}</option>`).join("")}
                        </select>
                    </td>
                </tr>
            `).join("");

            tbody.querySelectorAll("[data-booking-status]").forEach(sel => {
                sel.addEventListener("change", async () => {
                    try {
                        const res2 = await authAjax(`/api/bookings/${sel.dataset.bookingStatus}/status?status=${sel.value}`, { method: "PATCH" });
                        if (!res2.ok) throw new Error(await errorMessage(res2, "Could not update status."));
                        showToast("Booking status updated.");
                    } catch (e) {
                        showToast(e.message);
                    }
                });
            });
        } catch (e) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="7">${e.message}</td></tr>`;
        }
    }
};




//---------   USers   ------------------

const usersTab = {
    async render() {
        document.getElementById("admin-toolbar").innerHTML = "";
        document.getElementById("admin-table-head").innerHTML =
            "<tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th></th></tr>";

        const tbody = document.getElementById("admin-table-body");
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Loading…</td></tr>`;

        try {
            const res = await authAjax("/api/users");
            if (!res.ok) throw new Error("Could not load users.");
            const users = await res.json();

            if (!users.length) {
                tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No users yet.</td></tr>`;
                return;
            }

            const roles = ["ADMIN", "STAFF", "CUSTOMER", "GUEST"];

            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>${u.fullName}</td>
                    <td>${u.email}</td>
                    <td>${u.phone || "—"}</td>
                    <td>
                        <select data-user-role="${u.id}">
                            ${roles.map(r => `<option value="${r}" ${(u.roles || []).includes(r) ? "selected" : ""}>${r}</option>`).join("")}
                        </select>
                    </td>
                    <td><span class="badge badge-${u.active ? "active" : "inactive"}">${u.active ? "Active" : "Inactive"}</span></td>
                    <td class="row-actions">
                        <button class="btn btn-sm btn-outline" data-deactivate="${u.id}" ${!u.active ? "disabled" : ""}>Deactivate</button>
                        <button class="btn btn-sm btn-danger" data-delete-user="${u.id}">Delete</button>
                    </td>
                </tr>
            `).join("");

            tbody.querySelectorAll("[data-user-role]").forEach(sel => {
                sel.addEventListener("change", async () => {
                    try {
                        const res2 = await authAjax(`/api/users/${sel.dataset.userRole}/role?role=${sel.value}`, { method: "PATCH" });
                        if (!res2.ok) throw new Error(await errorMessage(res2, "Could not update role."));
                        showToast("Role updated.");
                    } catch (e) {
                        showToast(e.message);
                    }
                });
            });

            tbody.querySelectorAll("[data-deactivate]").forEach(btn => {
                btn.addEventListener("click", async () => {
                    try {
                        const res2 = await authAjax(`/api/users/${btn.dataset.deactivate}/deactivate`, { method: "PATCH" });
                        if (!res2.ok) throw new Error(await errorMessage(res2, "Could not deactivate this user."));
                        showToast("User deactivated.");
                        usersTab.render();
                    } catch (e) {
                        showToast(e.message);
                    }
                });
            });

            tbody.querySelectorAll("[data-delete-user]").forEach(btn => {
                btn.addEventListener("click", async () => {
                    if (!confirm("Delete this user?")) return;
                    try {
                        const res2 = await authAjax(`/api/users/${btn.dataset.deleteUser}`, { method: "DELETE" });
                        if (!res2.ok) throw new Error(await errorMessage(res2, "Could not delete this user."));
                        showToast("User deleted.");
                        usersTab.render();
                    } catch (e) {
                        showToast(e.message);
                    }
                });
            });
        } catch (e) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="6">${e.message}</td></tr>`;
        }
    }
};




const ADMIN_TABS = {
    hotels: hotelsTab,
    rooms: roomsTab,
    roomTypes: makeGenericTab(RESOURCES.roomTypes),
    amenities: makeGenericTab(RESOURCES.amenities),
    cities: makeGenericTab(RESOURCES.cities),
    coupons: makeGenericTab(RESOURCES.coupons),
    extraServices: extraServicesTab,
    bookings: bookingsTab,
    users: usersTab
};
