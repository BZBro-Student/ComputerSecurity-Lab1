const express = require('express');
const path = require('path');
const {DatabaseSync} = require('node:sqlite');
const database = new DatabaseSync('user.db');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, 'public')));


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});