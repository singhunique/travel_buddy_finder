const API_BASE = "/api";

const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeText = document.getElementById("welcomeText");

const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const tripForm = document.getElementById("tripForm");

const refreshTripsBtn = document.getElementById("refreshTripsBtn");
const refreshMatchesBtn = document.getElementById("refreshMatchesBtn");

const myTripsList = document.getElementById("myTripsList");
const matchesList = document.getElementById("matchesList");

const tripCount = document.getElementById("tripCount");
const matchCount = document.getElementById("matchCount");
const toast = document.getElementById("toast");

const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerInterests = document.getElementById("registerInterests");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const forgotPasswordModal = document.getElementById("forgotPasswordModal");
const closeForgotPasswordBtn = document.getElementById("closeForgotPasswordBtn");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotPasswordEmail = document.getElementById("forgotPasswordEmail");

const chatModal = document.getElementById("chatModal");
const chatTitle = document.getElementById("chatTitle");
const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const closeChatBtn = document.getElementById("closeChatBtn");

let activeChatId = null;
let activeChatUserName = "";
let chatRefreshInterval = null;

function showToast(message, type = "success") {
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove("hidden");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

function setSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatChatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatLastSeen(lastSeen) {
  if (!lastSeen) return "Offline";

  const date = new Date(lastSeen);
  return `Last seen ${date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

function setCounts(trips = 0, matches = 0) {
  if (tripCount) tripCount.textContent = trips;
  if (matchCount) matchCount.textContent = matches;
}

function updateUI() {
  const token = getToken();
  const user = getUser();

  if (token && user) {
    authSection?.classList.add("hidden");
    dashboardSection?.classList.remove("hidden");
    logoutBtn?.classList.remove("hidden");
    if (welcomeText) welcomeText.textContent = `Welcome back, ${user.name}`;
    loadDashboardData();
  } else {
    authSection?.classList.remove("hidden");
    dashboardSection?.classList.add("hidden");
    logoutBtn?.classList.add("hidden");
    setCounts(0, 0);
  }
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEmptyState(container, title, text) {
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <strong>${title}</strong>
      <span>${text}</span>
    </div>
  `;
}

function ensureErrorElement(input) {
  const parent = input.parentElement;
  let errorEl = parent.querySelector(".field-error");

  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.className = "field-error";
    parent.appendChild(errorEl);
  }

  return errorEl;
}

function showFieldError(input, message) {
  const errorEl = ensureErrorElement(input);
  errorEl.textContent = message;
  input.classList.add("input-error");
}

function clearFieldError(input) {
  const parent = input.parentElement;
  const errorEl = parent.querySelector(".field-error");

  if (errorEl) errorEl.textContent = "";
  input.classList.remove("input-error");
}

function ensurePasswordHint() {
  let hint = registerPassword.parentElement.querySelector(".password-hint");

  if (!hint) {
    hint = document.createElement("div");
    hint.className = "password-hint";
    registerPassword.parentElement.appendChild(hint);
  }

  return hint;
}

function updatePasswordHint() {
  if (!registerPassword) return;
  const password = registerPassword.value;
  const hint = ensurePasswordHint();

  const hasLength = password.length >= 6;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);

  hint.innerHTML = `
    <div class="hint-item ${hasLength ? "valid" : ""}">At least 6 characters</div>
    <div class="hint-item ${hasLetter ? "valid" : ""}">Contains a letter</div>
    <div class="hint-item ${hasNumber ? "valid" : ""}">Contains a number</div>
  `;
}

function validateRegisterName() {
  const value = registerName.value.trim();
  const regex = /^[A-Za-z\s]{3,50}$/;

  if (!value) {
    showFieldError(registerName, "Full name is required.");
    return false;
  }

  if (!regex.test(value)) {
    showFieldError(registerName, "Name must be 3 to 50 letters and spaces only.");
    return false;
  }

  clearFieldError(registerName);
  return true;
}

function validateRegisterEmail() {
  const value = registerEmail.value.trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!value) {
    showFieldError(registerEmail, "Email address is required.");
    return false;
  }

  if (!regex.test(value)) {
    showFieldError(registerEmail, "Enter a valid email address.");
    return false;
  }

  clearFieldError(registerEmail);
  return true;
}

function validateRegisterPassword() {
  const value = registerPassword.value;
  const regex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

  updatePasswordHint();

  if (!value) {
    showFieldError(registerPassword, "Password is required.");
    return false;
  }

  if (!regex.test(value)) {
    showFieldError(registerPassword, "Password must be at least 6 characters and include 1 letter and 1 number.");
    return false;
  }

  clearFieldError(registerPassword);
  return true;
}

function validateLoginEmail() {
  const value = loginEmail.value.trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!value) {
    showFieldError(loginEmail, "Email address is required.");
    return false;
  }

  if (!regex.test(value)) {
    showFieldError(loginEmail, "Enter a valid email address.");
    return false;
  }

  clearFieldError(loginEmail);
  return true;
}

function validateLoginPassword() {
  const value = loginPassword.value;

  if (!value) {
    showFieldError(loginPassword, "Password is required.");
    return false;
  }

  if (value.length < 6) {
    showFieldError(loginPassword, "Password must be at least 6 characters.");
    return false;
  }

  clearFieldError(loginPassword);
  return true;
}
function renderTrips(trips) {
  if (!Array.isArray(trips) || trips.length === 0) {
    renderEmptyState(
      myTripsList,
      "No trips yet",
      "Add your first trip to start finding travel buddies."
    );
    setCounts(0, Number(matchCount?.textContent || 0));
    return;
  }

  myTripsList.innerHTML = trips
    .map(
      (trip) => `
        <article class="trip-card">
          <div class="trip-card-top">
            <h4 class="trip-title">${escapeHtml(trip.destination)}</h4>
            <span class="pill">Active Trip</span>
          </div>

          <div class="meta">
            <div class="meta-block"><strong>From:</strong> ${formatDate(trip.startDate)}</div>
            <div class="meta-block"><strong>To:</strong> ${formatDate(trip.endDate)}</div>
          </div>

          <div style="margin-top: 14px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-soft edit-btn"
              data-id="${trip._id}"
              data-destination="${encodeURIComponent(trip.destination)}"
              data-start="${trip.startDate.split("T")[0]}"
              data-end="${trip.endDate.split("T")[0]}">
              Edit
            </button>

            <button class="btn btn-soft delete-btn"
              data-id="${trip._id}">
              Delete
            </button>
          </div>
        </article>
      `
    )
    .join("");

  attachTripListeners();
}

function attachTripListeners() {
  // DELETE
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteTrip(btn.dataset.id);
    });
  });

  // EDIT
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      editTrip(
        btn.dataset.id,
        btn.dataset.destination,
        btn.dataset.start,
        btn.dataset.end
      );
    });
  });
}
function renderMatches(matches) {
  if (!Array.isArray(matches) || matches.length === 0) {
    renderEmptyState(
      matchesList,
      "No matches found",
      "Try adding more trips with destinations and dates that overlap with other travelers."
    );
    setCounts(Number(tripCount?.textContent || 0), 0);
    return;
  }

  matchesList.innerHTML = matches
    .map((match) => {
      const interests =
        Array.isArray(match.matchInterests) && match.matchInterests.length
          ? match.matchInterests.join(", ")
          : "No interests provided";

      const statusText = match.matchIsOnline
        ? "🟢 Online"
        : `⚪ ${formatLastSeen(match.matchLastSeen)}`;

      const correctId = match.matchUserId || match.userId || match._id;

      return `
        <article class="match-card">
          <div class="match-card-top">
            <div>
              <h4 class="match-name">${escapeHtml(match.matchName || "Traveler")}</h4>
              <span class="pill">${escapeHtml(match.destination || "Destination")}</span>
            </div>
          </div>

          <div class="meta">
            <div class="meta-block"><strong>Status:</strong> ${escapeHtml(statusText)}</div>
            <div class="meta-block"><strong>Travel Dates:</strong> ${formatDate(match.startDate)} - ${formatDate(match.endDate)}</div>
            <div class="meta-block"><strong>Email:</strong> ${escapeHtml(match.matchEmail || "Not available")}</div>
            <div class="meta-block"><strong>Interests:</strong> ${escapeHtml(interests)}</div>
          </div>

          <div style="margin-top: 14px;">
            <button
            type="button"
            class="btn btn-primary chat-btn"
            data-user-id="${match.matchUserId || match.userId}"
            data-user-name="${encodeURIComponent(match.matchName || "Traveler")}"
            >
            Chat
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  setCounts(Number(tripCount?.textContent || 0), matches.length);
}

document.addEventListener("click", function (e) {
  if (e.target.classList.contains("chat-btn")) {
    const userId = e.target.getAttribute("data-user-id");
    const userName = e.target.getAttribute("data-user-name");

    openChat(userId, userName);
  }
});
function renderChatMessages(messages) {
  const currentUser = getUser();

  if (!Array.isArray(messages) || messages.length === 0) {
    chatMessages.innerHTML = `
      <div class="chat-empty">
        No messages yet. Start the conversation.
      </div>
    `;
    return;
  }

  chatMessages.innerHTML = messages
    .map((message) => {
      const senderId = message.sender?._id || message.sender?.id || "";
      const isMe = String(senderId) === String(currentUser?.id || "");

      return `
        <div class="chat-message ${isMe ? "me" : "other"}">
          <div>${escapeHtml(message.text)}</div>
          <span class="chat-meta">
            ${isMe ? "You" : escapeHtml(message.sender?.name || "Traveler")} • ${formatChatTime(message.createdAt)}
          </span>
        </div>
      `;
    })
    .join("");

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function fetchMyTrips() {
  const trips = await apiFetch("/trips/my-trips");
  renderTrips(trips);
  return trips;
}

async function fetchMatches() {
  const matches = await apiFetch("/trips/matches");
  renderMatches(matches);
  return matches;
}

async function fetchChatMessages() {
  if (!activeChatId) return;

  const messages = await apiFetch(`/chat/${activeChatId}/messages`);
  renderChatMessages(messages);

  try {
    await apiFetch(`/chat/${activeChatId}/read`, {
      method: "PUT"
    });
  } catch (error) {
    console.error("Read status update failed:", error.message);
  }
}

async function loadDashboardData() {
  try {
    await Promise.all([fetchMyTrips(), fetchMatches()]);
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function openChat(otherUserId, encodedOtherUserName) {
  try {
    console.log("Clicked Chat User ID:", otherUserId); // 👈 DEBUG

    const otherUserName = decodeURIComponent(encodedOtherUserName || "Traveler");

    if (!otherUserId || otherUserId === "undefined") {
      showToast("Chat user is missing.", "error");
      return;
    }

    const data = await apiFetch("/chat/start", {
      method: "POST",
      body: JSON.stringify({ otherUserId })
    });

    console.log("Chat start response:", data); // 👈 DEBUG

    activeChatId = data.chatId;
    activeChatUserName = otherUserName;

    chatTitle.textContent = `Chat with ${otherUserName}`;
    chatModal.classList.remove("hidden");

    await fetchChatMessages();

    if (chatRefreshInterval) {
      clearInterval(chatRefreshInterval);
    }

    chatRefreshInterval = setInterval(fetchChatMessages, 3000);
  } catch (error) {
    console.error("Chat error:", error); // 👈 DEBUG
    showToast(error.message || "Could not open chat.", "error");
  }
}

function closeChat() {
  chatModal.classList.add("hidden");
  activeChatId = null;
  activeChatUserName = "";
  if (chatMessages) chatMessages.innerHTML = "";

  if (chatRefreshInterval) {
    clearInterval(chatRefreshInterval);
    chatRefreshInterval = null;
  }
}

registerName?.addEventListener("input", validateRegisterName);
registerEmail?.addEventListener("input", validateRegisterEmail);
registerPassword?.addEventListener("input", validateRegisterPassword);

loginEmail?.addEventListener("input", validateLoginEmail);
loginPassword?.addEventListener("input", validateLoginPassword);

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const isNameValid = validateRegisterName();
  const isEmailValid = validateRegisterEmail();
  const isPasswordValid = validateRegisterPassword();

  if (!isNameValid || !isEmailValid || !isPasswordValid) {
    showToast("Please fix the highlighted fields.", "error");
    return;
  }

  const body = {
    name: registerName.value.trim(),
    email: registerEmail.value.trim(),
    password: registerPassword.value,
    interests: registerInterests.value.trim()
  };

  try {
    await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(body)
    });

    registerForm.reset();
    updatePasswordHint();
    clearFieldError(registerName);
    clearFieldError(registerEmail);
    clearFieldError(registerPassword);
    showToast("Account created successfully. Please login.");
  } catch (error) {
    showToast(error.message, "error");
  }
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const isEmailValid = validateLoginEmail();
  const isPasswordValid = validateLoginPassword();

  if (!isEmailValid || !isPasswordValid) {
    showToast("Please fix the login fields.", "error");
    return;
  }

  const body = {
    email: loginEmail.value.trim(),
    password: loginPassword.value
  };

  try {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    });

    setSession(data.token, data.user);
    loginForm.reset();
    clearFieldError(loginEmail);
    clearFieldError(loginPassword);
    showToast("Login successful.");
    updateUI();
  } catch (error) {
    showToast(error.message, "error");
  }
});

tripForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const destination = document.getElementById("destination").value.trim();
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  if (!destination) {
    showToast("Destination is required.", "error");
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    showToast("Start date cannot be after end date.", "error");
    return;
  }

  try {
    await apiFetch("/trips", {
      method: "POST",
      body: JSON.stringify({ destination, startDate, endDate })
    });

    tripForm.reset();
    showToast("Trip added successfully.");
    await loadDashboardData();
  } catch (error) {
    showToast(error.message, "error");
  }
});

chatForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = chatInput.value.trim();

  if (!text || !activeChatId) return;

  try {
    await apiFetch(`/chat/${activeChatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ text })
    });

    chatInput.value = "";
    await fetchChatMessages();
  } catch (error) {
    showToast(error.message, "error");
  }
});

forgotPasswordBtn?.addEventListener("click", () => {
  forgotPasswordModal.classList.remove("hidden");
});

closeForgotPasswordBtn?.addEventListener("click", () => {
  forgotPasswordModal.classList.add("hidden");
});

forgotPasswordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email: forgotPasswordEmail.value.trim()
      })
    });

    forgotPasswordForm.reset();
    forgotPasswordModal.classList.add("hidden");
    showToast("If that email exists, a reset link has been sent.");
  } catch (error) {
    showToast(error.message, "error");
  }
});

async function deleteTrip(id) {
  const confirmed = confirm("Are you sure you want to delete this trip?");
  if (!confirmed) return;

  try {
    await apiFetch(`/trips/${id}`, {
      method: "DELETE"
    });

    showToast("Trip deleted successfully.");
    await loadDashboardData();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function editTrip(id, encodedCurrentDestination, currentStartDate, currentEndDate) {
  const currentDestination = decodeURIComponent(encodedCurrentDestination);

  const destination = prompt("Edit destination:", currentDestination);
  if (destination === null) return;

  const startDate = prompt("Edit start date (YYYY-MM-DD):", currentStartDate);
  if (startDate === null) return;

  const endDate = prompt("Edit end date (YYYY-MM-DD):", currentEndDate);
  if (endDate === null) return;

  if (new Date(startDate) > new Date(endDate)) {
    showToast("Start date cannot be after end date.", "error");
    return;
  }

  try {
    await apiFetch(`/trips/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        destination: destination.trim(),
        startDate,
        endDate
      })
    });

    showToast("Trip updated successfully.");
    await loadDashboardData();
  } catch (error) {
    showToast(error.message, "error");
  }
}

closeChatBtn?.addEventListener("click", closeChat);

refreshTripsBtn?.addEventListener("click", async () => {
  try {
    await fetchMyTrips();
    showToast("Trips refreshed.");
  } catch (error) {
    showToast(error.message, "error");
  }
});

refreshMatchesBtn?.addEventListener("click", async () => {
  try {
    await fetchMatches();
    showToast("Matches refreshed.");
  } catch (error) {
    showToast(error.message, "error");
  }
});

logoutBtn?.addEventListener("click", async () => {
  try {
    await apiFetch("/auth/logout", {
      method: "POST"
    });
  } catch (error) {
    console.error("Logout API error:", error.message);
  }

  clearSession();
  closeChat();
  updateUI();
  showToast("Logged out successfully.");
});


window.openChat = openChat;

updatePasswordHint();
updateUI();