import { auth, signInWithEmailAndPassword, onAuthStateChanged } from "./firebase.js";

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorAlert = document.getElementById("error-alert");
const submitBtn = document.getElementById("submit-btn");

// Redirect to admin.html if already logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "admin.html";
  }
});

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Reset alert
    errorAlert.classList.add("hidden");
    
    // Button loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-black inline" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      SECURE VERIFYING...
    `;
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success triggers onAuthStateChanged, which redirects to admin.html
    } catch (err) {
      console.error("Login failed:", err);
      errorAlert.textContent = `Security failure: ${err.message || 'Verification rejected.'}`;
      errorAlert.classList.remove("hidden");
      
      // Reset button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}
