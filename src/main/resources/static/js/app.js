

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