import { auth, db, signOut, onAuthStateChanged, collection, onSnapshot, query, orderBy } from "./firebase.js";

// DOM Elements
const authBadge = document.getElementById("auth-badge");
const userInfo = document.getElementById("user-info");
const userDisplayEmail = document.getElementById("user-display-email");
const logoutBtn = document.getElementById("logout-btn");
const signinBtn = document.getElementById("signin-btn");
const adminNavLink = document.getElementById("admin-nav-link");

// 1. Auth State Management
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    if (authBadge) {
      authBadge.textContent = "ADMIN ACCESS";
      authBadge.className = "hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono-tactical";
    }
    if (userDisplayEmail) {
      userDisplayEmail.textContent = user.email || "Admin";
    }
    if (userInfo) userInfo.style.display = "flex";
    if (signinBtn) signinBtn.style.display = "none";
    if (adminNavLink) {
      adminNavLink.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>Admin Panel`;
    }
  } else {
    // User is signed out
    if (authBadge) {
      authBadge.textContent = "SECURE COMMS";
      authBadge.className = "hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono-tactical";
    }
    if (userInfo) userInfo.style.display = "none";
    if (signinBtn) signinBtn.style.display = "inline-block";
    if (adminNavLink) {
      adminNavLink.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Admin Panel`;
    }
  }
});

// Sign Out Handler
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  });
}

// 2. Dashboard Live Sync (if on index.html)
const totalSquadEl = document.getElementById("stat-total-squad");
const avgKdEl = document.getElementById("stat-avg-kd");
const aceCountEl = document.getElementById("stat-ace-count");
const activeCountEl = document.getElementById("stat-active-count");
const miniRosterEl = document.getElementById("mini-roster-list");

const mvpNameEl = document.getElementById("mvp-name");
const mvpRoleEl = document.getElementById("mvp-role");
const mvpTierEl = document.getElementById("mvp-tier");
const mvpKdEl = document.getElementById("mvp-kd");
const mvpMatchesEl = document.getElementById("mvp-matches");
const mvpWinsEl = document.getElementById("mvp-wins");
const mvpImageContainer = document.getElementById("mvp-image-container");

if (totalSquadEl || miniRosterEl) {
  const friendsCollection = collection(db, "friends");
  const q = query(friendsCollection, orderBy("name", "asc"));

  onSnapshot(q, (snapshot) => {
    const friends = [];
    snapshot.forEach((doc) => {
      friends.push({ id: doc.id, ...doc.data() });
    });

    updateDashboardStats(friends);
    updateSpotlightPlayer(friends);
    updateMiniRoster(friends);
  }, (error) => {
    console.error("Dashboard subscription failed:", error);
    if (miniRosterEl) {
      miniRosterEl.innerHTML = `<div class="text-xs text-red-400 p-4 font-mono-tactical">Error listening to squad link: ${error.message}</div>`;
    }
  });
}

// Update counters
function updateDashboardStats(friends) {
  if (!totalSquadEl) return;

  const total = friends.length;
  totalSquadEl.textContent = total;

  let totalKd = 0;
  let activeCount = 0;
  let aceCount = 0;

  const aceTiers = ["Conqueror", "Ace Dominator", "Ace Master", "Ace"];

  friends.forEach(f => {
    totalKd += Number(f.kdRatio) || 0;
    if (f.status === "Online" || f.status === "In-Game") {
      activeCount++;
    }
    if (aceTiers.includes(f.tier)) {
      aceCount++;
    }
  });

  const avgKd = total > 0 ? (totalKd / total).toFixed(2) : "0.00";

  if (avgKdEl) avgKdEl.textContent = avgKd;
  if (aceCountEl) aceCountEl.textContent = aceCount;
  if (activeCountEl) activeCountEl.textContent = activeCount;
}

// Spotlight player with highest K/D
function updateSpotlightPlayer(friends) {
  if (!mvpNameEl) return;

  if (friends.length === 0) {
    mvpNameEl.textContent = "No Players";
    mvpRoleEl.textContent = "N/A";
    mvpTierEl.textContent = "Unknown Tier";
    mvpKdEl.textContent = "0.00";
    mvpMatchesEl.textContent = "0";
    mvpWinsEl.textContent = "0";
    return;
  }

  // Sort by K/D ratio desc
  const sorted = [...friends].sort((a, b) => (Number(b.kdRatio) || 0) - (Number(a.kdRatio) || 0));
  const mvp = sorted[0];

  mvpNameEl.textContent = mvp.name;
  mvpRoleEl.textContent = mvp.role;
  mvpTierEl.textContent = mvp.tier;
  mvpKdEl.textContent = (Number(mvp.kdRatio) || 0).toFixed(2);
  mvpMatchesEl.textContent = mvp.matchesPlayed || 0;
  mvpWinsEl.textContent = mvp.wins || 0;

  // Handle image
  if (mvp.imageUrl) {
    mvpImageContainer.innerHTML = `<img src="${mvp.imageUrl}" alt="${mvp.name}" class="w-full h-full object-cover">`;
  } else {
    mvpImageContainer.innerHTML = `
      <div class="w-full h-full flex items-center justify-center bg-zinc-900/60">
        <span class="text-xl font-bold text-amber-500 font-tactical">${mvp.name.substring(0, 2).toUpperCase()}</span>
      </div>
    `;
  }
}

// Mini roster showing up to 4 players with quick stats
function updateMiniRoster(friends) {
  if (!miniRosterEl) return;

  if (friends.length === 0) {
    miniRosterEl.innerHTML = `
      <div class="flex flex-col items-center justify-center py-10 text-gray-500">
        <span class="text-xs font-mono-tactical uppercase">NO SOLDIERS REGISTERED YET</span>
        <a href="admin.html" class="text-xs text-yellow-500 hover:underline mt-2">Add First Player</a>
      </div>
    `;
    return;
  }

  // Take first 4 friends
  const displayFriends = friends.slice(0, 4);
  let html = "";

  displayFriends.forEach(f => {
    let statusColor = "bg-gray-500";
    let pulseClass = "";
    if (f.status === "Online") {
      statusColor = "bg-green-500";
      pulseClass = "status-pulse-online";
    } else if (f.status === "In-Game") {
      statusColor = "bg-blue-500";
      pulseClass = "status-pulse-ingame";
    }

    const avatar = f.imageUrl 
      ? `<img src="${f.imageUrl}" alt="${f.name}" class="w-full h-full object-cover">`
      : `<span class="text-xs font-bold text-yellow-500">${f.name.substring(0, 2).toUpperCase()}</span>`;

    html += `
      <div class="flex items-center justify-between py-3.5 group hover:bg-zinc-900/20 px-2 rounded-xl transition-all">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center relative">
            ${avatar}
            <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#11151c] ${statusColor} ${pulseClass}"></span>
          </div>
          <div>
            <h5 class="text-sm font-semibold text-white tracking-tight font-tactical group-hover:text-yellow-500 transition-colors">${f.name}</h5>
            <p class="text-[10px] text-gray-500 font-mono-tactical">ID: ${f.bgmiId}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <span class="text-xs font-bold text-gray-400 block font-mono-tactical">K/D: ${(Number(f.kdRatio) || 0).toFixed(2)}</span>
            <span class="text-[10px] text-gray-500 block">${f.role}</span>
          </div>
          <div class="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-yellow-500 font-mono-tactical">
            ${f.tier}
          </div>
        </div>
      </div>
    `;
  });

  miniRosterEl.innerHTML = html;
}
