// ===== Data =====
const countries = [
  "India", "United States", "United Kingdom", "France", "Germany", "Japan", "Australia", "UAE", "Singapore", "Canada"
];

const basePrices = {
  "India": 5000,
  "United States": 45000,
  "United Kingdom": 38000,
  "France": 36000,
  "Germany": 35000,
  "Japan": 42000,
  "Australia": 40000,
  "UAE": 18000,
  "Singapore": 22000,
  "Canada": 43000
};

const popularFlights = [
  { from: "India", to: "United States", airline: "SkyFast Air", duration: "15h", stops: 1, price: basePrices["United States"] },
  { from: "India", to: "United Kingdom", airline: "BritFly", duration: "9h", stops: 0, price: basePrices["United Kingdom"] },
  { from: "India", to: "UAE", airline: "DesertWing", duration: "3h", stops: 0, price: basePrices["UAE"] },
  { from: "India", to: "Singapore", airline: "PacificJet", duration: "5h", stops: 0, price: basePrices["Singapore"] }
];

// ===== State =====
const state = {
  loggedIn: false,
  search: null,            // {from, to, date, classType, passengers}
  selectedFlight: null,    // {airline, from, to, duration, basePrice}
  seats: new Set(),        // e.g., "A1", "B2"
  passenger: null,         // {name, email, phone, passport}
  paymentDone: false
};

// ===== Elements =====
const tabs = document.querySelectorAll(".tab-btn");
const sections = document.querySelectorAll(".tab");
const authStatus = document.getElementById("authStatus");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const closeLogin = document.getElementById("closeLogin");

const fromSelect = document.getElementById("fromCountry");
const toSelect = document.getElementById("toCountry");
const searchForm = document.getElementById("searchForm");
const availableFlights = document.getElementById("availableFlights");
const seatMap = document.getElementById("seatMap");
const autoAssignSeatsBtn = document.getElementById("autoAssignSeats");
const clearSeatsBtn = document.getElementById("clearSeats");
const toPassengerBtn = document.getElementById("toPassenger");
const loginNotice = document.getElementById("loginNotice");

const passengerForm = document.getElementById("passengerForm");
const orderSummary = document.getElementById("orderSummary");
const paymentForm = document.getElementById("paymentForm");
const paymentStatus = document.getElementById("paymentStatus");

const popularList = document.getElementById("popularList");
const contactForm = document.getElementById("contactForm");
const contactStatus = document.getElementById("contactStatus");

// Helper to safely add event listeners when elements may be absent
function safeAdd(el, type, handler) {
  if (!el) return;
  el.addEventListener(type, handler);
}
// ===== Tab navigation =====
function openTab(id) {
  sections.forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
tabs.forEach(btn => {
  btn.addEventListener("click", () => openTab(btn.dataset.tab));
});
document.querySelectorAll(".cta .btn").forEach(btn => {
  btn.addEventListener("click", () => openTab(btn.dataset.tab));
});

// ===== Auth =====
safeAdd(loginBtn, "click", () => { if (loginModal && loginModal.showModal) loginModal.showModal(); });
safeAdd(closeLogin, "click", e => {
  e.preventDefault();
  if (loginModal && loginModal.close) loginModal.close();
});
safeAdd(loginForm, "submit", e => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const pass = document.getElementById("loginPassword").value.trim();
  if (email && pass) {
    state.loggedIn = true;
    if (authStatus) {
      authStatus.textContent = "Logged in";
      authStatus.classList.add("tag");
    }
    if (loginBtn) loginBtn.hidden = true;
    if (logoutBtn) logoutBtn.hidden = false;
    if (loginModal && loginModal.close) loginModal.close();
  }
});
safeAdd(logoutBtn, "click", () => {
  state.loggedIn = false;
  if (authStatus) authStatus.textContent = "Guest";
  if (loginBtn) loginBtn.hidden = false;
  if (logoutBtn) logoutBtn.hidden = true;
  state.selectedFlight = null;
  state.seats.clear();
  state.passenger = null;
  state.paymentDone = false;
  renderAvailableFlights([]);
  renderSeatMap([]);
  if (paymentStatus) paymentStatus.textContent = "";
  openTab("home");
});

// ===== Populate selects =====
function populateCountrySelects() {
  countries.forEach(c => {
    const opt1 = document.createElement("option");
    opt1.value = c; opt1.textContent = c;
    const opt2 = opt1.cloneNode(true);
    fromSelect.appendChild(opt1);
    toSelect.appendChild(opt2);
  });
  fromSelect.value = "India";
  toSelect.value = "United States";
}
populateCountrySelects();

// ===== Popular flights =====
function renderPopular() {
  popularList.innerHTML = "";
  popularFlights.forEach(f => {
    const el = document.createElement("div");
    el.className = "flight-card";
    el.innerHTML = `
      <h4>${f.airline}</h4>
      <div class="flight-meta">
        <span>${f.from} → ${f.to}</span>
        <span>${f.duration}, ${f.stops} stop${f.stops !== 1 ? "s" : ""}</span>
      </div>
      <div class="actions">
        <span class="price">₹${f.price.toLocaleString()}</span>
        <button class="btn primary">Book</button>
      </div>
    `;
    el.querySelector("button").addEventListener("click", () => {
      openTab("booking");
      fromSelect.value = f.from;
      toSelect.value = f.to;
      document.getElementById("classType").value = "economy";
    });
    popularList.appendChild(el);
  });
}
renderPopular();

// ===== Search flights =====
safeAdd(searchForm, "submit", e => {
  e.preventDefault();
  const data = {
    from: fromSelect.value,
    to: toSelect.value,
    date: document.getElementById("travelDate").value,
    classType: document.getElementById("classType").value,
    passengers: parseInt(document.getElementById("passengers").value, 10)
  };
  if (!data.date) return alert("Please select a travel date.");
  if (data.from === data.to) return alert("From and To cannot be the same.");

  state.search = data;
  const flights = makeFlights(data);
  renderAvailableFlights(flights);
  state.selectedFlight = null;
  state.seats.clear();
  renderSeatMap([]);
});

function makeFlights(search) {
  const base = basePrices[search.to] || 25000;
  const multiplier = search.classType === "business" ? 1.8 : 1.0;
  const airlines = ["SkyFast Air", "Aurora Airlines", "Nimbus Jet", "TerraFly"];
  return airlines.map((name, i) => ({
    id: `${name}-${i}`,
    airline: name,
    from: search.from,
    to: search.to,
    duration: `${8 + i * 2}h`,
    stops: i % 2,
    basePrice: Math.round(base * multiplier) + i * 1500,
    depart: "08:00",
    arrive: "20:00"
  }));
}

function renderAvailableFlights(list) {
  availableFlights.innerHTML = "";
  if (!list.length) {
    availableFlights.innerHTML = `<div class="notice">Search to see available flights.</div>`;
    return;
  }
  list.forEach(f => {
    const el = document.createElement("div");
    el.className = "flight-card";
    el.innerHTML = `
      <h4>${f.airline}</h4>
      <div class="flight-meta">
        <span>${f.from} → ${f.to}</span>
        <span>${f.duration}, ${f.stops ? "1 stop" : "Non-stop"}</span>
      </div>
      <div class="actions">
        <span class="price">₹${f.basePrice.toLocaleString()}</span>
        <button class="btn primary">Select</button>
      </div>
    `;
    el.querySelector("button").addEventListener("click", () => {
      state.selectedFlight = f;
      buildSeatMap(f);
      renderSeatMap(currentSeats);
    });
    availableFlights.appendChild(el);
  });
}

// ===== Seats =====
let currentSeats = [];

function buildSeatMap(flight) {
  // 6 columns x 6 rows = 36 seats
  // First 2 rows are business
  currentSeats = [];
  const rows = ["A","B","C","D","E","F"];
  for (let r = 0; r < 6; r++) {
    for (let c = 1; c <= 6; c++) {
      const id = `${rows[r]}${c}`;
      const type = r < 2 ? "business" : "economy";
      const disabled = Math.random() < 0.12; // some seats unavailable
      currentSeats.push({ id, type, disabled });
    }
  }
  state.seats.clear();
}

function renderSeatMap(seats) {
  seatMap.innerHTML = "";
  if (!seats.length) {
    seatMap.innerHTML = `<div class="notice">Select a flight to see seats.</div>`;
    return;
  }
  seats.forEach(s => {
    const el = document.createElement("div");
    el.className = `seat ${s.type} ${s.disabled ? "disabled" : ""} ${state.seats.has(s.id) ? "selected" : ""}`;
    el.textContent = s.id;
    el.addEventListener("click", () => {
      if (s.disabled) return;
      const needed = state.search?.passengers || 1;
      if (state.seats.has(s.id)) {
        state.seats.delete(s.id);
      } else {
        if (state.seats.size >= needed) return alert(`You can select up to ${needed} seats.`);
        if (state.search?.classType === "business" && s.type !== "business") {
          return alert("For Business class, please choose Business seats.");
        }
        if (state.search?.classType === "economy" && s.type !== "economy") {
          return alert("For Economy class, please choose Economy seats.");
        }
        state.seats.add(s.id);
      }
      renderSeatMap(currentSeats);
    });
    seatMap.appendChild(el);
  });
}

safeAdd(autoAssignSeatsBtn, "click", () => {
  if (!currentSeats.length) return alert("Select a flight first.");
  const needed = state.search?.passengers || 1;
  state.seats.clear();
  const pool = currentSeats.filter(s => !s.disabled && s.type === (state.search?.classType || "economy"));
  if (pool.length < needed) return alert("Not enough seats available of selected class.");
  for (let i = 0; i < needed; i++) state.seats.add(pool[i].id);
  renderSeatMap(currentSeats);
});
safeAdd(clearSeatsBtn, "click", () => {
  state.seats.clear();
  renderSeatMap(currentSeats);
});

// ===== Flow control =====
safeAdd(toPassengerBtn, "click", () => {
  if (!state.loggedIn) {
    if (loginNotice) {
      loginNotice.textContent = "You must be logged in to continue to Passenger details.";
      loginNotice.classList.remove("hidden");
    }
    if (loginModal && loginModal.showModal) loginModal.showModal();
    return;
  }
  if (!state.selectedFlight) return alert("Please select a flight.");
  const needed = state.search?.passengers || 1;
  if (state.seats.size !== needed) return alert(`Please select ${needed} seat(s).`);
  openTab("passenger");
});

// ===== Passenger =====
safeAdd(passengerForm, "submit", e => {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const passport = document.getElementById("passport").value.trim();

  // Regex patterns
  const namePattern = /^[A-Za-z\s]{2,}$/;              // only letters/spaces, min 2 chars
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;   // basic email format
  const phonePattern = /^[0-9]{10}$/;                  // 10-digit phone number
  const passportPattern = /^[A-Z0-9]{6,9}$/;           // alphanumeric, 6–9 chars

  // Empty check
  if (!fullName || !email || !phone || !passport) {
    alert("Please fill all passenger details.");
    return;
  }

  // Validate full name
  if (!namePattern.test(fullName)) {
    alert("Full name should only contain letters and spaces.");
    return;
  }

  // Validate email
  if (!emailPattern.test(email)) {
    alert("Please enter a valid email address.");
    return;
  }

  // Validate phone
  if (!phonePattern.test(phone)) {
    alert("Please enter a valid 10-digit phone number.");
    return;
  }

  // Validate passport
  if (!passportPattern.test(passport)) {
    alert("Please enter a valid passport number (6–9 alphanumeric characters).");
    return;
  }

  // If all validations pass
  state.passenger = { fullName, email, phone, passport };
  buildOrderSummary();
  openTab("payment");
});

// Build order summary (small helper used after passenger entry)
function buildOrderSummary() {
  if (!state.selectedFlight || !state.passenger) return;
  const seats = Array.from(state.seats);
  const perSeat = state.selectedFlight.basePrice || 0;
  const total = perSeat * seats.length;
  orderSummary.innerHTML = `
    <h4>Order Summary</h4>
    <div>Flight: ${state.selectedFlight.airline} (${state.selectedFlight.from} → ${state.selectedFlight.to})</div>
    <div>Seats: ${seats.join(", ")}</div>
    <div>Passenger: ${state.passenger.fullName}</div>
    <div>Total: ₹${total.toLocaleString()}</div>
  `;
}

// ===== Payment =====
safeAdd(paymentForm, "submit", e => {
  e.preventDefault();

  const card = (document.getElementById("cardNumber")?.value || "").replace(/\s+/g, "");
  const expiry = (document.getElementById("expiry")?.value || "").trim();
  const cvv = (document.getElementById("cvv")?.value || "").trim();

  // Regex patterns
  const cardPattern = /^[0-9]{13,19}$/;              // 13–19 digits (Visa, MasterCard, etc.)
  const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;  // MM/YY format
  const cvvPattern = /^[0-9]{3,4}$/;                 // 3 or 4 digits

  // Validate card number
  if (!cardPattern.test(card)) {
    if (paymentStatus) {
      paymentStatus.textContent = "Please enter a valid card number (13–19 digits).";
      paymentStatus.style.color = "var(--warning)";
    }
    return;
  }

  // Luhn algorithm check
  function luhnCheck(num) {
    let sum = 0; let alt = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let n = parseInt(num[i], 10);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  if (!luhnCheck(card)) {
    if (paymentStatus) {
      paymentStatus.textContent = "Please enter a valid card number.";
      paymentStatus.style.color = "var(--warning)";
    }
    return;
  }

  // Validate expiry (MM/YY and not expired)
  if (!expiryPattern.test(expiry)) {
    if (paymentStatus) {
      paymentStatus.textContent = "Please enter expiry in MM/YY format.";
      paymentStatus.style.color = "var(--warning)";
    }
    return;
  } else {
    const [monthStr, yearStr] = expiry.split("/");
    const monthNum = parseInt(monthStr, 10);
    const yearNum = parseInt(yearStr, 10);
    // Use last moment of expiry month (month is 1-12, Date months are 0-based)
    const expDate = new Date(2000 + yearNum, monthNum, 0, 23, 59, 59);
    const now = new Date();
    if (expDate <= now) {
      if (paymentStatus) {
        paymentStatus.textContent = "Card has expired.";
        paymentStatus.style.color = "var(--warning)";
      }
      return;
    }
  }

  // Validate CVV
  if (!cvvPattern.test(cvv)) {
    if (paymentStatus) {
      paymentStatus.textContent = "Please enter a valid CVV (3–4 digits).";
      paymentStatus.style.color = "var(--warning)";
    }
    return;
  }

  // If all validations pass
  state.paymentDone = true;
  if (paymentStatus) {
    paymentStatus.textContent = "Payment successful! Your e-ticket has been sent to your email.";
    paymentStatus.style.color = "var(--accent)";
  }
});

// ===== Contact =====
safeAdd(contactForm, "submit", e => {
  e.preventDefault();

  const name = document.getElementById("contactName").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();
  const message = document.getElementById("contactMessage").value.trim();

  // Regex patterns
  const namePattern = /^[A-Za-z\s]{2,}$/;              // only letters/spaces, min 2 chars
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;   // basic email format
  const phonePattern = /^[0-9]{10}$/;                  // 10-digit phone number

  // Empty check
  if (!name || !email || !phone || !message) {
    contactStatus.textContent = "Please fill in all fields.";
    contactStatus.style.color = "var(--warning)";
    return;
  }

  // Validate name
  if (!namePattern.test(name)) {
    contactStatus.textContent = "Please enter a valid name.";
    contactStatus.style.color = "var(--warning)";
    return;
  }

  // Validate email
  if (!emailPattern.test(email)) {
    contactStatus.textContent = "Please enter a valid email address.";
    contactStatus.style.color = "var(--warning)";
    return;
  }

  // Validate phone
  if (!phonePattern.test(phone)) {
    contactStatus.textContent = "Please enter a valid 10-digit phone number.";
    contactStatus.style.color = "var(--warning)";
    return;
  }

  // Validate message length
  if (message.length < 10) {
    contactStatus.textContent = "Message should be at least 10 characters.";
    contactStatus.style.color = "var(--warning)";
    return;
  }

  // ✅ If all validations pass
  contactStatus.textContent = "Message sent successfully! We'll get back to you soon.";
  contactStatus.style.color = "var(--accent)";
});


// ===== Initial =====
function initAvailableFlightsPlaceholder() {
  renderAvailableFlights([]);
  renderSeatMap([]);
}
initAvailableFlightsPlaceholder();