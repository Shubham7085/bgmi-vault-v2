import { auth, db, signOut, onAuthStateChanged, collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "./firebase.js";

// DOM Elements
const authBadge = document.getElementById("auth-badge");
const userInfo = document.getElementById("user-info");
const userDisplayEmail = document.getElementById("user-display-email");
const logoutBtn = document.getElementById("logout-btn");
const signinBtn = document.getElementById("signin-btn");
const adminNavLink = document.getElementById("admin-nav-link");

const searchInput = document.getElementById("search-input");
const filterRole = document.getElementById("filter-role");
const filterTier = document.getElementById("filter-tier");
const filterStatus = document.getElementById("filter-status");
const resultsCount = document.getElementById("results-count");
const resetFiltersBtn = document.getElementById("reset-filters-btn");
const friendsGrid = document.getElementById("friends-grid");

const adminAddShortcut = document.getElementById("admin-add-shortcut");

const detailModal = document.getElementById("detail-modal");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

let isAdmin = false;
let rawFriendsList = [];

// 1. Authentication State Tracker
onAuthStateChanged(auth, (user) => {
  if (user) {
    isAdmin = true;
    if (authBadge) {
      authBadge.textContent = "ADMIN ACCESS";
      authBadge.className = "hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono-tactical";
    }
    if (userDisplayEmail) userDisplayEmail.textContent = user.email || "Admin";
    if (userInfo) userInfo.style.display = "flex";
    if (signinBtn) signinBtn.style.display = "none";
    if (adminNavLink) adminNavLink.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>Admin Panel`;
    if (adminAddShortcut) adminAddShortcut.classList.remove("hidden");
  } else {
    isAdmin = false;
    if (authBadge) {
      authBadge.textContent = "SECURE COMMS";
      authBadge.className = "hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono-tactical";
    }
    if (userInfo) userInfo.style.display = "none";
    if (signinBtn) signinBtn.style.display = "inline-block";
    if (adminNavLink) adminNavLink.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Admin Panel`;
    if (adminAddShortcut) adminAddShortcut.classList.add("hidden");
  }
  
  // Re-render once on auth status change to toggle admin controls on cards
  renderFriends();
});

// Logout Operation
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  });
}

// 2. Real-time Firestore Sync
const friendsCollection = collection(db, "friends");
const q = query(friendsCollection, orderBy("name", "asc"));

onSnapshot(q, (snapshot) => {
  rawFriendsList = [];
  snapshot.forEach((doc) => {
    rawFriendsList.push({ id: doc.id, ...doc.data() });
  });
  renderFriends();
}, (error) => {
  console.error("Roster query error:", error);
  if (friendsGrid) {
    friendsGrid.innerHTML = `
      <div class="col-span-full p-6 text-center text-red-400 bg-red-500/5 border border-red-500/10 rounded-2xl font-mono-tactical">
        Failed to fetch squad data link: ${error.message}
      </div>
    `;
  }
});

// 3. Search & Filtering Matrix
function renderFriends() {
  if (!friendsGrid) return;

  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const roleVal = filterRole ? filterRole.value : "All";
  const tierVal = filterTier ? filterTier.value : "All";
  const statusVal = filterStatus ? filterStatus.value : "All";

  // Filter items
  const filtered = rawFriendsList.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchVal) || f.bgmiId.toLowerCase().includes(searchVal);
    const matchesRole = roleVal === "All" || f.role === roleVal;
    const matchesTier = tierVal === "All" || f.tier === tierVal;
    const matchesStatus = statusVal === "All" || f.status === statusVal;

    return matchesSearch && matchesRole && matchesTier && matchesStatus;
  });

  // Display counter
  if (resultsCount) {
    resultsCount.textContent = `Showing ${filtered.length} of ${rawFriendsList.length} squad members`;
  }

  // Handle empty state
  if (filtered.length === 0) {
    friendsGrid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <svg class="w-12 h-12 text-zinc-700 mx-auto mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <p class="text-gray-400 font-tactical">No squad members match the selected coordinates.</p>
        <button id="clear-search-shortcut" class="text-yellow-500 font-semibold text-xs mt-2 hover:underline">Clear Search Filter</button>
      </div>
    `;
    
    const clearShortcut = document.getElementById("clear-search-shortcut");
    if (clearShortcut) {
      clearShortcut.addEventListener("click", resetAllFilters);
    }
    return;
  }

  // Render cards
  let html = "";
  filtered.forEach(f => {
    let statusColor = "bg-gray-500";
    let statusText = "Offline";
    let statusBadgeColor = "bg-zinc-900 border-zinc-800 text-gray-400";
    let pulseClass = "";

    if (f.status === "Online") {
      statusColor = "bg-green-500";
      statusText = "Online";
      statusBadgeColor = "bg-green-500/10 border-green-500/20 text-green-400";
      pulseClass = "status-pulse-online";
    } else if (f.status === "In-Game") {
      statusColor = "bg-blue-500";
      statusText = "In-Game";
      statusBadgeColor = "bg-blue-500/10 border-blue-500/20 text-blue-400";
      pulseClass = "status-pulse-ingame";
    }

    const avatar = f.imageUrl 
      ? `<img src="${f.imageUrl}" alt="${f.name}" class="w-full h-full object-cover">`
      : `<span class="text-lg font-black text-yellow-500 font-tactical">${f.name.substring(0, 2).toUpperCase()}</span>`;

    // Admin control elements (Quick status update dropdown and action buttons)
    const adminControls = isAdmin ? `
      <div class="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
        <!-- Quick Status Select -->
        <div class="flex items-center gap-1.5">
          <span class="text-[10px] text-gray-500 font-mono-tactical">STATUS:</span>
          <select data-id="${f.id}" class="quick-status-select bg-zinc-950 border border-zinc-800 text-[10px] font-bold text-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-yellow-500/40">
            <option value="Online" ${f.status === "Online" ? "selected" : ""}>Online</option>
            <option value="In-Game" ${f.status === "In-Game" ? "selected" : ""}>In-Game</option>
            <option value="Offline" ${f.status === "Offline" ? "selected" : ""}>Offline</option>
          </select>
        </div>
        <!-- Card CRUD Actions -->
        <div class="flex items-center gap-1.5">
          <a href="admin.html?edit=${f.id}" class="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all" title="Edit Roster Record">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-1.5-10.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </a>
          <button data-id="${f.id}" data-name="${f.name}" class="delete-friend-btn p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all" title="Expel Roster Record">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>
    ` : '';

    html += `
      <div class="tactical-card rounded-2xl p-5 flex flex-col justify-between relative group">
        
        <!-- Header Roster Details -->
        <div>
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center relative shadow-inner">
                ${avatar}
                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#11151c] ${statusColor} ${pulseClass}"></span>
              </div>
              <div>
                <h3 class="text-base font-bold text-white tracking-tight font-tactical group-hover:text-yellow-500 transition-colors cursor-pointer player-name-click" data-index="${rawFriendsList.indexOf(f)}">
                  ${f.name}
                </h3>
                <div class="flex items-center gap-1.5 mt-1">
                  <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-zinc-900 border border-zinc-800 text-gray-400 font-mono-tactical">${f.role}</span>
                </div>
              </div>
            </div>

            <!-- Status Indicator Badge -->
            <div class="px-2 py-0.5 rounded text-[9px] font-bold border font-mono-tactical ${statusBadgeColor}">
              ${statusText.toUpperCase()}
            </div>
          </div>

          <!-- Character ID Segment -->
          <div class="flex items-center justify-between p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-900/60 font-mono-tactical text-xs mb-4">
            <span class="text-gray-500 text-[11px]">ID: ${f.bgmiId}</span>
            <button data-id="${f.bgmiId}" class="copy-id-btn text-yellow-500 hover:text-yellow-400 p-1 rounded hover:bg-zinc-900 transition-all">
              <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>

          <!-- Stat Matrix grid -->
          <div class="grid grid-cols-3 gap-2.5 font-mono-tactical text-center">
            <div class="p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
              <span class="text-[9px] text-gray-500 block">K/D</span>
              <span class="text-sm font-black text-white">${(Number(f.kdRatio) || 0).toFixed(2)}</span>
            </div>
            <div class="p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
              <span class="text-[9px] text-gray-500 block">MATCHES</span>
              <span class="text-sm font-black text-white">${f.matchesPlayed || 0}</span>
            </div>
            <div class="p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
              <span class="text-[9px] text-gray-500 block">WINS</span>
              <span class="text-sm font-black text-white">${f.wins || 0}</span>
            </div>
          </div>
        </div>

        <!-- Detail click section & Admin actions -->
        <div>
          <button data-index="${rawFriendsList.indexOf(f)}" class="player-details-btn w-full text-center mt-4 py-2 rounded-xl text-[11px] font-semibold text-gray-400 bg-zinc-900/40 hover:bg-zinc-800 border border-zinc-800/60 hover:text-white transition-all font-tactical uppercase">
            Combat Dossier &rarr;
          </button>
          ${adminControls}
        </div>

      </div>
    `;
  });

  friendsGrid.innerHTML = html;

  // Bind Event Listeners
  attachCardEvents();
}

// 4. Attach Events to dynamic buttons
function attachCardEvents() {
  // Clipboard copy
  const copyBtns = document.querySelectorAll(".copy-id-btn");
  copyBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      navigator.clipboard.writeText(id).then(() => {
        // Simple success feedback animation
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<svg class="w-3.5 h-3.5 inline text-green-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>`;
        setTimeout(() => { btn.innerHTML = originalHTML; }, 1500);
      });
    });
  });

  // Open details modal
  const detailBtns = document.querySelectorAll(".player-details-btn, .player-name-click");
  detailBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = btn.getAttribute("data-index");
      openDetailModal(rawFriendsList[idx]);
    });
  });

  // Admin: Delete operations
  const deleteBtns = document.querySelectorAll(".delete-friend-btn");
  deleteBtns.forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      const name = btn.getAttribute("data-name");
      if (confirm(`Expel player "${name}" from the active squad roster? This action is irreversible.`)) {
        try {
          await deleteDoc(doc(db, "friends", id));
          // List updates automatically via live Snapshot
        } catch (err) {
          console.error("Deletion failed:", err);
          alert(`Expulsion failed: ${err.message}`);
        }
      }
    });
  });

  // Admin: Quick Status operations
  const statusSelects = document.querySelectorAll(".quick-status-select");
  statusSelects.forEach(select => {
    select.addEventListener("change", async (e) => {
      const id = select.getAttribute("data-id");
      const status = select.value;
      try {
        await updateDoc(doc(db, "friends", id), { status: status });
      } catch (err) {
        console.error("Status update failed:", err);
        alert(`Status update failed: ${err.message}`);
      }
    });
  });
}

// 5. Open Player details modal
function openDetailModal(friend) {
  if (!detailModal || !modalBody) return;

  const winRate = friend.matchesPlayed > 0 
    ? ((friend.wins / friend.matchesPlayed) * 100).toFixed(1) 
    : "0.0";

  let statusColor = "text-gray-400 bg-zinc-900 border-zinc-800";
  if (friend.status === "Online") statusColor = "text-green-400 bg-green-500/10 border-green-500/20";
  else if (friend.status === "In-Game") statusColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";

  const avatar = friend.imageUrl 
    ? `<img src="${friend.imageUrl}" alt="${friend.name}" class="w-full h-full object-cover">`
    : `<span class="text-3xl font-black text-yellow-500 font-tactical">${friend.name.substring(0, 2).toUpperCase()}</span>`;

  // Dynamic combat evaluation text based on K/D ratio
  let evaluation = "Standard fighter with standard team utility.";
  const kd = Number(friend.kdRatio) || 0;
  if (kd >= 5.0) evaluation = "Legendary Apex Predatory operative. Highly aggressive combat footprint.";
  else if (kd >= 3.5) evaluation = "Elite frontline breacher. High-precision kill confirmation capability.";
  else if (kd >= 2.0) evaluation = "Strong, battle-proven combatant. Consistent support output.";

  modalBody.innerHTML = `
    <div class="p-6 md:p-8">
      
      <!-- Top Profile Info -->
      <div class="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-zinc-800/80">
        <div class="w-20 h-20 rounded-2xl overflow-hidden border-2 border-yellow-500/20 bg-zinc-950 flex items-center justify-center shrink-0">
          ${avatar}
        </div>
        <div class="text-center sm:text-left flex-grow">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <h3 class="text-2xl font-black text-white font-tactical uppercase tracking-tight">${friend.name}</h3>
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor} font-mono-tactical mx-auto sm:mx-0">
              ${friend.status.toUpperCase()}
            </span>
          </div>
          <p class="text-xs text-gray-500 font-mono-tactical mt-1">CHARACTER ID: ${friend.bgmiId}</p>
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
            <span class="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-yellow-500 font-mono-tactical uppercase">${friend.role}</span>
            <span class="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-gray-300 font-mono-tactical uppercase">${friend.tier}</span>
          </div>
        </div>
      </div>

      <!-- Combat Records Stats Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 font-mono-tactical">
        <div class="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl text-center">
          <span class="text-[10px] text-gray-500 block uppercase">K/D Ratio</span>
          <span class="text-xl font-bold text-yellow-500 mt-1 block">${kd.toFixed(2)}</span>
        </div>
        <div class="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl text-center">
          <span class="text-[10px] text-gray-500 block uppercase">Combat Wins</span>
          <span class="text-xl font-bold text-white mt-1 block">${friend.wins || 0}</span>
        </div>
        <div class="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl text-center">
          <span class="text-[10px] text-gray-500 block uppercase">Matches</span>
          <span class="text-xl font-bold text-white mt-1 block">${friend.matchesPlayed || 0}</span>
        </div>
        <div class="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl text-center">
          <span class="text-[10px] text-gray-500 block uppercase">Win Rate</span>
          <span class="text-xl font-bold text-white mt-1 block">${winRate}%</span>
        </div>
      </div>

      <!-- Advanced Intel Block -->
      <div class="space-y-4">
        <div>
          <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 font-tactical">Favourite Armament</h4>
          <p class="text-sm text-yellow-500/90 font-bold font-mono-tactical bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">${friend.favouriteWeapon || 'None Declared'}</p>
        </div>
        <div>
          <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 font-tactical">Tactical Evaluation Intel</h4>
          <p class="text-xs text-gray-400 leading-relaxed bg-zinc-950 p-3 rounded-lg border border-zinc-900 font-tactical">${evaluation}</p>
        </div>
      </div>

    </div>
  `;

  detailModal.classList.remove("hidden");
}

// Close Modal
if (modalClose) {
  modalClose.addEventListener("click", () => {
    detailModal.classList.add("hidden");
  });
}
if (detailModal) {
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) {
      detailModal.classList.add("hidden");
    }
  });
}

// 6. Reset Filters Function
function resetAllFilters() {
  if (searchInput) searchInput.value = "";
  if (filterRole) filterRole.value = "All";
  if (filterTier) filterTier.value = "All";
  if (filterStatus) filterStatus.value = "All";
  renderFriends();
}

if (resetFiltersBtn) {
  resetFiltersBtn.addEventListener("click", resetAllFilters);
}

// Watch inputs for on-the-fly filter updating
if (searchInput) searchInput.addEventListener("input", renderFriends);
if (filterRole) filterRole.addEventListener("change", renderFriends);
if (filterTier) filterTier.addEventListener("change", renderFriends);
if (filterStatus) filterStatus.addEventListener("change", renderFriends);
