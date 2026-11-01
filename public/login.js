document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            await completeLogin();
        });
    }
});

async function startLogin() {
    const usernameInput = document.getElementById('username')?.value.trim();
    const passwordInput = document.getElementById('password')?.value.trim();

    if (!usernameInput || !passwordInput) {
        alert("Both Username and Password must not be empty.");
        return false;
    }

    try {
        const response = await fetch('/api/login', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin', 
            body: JSON.stringify({
                username: usernameInput,
                password: passwordInput
            })
        });

        const data = await response.json();

        if (response.ok) {
            return true;
        } else {
            alert(data.error || "Invalid username or password.");
            return false;
        }
    } catch (error) {
        alert("Unable to connect to the server. Please try again later.");
        return false;
    }
}

async function completeLogin() {
    const success = await startLogin();
    if (success) {
        window.location.href = "/login.html";
    }
}