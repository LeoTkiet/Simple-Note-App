import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const API_URL = "http://127.0.0.1:8000";

// Fetch Firebase Configuration from Backend
async function initApp() {
    try {
        const configRes = await fetch(`${API_URL}/config`);
        const firebaseConfig = await configRes.json();

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();

        setupUI(auth, provider);
    } catch (e) {
        console.error("Failed to load Firebase config from backend", e);
        alert("Cannot connect to server to load configuration.");
    }
}

function setupUI(auth, provider) {
    // DOM Elements
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const userInfo = document.getElementById('user-info');
    const notesList = document.getElementById('notes-list');

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    const toggleToRegister = document.getElementById('toggle-to-register');
    const toggleToLogin = document.getElementById('toggle-to-login');

    // Form Toggle
    window.toggleAuth = (mode) => {
        if (mode === 'register') {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            authTitle.innerText = 'Create an Account';
            toggleToRegister.classList.add('hidden');
            toggleToLogin.classList.remove('hidden');
        } else {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            authTitle.innerText = 'Welcome Back';
            toggleToRegister.classList.remove('hidden');
            toggleToLogin.classList.add('hidden');
        }
    };

    // Authentication State Listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            authContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            userInfo.innerText = user.email || user.displayName || 'User';
            fetchNotes();
        } else {
            authContainer.classList.remove('hidden');
            appContainer.classList.add('hidden');
        }
    });

    // Email Login
    window.login = async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        if (!email || !password) return alert('Please enter both email and password');

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert("Login failed: " + error.message);
        }
    };

    // Email Registration
    window.register = async () => {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        if (!email || !password) return alert('Please enter both email and password');

        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert("Registration failed: " + error.message);
        }
    };

    // Google Login
    window.loginWithGoogle = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            alert("Google sign-in failed: " + error.message);
        }
    };

    // Logout
    window.logout = async () => {
        await signOut(auth);
        notesList.innerHTML = '';
    };

    // Fetch Notes
    async function fetchNotes() {
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${API_URL}/notes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const notes = await res.json();
            notesList.innerHTML = notes.map(n => `<li class="note-item">${n.content}</li>`).join('');
        } catch (e) {
            console.error("Error fetching notes", e);
        }
    }

    // Add Note
    window.addNote = async () => {
        const contentInput = document.getElementById('note-content');
        const content = contentInput.value.trim();
        if (!content) return;

        try {
            const token = await auth.currentUser.getIdToken();
            await fetch(`${API_URL}/notes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });
            contentInput.value = '';
            fetchNotes();
        } catch (e) {
            console.error("Error adding note", e);
        }
    };
}

// Start the app
initApp();
