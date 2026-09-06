let userInfo = { username: "", password: "" }

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

async function startLogin() {
    let user = document.getElementById('username')?.value.trim()
    let password = document.getElementById('password')?.value.trim()

    if (!user || !password) {
        alert("Both Username and Password must not be empty");
        return false;
    }

    const isUnique = await checkIfUnique()
    if (isUnique) {
        alert("Wrong username or password")
        return false
    }

    const response = await fetch('http://localhost:3000/login', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: user,
            password: password
        })
    });

    const result = await response.json();

    if (response.ok) {
        console.log('Password accepted:', result);
        return true
    } else {
        alert(result.error || 'Wrong username or password')
        return false;
    }


}

async function completeLogin() {
    if (await startLogin()) {
        window.location.href = "login.html"
    }
}