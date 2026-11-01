# Project #: Lab 4

* Author: Broden Benson
* Class: CS331
* Semester: Fall 2026

## Overview

Program uses an express server to serve a mock login page

## Compiling and Using

User must have node and npm installed, you can check this using the commands:

node -v

npm -v

If not installed please install those.

Once installed you need to install the dependencies using the command:

npm install

To finally run the server you can use the command:

node server.js

## System Requirements

### User Login:

This login page allows a user to login. On a failed attempt the page displays a generic "wrong username or password error". This is an example of Minimization of Information Disclosure as it prevents a attacker from determining valid usernames, an attacker may be attacking a completely non existent account.

This login page after 3 failed attempts locks the account for 15 minutes, this is an example of a Rate Limit which mitigates the effectiveness of brute force attacks. This slows the attacker down to a point were brute forcing becomes impheasible.

### Password Storage:

Password storage and security question answers were already stored using a bcrypt hash with a salt value. I adjusted it to be a unique salt each time. One thing that was an issue was that during account creation the plaintext password was temporarily stored in memory in the user session, it has been changed to be stored in server memory instead. Also routes were unprotected, adjusted to an API infrustructure to prevent this.

## Testing

You can try testing this by creating an account, logging in, logging out, failing 3 logins to verify lockout, and then using a password reset to reset the lockout, and then logging in again (unless you want to wait 15 minutes)