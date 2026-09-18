# Project #: Lab 1

* Author: Broden Benson
* Class: CS331
* Semester: Fall 2026

## Overview

Program uses localhost to serve a mock login page. The login page allows
registration, password reset, and logging in.

## Compiling and Using

User must have node and npm installed, you can check this using the commands:

node -v

npm -v

If not installed please install those.

Once installed you need to install the dependencies using the command:

npm install

To finally run the server you can use the command:

node server.js

## Testing

I would test by registering my account first, logging in, and then attempting to reset my password, and logging in. Once I had verified that log in and reset worked I tested a few other things such as
making sure no duplicate users could be registered, and that the 15 character password requirement is also enforced. Also should work as expected as I haven't found any errors that occur while the surver is running.