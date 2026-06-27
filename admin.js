import { auth, db, storage, signOut, onAuthStateChanged, collection, addDoc, updateDoc, doc, ref, uploadBytesResumable, getDownloadURL, getDocs } from "./firebase.js";

// DOM elements
const routeGuardLoader = document.getElementById("route-guard-loader");
const adminMainContent = document.getElementById("admin-main-content");
const authBadge = document.getElementById("auth-badge");
const userInfo = document.getElementById("user-info");
const userDisplayEmail = document.getElementById("user-display-email");
const logoutBtn = document.getElementById("logout-btn");

const friendForm = document.getElementById("friend-form");
const panelTitle = document.getElementById("panel-title");
const panelSubtitle = document.getElementById("panel-subtitle");
const saveBtn = document.getElementById("save-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const nameInput = document.getElementById("name");
const bgmiIdInput = document.getElementById("bgmiId");
const roleInput = document.getElementById("role");
const tierInput = document.getElementById("tier");
const favouriteWeaponInput = document.getElementById("favouriteWeapon");
const statusInput = document.getElementById("status");
const kdRatioInput = document.getElementById("kdRatio");
const matchesPlayedInput = document.getElementById("matchesPlayed");
const winsInput = document.getElementById("wins");

const imageUpload = document.getElementById("image-upload");
const uploadTriggerBtn = document.getElementById("upload-trigger-btn");
const imagePreview = document.getElementById("image-preview");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");
const progressPercentage = document.getElementById("progress-percentage");
const presetsGrid = document.getElementById("presets-grid");

let currentUserId = null;
let editFriendId = null;
let uploadedImageUrl = "";

// 4 High-fidelity gaming avatars from Unsplash to use as instant presets!
const AVATAR_PRESETS = [
  { name: "Slayer", url: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=150&q=80" },
  { name: "Ghost", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80" },
  { name: "Ranger", url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80" },
  { name: "Viper", url: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80" }
];

// 1. Guard route access
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Unauthenticated: Redirect to login
    window.location.href = "login.html";
  } else {
    // Authenticated
    currentUserId = user.uid;
    if (routeGuardLoader) routeGuardLoader.classList.add("hidden");
    if (adminMainContent) adminMainContent.classList.remove("hidden");
    
    if (authBadge) {
      authBadge.textContent = "ADMIN ACCESS";
      authBadge.className = "hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono-tactical";
    }
    if (userDisplayEmail) userDisplayEmail.textContent = user.email || "Admin";
    if (userInfo) userInfo.style.display = "flex";

    // Setup Admin Panel states
    setupPresets();
    await checkEditMode();
  }
});

// Logout handler
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

// 2. Scan and hydration for edit modes
async function checkEditMode() {
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("edit");
  
  if (!editId) return;

  editFriendId = editId;
  panelTitle.textContent = "EDIT SOLDIER DOSSIER";
  panelSubtitle.textContent = "UPDATE SQUAD COMM-COORD";
  saveBtn.textContent = "Update Combat Dossier";
  if (cancelEditBtn) cancelEditBtn.classList.remove("hidden");

  try {
    // Read list to locate selected soldier (since snapshot has already loaded or we can fetch)
    const friendsCollection = collection(db, "friends");
    const snapshot = await getDocs(friendsCollection);
    let target = null;
    snapshot.forEach(doc => {
      if (doc.id === editId) {
        target = { id: doc.id, ...doc.data() };
      }
    });

    if (target) {
      // Hydrate forms
      nameInput.value = target.name || "";
      bgmiIdInput.value = target.bgmiId || "";
      roleInput.value = target.role || "Assaulter";
      tierInput.value = target.tier || "Crown";
      favouriteWeaponInput.value = target.favouriteWeapon || "";
      statusInput.value = target.status || "Offline";
      kdRatioInput.value = target.kdRatio || "0.00";
      matchesPlayedInput.value = target.matchesPlayed || "0";
      winsInput.value = target.wins || "0";
      
      if (target.imageUrl) {
        uploadedImageUrl = target.imageUrl;
        updatePreview(target.imageUrl);
      }
    } else {
      alert("Target soldier record not found.");
      window.location.href = "friends.html";
    }
  } catch (err) {
    console.error("Hydration failed:", err);
    alert(`Dossier load failure: ${err.message}`);
  }
}

// 3. Preset Avatars setup
function setupPresets() {
  if (!presetsGrid) return;

  let html = "";
  AVATAR_PRESETS.forEach(preset => {
    html += `
      <button type="button" data-url="${preset.url}" class="preset-btn w-12 h-12 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center hover:border-yellow-500/50 transition-all shrink-0">
        <img src="${preset.url}" alt="${preset.name}" class="w-full h-full object-cover">
      </button>
    `;
  });
  presetsGrid.innerHTML = html;

  // Click presets
  const presetBtns = document.querySelectorAll(".preset-btn");
  presetBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      uploadedImageUrl = url;
      updatePreview(url);
    });
  });
}

function updatePreview(url) {
  if (imagePreview) {
    imagePreview.innerHTML = `<img src="${url}" class="w-full h-full object-cover">`;
    imagePreview.className = "w-32 h-32 rounded-2xl border-2 border-yellow-500/40 bg-zinc-950 flex flex-col items-center justify-center overflow-hidden mb-4 relative";
  }
}

// 4. File Upload Logic
if (uploadTriggerBtn && imageUpload) {
  uploadTriggerBtn.addEventListener("click", () => {
    imageUpload.click();
  });

  imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File is too large. Max size limit is 2MB.");
      return;
    }

    // Trigger upload
    const storageRef = ref(storage, `avatars/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    progressContainer.classList.remove("hidden");

    uploadTask.on("state_changed", 
      (snapshot) => {
        // Progress updates
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        progressBar.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress}%`;
      }, 
      (error) => {
        console.error("Upload failed:", error);
        alert(`Transmission interrupted: ${error.message}`);
        progressContainer.classList.add("hidden");
      }, 
      async () => {
        // Complete upload
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          uploadedImageUrl = downloadUrl;
          updatePreview(downloadUrl);
          progressContainer.classList.add("hidden");
        } catch (err) {
          console.error("Retrieve URL failed:", err);
          alert(`Failed to retrieve upload asset link: ${err.message}`);
        }
      }
    );
  });
}

// 5. Submit Form (Save or Update)
if (friendForm) {
  friendForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const bgmiId = bgmiIdInput.value.trim();
    const role = roleInput.value;
    const tier = tierInput.value;
    const favouriteWeapon = favouriteWeaponInput.value.trim() || "M416";
    const status = statusInput.value;
    const kdRatio = Number(kdRatioInput.value) || 0.0;
    const matchesPlayed = parseInt(matchesPlayedInput.value) || 0;
    const wins = parseInt(winsInput.value) || 0;

    // Validate rules manually
    if (!name || name.length > 100) {
      alert("Name is required and must be under 100 characters.");
      return;
    }
    if (!bgmiId || bgmiId.length > 50) {
      alert("Character ID is required and must be under 50 characters.");
      return;
    }

    const docData = {
      name,
      bgmiId,
      role,
      tier,
      kdRatio,
      matchesPlayed,
      wins,
      favouriteWeapon,
      imageUrl: uploadedImageUrl || null,
      status
    };

    // Button loading
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.textContent = editFriendId ? "UPDATING DOSSIER..." : "REGISTERING SOLDIER...";

    try {
      if (editFriendId) {
        // Update document
        await updateDoc(doc(db, "friends", editFriendId), docData);
        alert(`Dossier for "${name}" updated successfully.`);
      } else {
        // Create document
        await addDoc(collection(db, "friends"), docData);
        alert(`Soldier "${name}" registered into squad successfully.`);
      }
      
      // Redirect to roster list
      window.location.href = "friends.html";
    } catch (err) {
      console.error("Database operation failed:", err);
      alert(`Database error: Failed to save record. Details: ${err.message}`);
      
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  });
}
