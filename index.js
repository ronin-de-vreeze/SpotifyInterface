// Imports
const express = require('express');
const app = express();
const path = require('path');

// Built-in middleware
app.use(express.json());
app.use(require('cookie-parser')());

// Other routes
const authRoutes = require('./public/Server/auth.js');
const apiRoutes = require("./public/Server/api.js");
app.use("/", authRoutes);
app.use("/", apiRoutes);

// Home route
app.get('/', (req, res) => {
    const accessToken = req.cookies.access_token;

    // Check if the token exists
    if (!accessToken) {
        // Homepage to login
        res.sendFile((path.join(__dirname, "public/login.html")));
    } else {
        // Homepage with app
        // Todo: Verify token validty
        res.sendFile((path.join(__dirname, "public/app.html")));
    }
});

app.use(express.static(__dirname + '/public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    // console.log(`Server listening on port ${PORT}`);
});