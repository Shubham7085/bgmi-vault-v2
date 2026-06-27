import { auth, db, signOut, onAuthStateChanged, collection, onSnapshot, query, orderBy } from "./firebase.js";

// DOM Elements
const authBadge = document.getElementById("auth-badge");
const userInfo = document.getElementById("user-info");
const userDisplayEmail = document.getElementById("user-display-email");
const logoutBtn = document.getElementById("logout-btn");
const signinBtn = document.getElementById("signin-btn");
const adminNavLink = document.getElementById("admin-nav-link");

const sortKdBtn = document.getElementById("sort-kd");
const sortWinsBtn = document.getElementById("sort-wins");
const sortMatchesBtn = document.getElementById("sort-matches");
const leaderboardBody = document.getElementById("leaderboard-body");

let currentSort = "kdRatio"; // kdRatio, wins, matchesPlayed
let rawFriendsList = [];

// 1. Auth Status Tracker
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (authBadge) {
      authBadge.textContent = "ADMIN ACCESS";
      authBadge.className = "hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono-tactical";
    }
    if (userDisplayEmail) userDisplayEmail.textContent = user.email || "Admin";
    if (userInfo) userInfo.style.display = "flex";
    if (signinBtn) signinBtn.style.display = "none";
    if (adminNavLink) adminNavLink.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>Admin Panel`;
  } else {
    if (authBadge) {
      authBadge.textContent = "SECURE COMMS";
      authBadge.className = "hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono-tactical";
    }
    if (userInfo) userInfo.style.display = "none";
    if (signinBtn) signinBtn.style.display = "inline-block";
    if (adminNavLink) adminNavLink.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>Admin Panel`;
  }
});

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

// 2. Real-time Firebase snapshot hook
const friendsCollection = collection(db, "friends");
const q = query(friendsCollection, orderBy("name", "asc"));

onSnapshot(q, (snapshot) => {
  rawFriendsList = [];
  snapshot.forEach((doc) => {
    rawFriendsList.push({ id: doc.id, ...doc.data() });
  });
  renderLeaderboard();
}, (error) => {
  console.error("Leaderboard fetch error:", error);
  if (leaderboardBody) {
    leaderboardBody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-red-400 font-mono-tactical text-xs">
          Roster Link Comms Interrupted: ${error.message}
        </td>
      </tr>
    `;
  }
});

// 3. Tab State Controller
function setActiveTab(activeBtn) {
  [sortKdBtn, sortWinsBtn, sortMatchesBtn].forEach(btn => {
    if (btn) {
      btn.className = "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase font-tactical text-gray-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800";
    }
  });
  if (activeBtn) {
    activeBtn.className = "px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase font-tactical bg-yellow-500 text-black shadow shadow-yellow-500/10 border border-yellow-500/10";
  }
}

if (sortKdBtn) {
  sortKdBtn.addEventListener("click", () => {
    currentSort = "kdRatio";
    setActiveTab(sortKdBtn);
    renderLeaderboard();
  });
}
if (sortWinsBtn) {
  sortWinsBtn.addEventListener("click", () => {
    currentSort = "wins";
    setActiveTab(sortWinsBtn);
    renderLeaderboard();
  });
}
if (sortMatchesBtn) {
  sortMatchesBtn.addEventListener("click", () => {
    currentSort = "matchesPlayed";
    setActiveTab(sortMatchesBtn);
    renderLeaderboard();
  });
}

// 4. Rankings Renderer
function renderLeaderboard() {
  if (!leaderboardBody) return;

  if (rawFriendsList.length === 0) {
    leaderboardBody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-gray-500 font-mono-tactical text-xs">
          NO SQUAD COMBATANTS CONFIGURED YET.
        </td>
      </tr>
    `;
    return;
  }

  // Sort array depending on selected metrics
  const sorted = [...rawFriendsList].sort((a, b) => {
    const valA = Number(a[currentSort]) || 0;
    const valB = Number(b[currentSort]) || 0;
    return valB - valA;
  });

  let html = "";
  sorted.forEach((f, idx) => {
    const rank = idx + 1;
    let rankDisplay = "";

    // Podium Medal Styles
    if (rank === 1) {
      rankDisplay = `
        <div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-600 via-amber-500 to-yellow-300 text-black font-extrabold font-mono-tactical text-sm shadow shadow-yellow-500/20" title="Squad Champion">
          1
        </div>
      `;
    } else if (rank === 2) {
      rankDisplay = `
        <div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-500 via-zinc-400 to-zinc-300 text-black font-extrabold font-mono-tactical text-sm shadow shadow-zinc-400/20" title="Squad Runner-up">
          2
        </div>
      `;
    } else if (rank === 3) {
      rankDisplay = `
        <div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-800 via-amber-700 to-orange-600 text-black font-extrabold font-mono-tactical text-sm shadow shadow-amber-700/20" title="Podium Third">
          3
        </div>
      `;
    } else {
      rankDisplay = `<span class="text-xs text-gray-500 font-mono-tactical">${rank}</span>`;
    }

    const avatar = f.imageUrl 
      ? `<img src="${f.imageUrl}" alt="${f.name}" class="w-full h-full object-cover">`
      : `<span class="text-xs font-bold text-yellow-500">${f.name.substring(0, 2).toUpperCase()}</span>`;

    const winRate = f.matchesPlayed > 0 
      ? ((f.wins / f.matchesPlayed) * 100).toFixed(1) + "%" 
      : "0.0%";

    // Highlight metrics depending on sort state
    const kdClass = currentSort === "kdRatio" ? "text-yellow-400 font-black" : "text-gray-300";
    const winsClass = currentSort === "wins" ? "text-yellow-400 font-black" : "text-gray-300";
    const matchesClass = currentSort === "matchesPlayed" ? "text-yellow-400 font-black" : "text-gray-300";

    html += `
      <tr class="hover:bg-zinc-900/10 transition-colors group">
        <!-- Rank -->
        <td class="py-4 px-6 text-center">${rankDisplay}</td>
        
        <!-- Profile details -->
        <td class="py-4 px-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center shrink-0">
              ${avatar}
            </div>
            <div>
              <span class="text-sm font-bold text-white tracking-tight group-hover:text-yellow-500 transition-colors block">${f.name}</span>
              <span class="text-[10px] text-gray-500 font-mono-tactical uppercase">${f.tier}</span>
            </div>
          </div>
        </td>

        <!-- Role Spec -->
        <td class="py-4 px-4 text-xs font-semibold text-gray-400 font-mono-tactical">
          ${f.role}
        </td>

        <!-- KD -->
        <td class="py-4 px-4 text-center font-mono-tactical text-sm ${kdClass}">
          ${(Number(f.kdRatio) || 0).toFixed(2)}
        </td>

        <!-- Wins -->
        <td class="py-4 px-4 text-center font-mono-tactical text-sm ${winsClass}">
          ${f.wins || 0}
        </td>

        <!-- Matches -->
        <td class="py-4 px-4 text-center font-mono-tactical text-sm ${matchesClass}">
          ${f.matchesPlayed || 0}
        </td>

        <!-- Win Rate -->
        <td class="py-4 px-4 text-center font-mono-tactical text-xs text-gray-400">
          ${winRate}
        </td>
      </tr>
    `;
  });

  leaderboardBody.innerHTML = html;
}
