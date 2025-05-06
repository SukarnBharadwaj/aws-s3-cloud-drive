const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send(`
        <h1>Login</h1>
        <form action="/login" method="post">
            <label for="username">Username:</label>
            <input type="text" name="username" id="username" required />
            <br />
            <label for="password">Password:</label>
            <input type="password" name="password" id="password" required />
            <br />
            <button type="submit">Login</button>
        </form>
    `);
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === process.env.LOGIN_USERNAME && password === process.env.LOGIN_PASSWORD) {
        req.session.loggedIn = true;
        return res.redirect('/upload');
    } else {
        return res.status(401).send('<h1>Invalid credentials</h1><a href="/login">Try again</a>');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
