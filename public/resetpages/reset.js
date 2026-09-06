let userInfo = { username: "", password: "", questionOne: "", questionTwo: "", questionThree: "", answerOne: "", answerTwo: "", answerThree: "" }

async function checkIfUnique() {
    let user = document.getElementById('username')?.value.trim();
    const response = await fetch('http://localhost:3000/usercheck', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user })
    })
    const data = await response.json();
    return data.unique
}

async function validateReset() {
    let user = document.getElementById('username')?.value.trim();
    let newPassword = document.getElementById('newpassword')?.value.trim();
    let newPasswordagain = document.getElementById('checknewpassword')?.value.trim();
    if (!user || !newPassword) {
        alert("Both Username and Password must not be empty");
        return false;
    }
    const isUnique = await checkIfUnique()
    if (!isUnique) {

        if (newPassword.length < 15) {
            alert("Password must be 15 characters or more");
            return false;
        }
        if (newPassword === newPasswordagain) {
            sessionStorage.setItem('username', user)
            sessionStorage.setItem('password', newPassword)
            return true;
        } else {
            console.warn(newPassword)
            console.warn(newPasswordagain)
            console.warn("WHAT")
            alert("Passwords do not match");
            return false;
        }

    } else {
        alert("User does not exist")
        return false
    }
}

async function questionNext() {
       
       const cont = await validateReset()
       alert(String(cont))
    if (cont) {
        alert("The button is connected!");
        window.location.href = "/resetpages/security.html"
    }
}

async function security() {
    userInfo.username = sessionStorage.getItem('username')
    userInfo.password = sessionStorage.getItem('password')

    const response = await fetch('http://localhost:3000/questioncheck', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: userInfo.username })
    });
    const data = await response.json();

    if (response.ok) {
        document.getElementById("question1").textContent = data.questionOne;
        document.getElementById("question2").textContent = data.questionTwo;
        document.getElementById("question3").textContent = data.questionThree;
    }
}

if (window.location.pathname.includes('security.html')) {
    security();
}

async function submit() {
    let answer1 = document.getElementById("security1").value.trim();
    let answer2 = document.getElementById("security2").value.trim();
    let answer3 = document.getElementById("security3").value.trim();

    let username = sessionStorage.getItem('username');
    let newPassword = sessionStorage.getItem('password');

    if (!answer1 || !answer2 || !answer3) {
        alert("You must answer all questions");
        return false;
    }

    const response = await fetch('http://localhost:3000/passwordset', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            newPassword: newPassword,
            answers: [answer1, answer2, answer3]
        })
    });

    const result = await response.json();

    if (response.ok) {
        console.log('Password reset successful:', result);
        return true;
    } else {
        alert(result.error || 'Security answers were incorrect.');
        return false;
    }

}

async function finishReset() {
    if (await submit()) {
        sessionStorage.clear()
        window.location.href = "/index.html"
    }
}