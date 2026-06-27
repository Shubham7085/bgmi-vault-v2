import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

document.getElementById("loginBtn").onclick = function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      document.getElementById("status").innerHTML = "✅ Login Successful";
      window.location.href = "friends.html";
    })
    .catch((error) => {
      document.getElementById("status").innerHTML =
        "❌ " + error.message;
    });

};
