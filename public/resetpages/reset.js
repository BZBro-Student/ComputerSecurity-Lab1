document.addEventListener('DOMContentLoaded', () => {
    const step1Form = document.getElementById('resetStep1Form');
    const step2Form = document.getElementById('resetStep2Form');

    if (step1Form) {
        step1Form.addEventListener('submit', handleStep1Submit);
    }

    if (step2Form) {
        loadSecurityQuestions();
        step2Form.addEventListener('submit', handleStep2Submit);
    }
});

function handleStep1Submit(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('username')?.value.trim();

    if (!usernameInput) {
        alert('Please enter a valid username.');
        return;
    }

    sessionStorage.setItem('resetUsername', usernameInput);
    window.location.href = '/resetpages/security.html';
}

async function loadSecurityQuestions() {
    const username = sessionStorage.getItem('resetUsername');
    if (!username) {
        window.location.href = '/resetpages/reset.html';
        return;
    }

    try {
        const response = await fetch('/api/get-security-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        if (!response.ok) {
            alert('Unable to retrieve security questions. Please check the username or try registering again.');
            sessionStorage.removeItem('resetUsername');
            window.location.href = '/resetpages/reset.html';
            return;
        }

        const data = await response.json();
        document.getElementById('question1').textContent = data.questionOne || 'Question 1';
        document.getElementById('question2').textContent = data.questionTwo || 'Question 2';
        document.getElementById('question3').textContent = data.questionThree || 'Question 3';
    } catch (error) {
        alert('Network error. Please try again later.');
    }
}

async function handleStep2Submit(event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const username = sessionStorage.getItem('resetUsername');
    const answer1 = document.getElementById('security1')?.value.trim();
    const answer2 = document.getElementById('security2')?.value.trim();
    const answer3 = document.getElementById('security3')?.value.trim();
    const newPassword = document.getElementById('newpassword')?.value;
    const confirmPassword = document.getElementById('checknewpassword')?.value;

    if (!username) {
        alert('Session expired. Please restart the password reset process.');
        window.location.href = '/resetpages/reset.html';
        return;
    }

    if (!answer1 || !answer2 || !answer3) {
        alert('Please answer all three security questions.');
        return;
    }

    if (!newPassword || newPassword.length < 15) {
        alert('Password must be at least 15 characters long.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    
    if (submitBtn) submitBtn.disabled = true;

    try {
        const response = await fetch('/api/password-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                username,
                newPassword,
                answers: [answer1, answer2, answer3]
            })
        });

        const result = await response.json();

        if (response.ok) {
            sessionStorage.removeItem('resetUsername');
            alert('Password reset successful. Please log in.');
            window.location.href = '/index.html';
        } else {
            alert(result.error || 'Password reset failed. Please check your answers.');
        }
    } catch (error) {
        alert('Network error. Please try again later.');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}