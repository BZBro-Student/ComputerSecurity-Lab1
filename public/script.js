let userInfo = {username : '', password : ''}

function validateLogin() {

}

function validateReset() {

}

function validateRegistration() {
    let user = document.getElementById('username').value
    let newPassword = document.getElementById('newpassword').value
    let newPasswordagain = document.getElementById('newpasswordagain').value
    
    if (newPassword === newPasswordagain) {
        userInfo.username = user
        userInfo.password = newPassword
        return true
    } else {
        return false
    }
}

function validateSecurityanswers() {

}