document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    verifySession();
});

async function verifySession() {
    try {
        const response = await fetch('/api/verify-session', {
            method: 'GET',
            credentials: 'same-origin'
        });

        if (!response.ok) {
            window.location.href = '/index.html';
        }
    } catch (error) {
        window.location.href = '/index.html';
    }
}

async function handleLogout() {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        window.location.href = '/index.html';
    }
}