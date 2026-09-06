const express = require('express');
const bcrypt = require('bcrypt');
const saltLevel = 10;
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const database = new DatabaseSync('user.db')
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

//SQL functions

async function getQuestion(username) {
  const stmt = database.prepare(`
    SELECT questionOne, questionTwo, questionThree, answerOne, answerTwo, answerThree
    FROM data
    WHERE username = ?
    `)
  const result = stmt.get(username)
  return result
}

async function setPassword(username, password) {
  let pass = await bcrypt.hash(password, saltLevel)
  const stmt = database.prepare(`
    UPDATE data
    SET password = ?
    WHERE username = ? 
    `)

  const result = stmt.run(pass, username);
  return result.changes > 0;
}

async function add(username, password, questionOne, questionTwo,
  questionThree, answer1, answer2, answer3) {
  let pass = await bcrypt.hash(password, saltLevel);
  let a1 = await bcrypt.hash(answer1.toLowerCase(), saltLevel);
  let a2 = await bcrypt.hash(answer2.toLowerCase(), saltLevel);
  let a3 = await bcrypt.hash(answer3.toLowerCase(), saltLevel);
  const stmt = database.prepare(
    `INSERT INTO data (username, password, questionOne, questionTwo, questionThree,
    answerOne,answerTwo,answerThree) VALUES (?,?,?,?,?,?,?,?)`);
  const result = stmt.run(username, pass, questionOne, questionTwo, questionThree, a1, a2, a3)
  console.log(`Row inserted with ID: ${result.lastInsertRowid}`);
  console.warn("made statements")
  return result;
}

async function checkIfUnique(user) {
  const stmt = database.prepare(`SELECT EXISTS(SELECT 1 FROM data 
    WHERE username = ?) AS "exists"`);
  const result = stmt.get(user);
  const isUnique = result.exists === 0;
  return isUnique;
}

//receive username for check
app.use(express.json())
app.post('/usercheck', async (req, res) => {
  try {
    const { user } = req.body
    let result = await checkIfUnique(user);
    return res.status(200).json({
      unique: Boolean(result)
    });
  } catch (error) {
    console.error('error:', error)
    return res.status(500).json({ error: 'Internal server error' });
  }
});

//receive registration data
app.post('/data', async (req, res) => {
  try {
    const { username, password, questionOne, questionTwo,
      questionThree, answerOne, answerTwo, answerThree } = req.body
    console.log(`Received: ${username}`);
    await add(username, password, questionOne, questionTwo, questionThree, answerOne, answerTwo, answerThree)
    console.log("add completed")
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'User failed' });
  };
});

//receive username to send questions
app.post('/questioncheck', async (req, res) => {
  try {
    const { username } = req.body
    let result = await getQuestion(username);
    return res.status(200).json({
      questionOne: result.questionOne,
      questionTwo: result.questionTwo,
      questionThree: result.questionThree
    });
  } catch (error) {
    console.error('error:', error)
    return res.status(500).json({ error: 'Internal server error' });
  }
});

//receive username to send questions
app.post('/passwordcheck', async (req, res) => {
  try {
    const { username } = req.body
    let result = await getQuestion(username);
    return res.status(200).json(result);
  } catch (error) {
    console.error('error:', error)
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/passwordset', async (req, res) => {
  try {
    const { username, newPassword, answers } = req.body
    const userData = await getQuestion(username)
    if (!answers || answers.length !== 3) {
      return res.status(400).json({ error: 'Missing security answers' });
    }
    const isMatch1 = await bcrypt.compare(answers[0].toLowerCase(), userData.answerOne);
    const isMatch2 = await bcrypt.compare(answers[1].toLowerCase(), userData.answerOne);
    const isMatch3 = await bcrypt.compare(answers[2].toLowerCase(), userData.answerOne);

    if (isMatch1 && isMatch2 && isMatch3) {
      const success = await setPassword(username, newPassword);
      if (success) {
        return res.status(200).json({ message: 'Password reset succesful' });
      } else {
        return res.status(500).json({ error: 'Failed to update database' })
      }
    } else {
      return res.status(401).json({ error: 'Security answers were incorrect' });
    }
  } catch (error) {
    res.status(500).json({ error: 'User failed' });
  };
});