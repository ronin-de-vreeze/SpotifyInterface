// Imports
const express = require('express');
const app = express();
const path = require('path');
require("dotenv").config();

// Built-in middleware
app.use(express.json());
app.use(require('cookie-parser')());

// Other routes
const authRoutes = require('./public/Server/auth.js');
const apiRoutes = require("./public/Server/api.js");
const modificationRoutes = require("./public/Server/modifications.js");
app.use("/", authRoutes);
app.use("/api", apiRoutes);
app.use("/api", modificationRoutes);

// Home route
app.get('/', (req, res) => {
    const accessToken = req.cookies.access_token;
    const userId = req.cookies.user_id;

    // Check if the token exists
    if (!accessToken || !userId) {
        // Homepage to login
        res.sendFile((path.join(__dirname, "public/Client/login.html")));
    } else {
        // Homepage with app
        res.sendFile((path.join(__dirname, "public/Client/app.html")));
    }
});

// Playlist selection page
app.get('/playlists', (req, res) => {
    const accessToken = req.cookies.access_token;
    const userId = req.cookies.user_id;

    // Check if the token exists
    if (!accessToken || !userId) {
        // Homepage to login
        res.redirect("/");
    } else {
        // Homepage with app
        res.sendFile((path.join(__dirname, "public/Client/playlists.html")));
    }
});

// Use other endpoint from the public directory
app.use(express.static(__dirname + '/public'));

// Start server
const PORT = process.env.PORT || process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});