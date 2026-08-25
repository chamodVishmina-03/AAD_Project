

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