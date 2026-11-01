document.addEventListener('DOMContentLoaded', () => {
    const step1Form = document.getElementById('registerStep1Form');
    const step2Form = document.getElementById('registerStep2Form');

    if (step1Form) {
        step1Form.addEventListener('submit', handleStep1Submit);
    }

    if (step2Form) {
        if (!sessionStorage.getItem('registrationUsername')) {
            window.location.href = '/registration/registration.html';
            return;
        }
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

    sessionStorage.setItem('registrationUsername', usernameInput);
    window.location.href = '/registration/question.html';
}

async function handleStep2Submit(event) {
    event.preventDefault();

    const username = sessionStorage.getItem('registrationUsername');
    const newPassword = document.getElementById('newpassword')?.value;
    const confirmPassword = document.getElementById('checknewpassword')?.value;

    const questionOne = document.getElementById('security1')?.value.trim();
    const answerOne = document.getElementById('answer1')?.value.trim();
    const questionTwo = document.getElementById('security2')?.value.trim();
    const answerTwo = document.getElementById('answer2')?.value.trim();
    const questionThree = document.getElementById('security3')?.value.trim();
    const answerThree = document.getElementById('answer3')?.value.trim();

    if (!username) {
        alert('Session expired. Please restart registration.');
        window.location.href = '/registration/registration.html';
        return;
    }

    if (newPassword.length < 15) {
        alert('Password must be at least 15 characters long.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    if (!questionOne || !questionTwo || !questionThree || !answerOne || !answerTwo || !answerThree) {
        alert('All security questions and answers must be filled out.');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({
                username,
                password: newPassword,
                questions: [questionOne, questionTwo, questionThree],
                answers: [answerOne, answerTwo, answerThree]
            })
        });

        const result = await response.json();

        if (response.ok) {
            sessionStorage.removeItem('registrationUsername');
            alert('Registration successful! Please log in.');
            window.location.href = '/index.html';
        } else {
            alert(result.error || 'Registration failed. Please try a different username.');
        }
    } catch (error) {
        alert('Network error. Please try again later.');
    }
}