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

async function validateRegistration() {
    let user = document.getElementById('username')?.value.trim();
    let newPassword = document.getElementById('newpassword')?.value.trim();
    let newPasswordagain = document.getElementById('checknewpassword')?.value.trim();



    if (user == '' || newPassword == '') {
        alert("Both Username and Password must not be empty");
        return false;
    }

    const isUnique = await checkIfUnique();
    if (!isUnique) {
        alert("Username already in use")
        return false;
    }

    if (newPassword.length < 15) {
        alert("Password must be 15 characters or more");
        return false;
    }

    if (newPassword === newPasswordagain) {
        sessionStorage.setItem('username', user);
        sessionStorage.setItem('password', newPassword);
        return true;
    } else {
        console.warn(newPassword)
        console.warn(newPasswordagain)
        console.warn("WHAT")
        alert("Passwords do not match");
        return false;
    }
}

async function securityNext() {
    if (await validateRegistration()) {
        window.location.href = "/registration/question.html";
    }
}

function validateSecurity() {
    let questionOne = document.getElementById('security1')?.value?.trim();
    let questionTwo = document.getElementById('security2')?.value?.trim();
    let questionThree = document.getElementById('security3')?.value?.trim();
    let answerOne = document.getElementById('answer1')?.value?.trim();
    let answerTwo = document.getElementById('answer2')?.value?.trim();
    let answerThree = document.getElementById('answer3')?.value?.trim();

    if (!questionOne || !questionTwo || !questionThree) {
        console.warn("You must make 3 questions!");
        return false;
    }
    if (!answerOne || !answerTwo || !answerThree) {
        console.warn("You must answer all questions");
        return false;
    }

    userInfo.username = sessionStorage.getItem('username')
    userInfo.password = sessionStorage.getItem('password')
    userInfo.questionOne = questionOne;
    userInfo.questionTwo = questionTwo;
    userInfo.questionThree = questionThree;
    userInfo.answerOne = answerOne;
    userInfo.answerTwo = answerTwo;
    userInfo.answerThree = answerThree;

    fetch('http://localhost:3000/data', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userInfo)
    })
        .then(response => response.json())
        .then(result => console.log('Server response:', result))
        .then(result => console.log('Server response:', result))
    return true;
}

function completeRegistration() {
    if (validateSecurity()) {
        sessionStorage.clear()
        window.location.href = "/index.html";
    }
}