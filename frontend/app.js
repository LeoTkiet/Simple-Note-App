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

    // --- Confessions Logic ---
    let hasConfessionPassword = false;

    window.switchTab = async (tab) => {
        const notesSection = document.getElementById('notes-section');
        const confessionsSection = document.getElementById('confessions-section');
        const tabNotes = document.getElementById('tab-notes');
        const tabConfessions = document.getElementById('tab-confessions');

        if (tab === 'notes') {
            notesSection.classList.remove('hidden');
            confessionsSection.classList.add('hidden');
            tabNotes.classList.add('active');
            tabConfessions.classList.remove('active');
        } else {
            notesSection.classList.add('hidden');
            confessionsSection.classList.remove('hidden');
            tabNotes.classList.remove('active');
            tabConfessions.classList.add('active');
            
            // Check password status
            checkConfessionStatus();
        }
    };

    async function checkConfessionStatus() {
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${API_URL}/confessions/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            hasConfessionPassword = data.has_password;
            
            document.getElementById('confessions-chat').classList.add('hidden');
            document.getElementById('confessions-auth').classList.remove('hidden');
            document.getElementById('confessions-password').value = '';
            document.getElementById('confessions-auth-msg').innerText = '';
            
            if (hasConfessionPassword) {
                document.getElementById('confessions-auth-title').innerText = 'Nhập mật khẩu để vào Tâm sự';
                document.getElementById('confessions-auth-btn').innerText = 'Mở khóa';
                document.getElementById('confessions-reset-btn').style.display = 'block';
            } else {
                document.getElementById('confessions-auth-title').innerText = 'Tạo mật khẩu cho mục Tâm sự (Lần đầu)';
                document.getElementById('confessions-auth-btn').innerText = 'Tạo mật khẩu';
                document.getElementById('confessions-reset-btn').style.display = 'none';
            }
        } catch (e) {
            console.error("Error checking confession status", e);
        }
    }

    window.submitConfessionAuth = async () => {
        const password = document.getElementById('confessions-password').value;
        if (!password) return;

        try {
            const token = await auth.currentUser.getIdToken();
            const endpoint = hasConfessionPassword ? '/confessions/verify' : '/confessions/password';
            
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            if (res.ok) {
                document.getElementById('confessions-auth').classList.add('hidden');
                document.getElementById('confessions-chat').classList.remove('hidden');
                loadChatHistory();
            } else {
                const errorData = await res.json();
                document.getElementById('confessions-auth-msg').innerText = errorData.detail || "Đã có lỗi xảy ra";
            }
        } catch (e) {
            console.error("Auth error", e);
        }
    };

    window.resetConfessionPassword = async () => {
        const newPassword = prompt("Nhập mật khẩu mới (Lưu ý: Mọi lịch sử tâm sự sẽ bị xóa):");
        if (!newPassword) return;

        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${API_URL}/confessions/reset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password: newPassword })
            });

            if (res.ok) {
                alert("Đã reset mật khẩu và xóa lịch sử chat.");
                checkConfessionStatus();
            } else {
                alert("Lỗi khi reset mật khẩu");
            }
        } catch (e) {
            console.error("Reset error", e);
        }
    };

    async function loadChatHistory() {
        const chatHistoryDiv = document.getElementById('chat-history');
        chatHistoryDiv.innerHTML = '<div style="text-align:center; color:gray;">Đang tải...</div>';
        
        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${API_URL}/confessions/chat`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const chats = await res.json();
            
            chatHistoryDiv.innerHTML = '';
            chats.forEach(chat => {
                appendMessage('user', chat.user_message);
                appendMessage('ai', chat.ai_message);
            });
            scrollToBottom();
        } catch (e) {
            console.error("Error loading chat", e);
            chatHistoryDiv.innerHTML = '<div style="color:red;">Lỗi tải tin nhắn.</div>';
        }
    }

    function appendMessage(role, text) {
        const chatHistoryDiv = document.getElementById('chat-history');
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${role}`;
        msgDiv.innerText = text;
        chatHistoryDiv.appendChild(msgDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        const chatHistoryDiv = document.getElementById('chat-history');
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
    }

    window.sendChatMessage = async () => {
        const input = document.getElementById('chat-message');
        const message = input.value.trim();
        if (!message) return;

        appendMessage('user', message);
        input.value = '';
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-msg ai typing-indicator';
        typingDiv.innerText = 'Đợi tôi một tí nha...';
        document.getElementById('chat-history').appendChild(typingDiv);
        scrollToBottom();

        try {
            const token = await auth.currentUser.getIdToken();
            const res = await fetch(`${API_URL}/confessions/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            typingDiv.remove();
            
            if (res.ok) {
                const data = await res.json();
                appendMessage('ai', data.reply);
            } else {
                appendMessage('ai', 'Xin lỗi, tôi đang gặp trục trặc kỹ thuật.');
            }
        } catch (e) {
            console.error("Chat error", e);
            typingDiv.remove();
            appendMessage('ai', 'Lỗi kết nối.');
        }
    };
}

// Start the app
initApp();
