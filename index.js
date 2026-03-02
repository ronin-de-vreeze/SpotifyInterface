// Imports
var blessed = require('neo-blessed');
const http = require('http');
const axios = require('axios');
const url = require('url');
const fs = require("fs").promises;
const querystring = require('node:querystring');
const trackList = require('./trackList.js');
const playlistList = require('./playlistList.js');
const api = require("./api");

// Spotify API variables
let token = null;
var client_id = '7354254814454ecbbef62bcc4d680591';
var client_secret = '5beb5d19d27b49688a13a3bdbf65bdb3';
var redirect_uri = 'http://127.0.0.1:3000/callback';
var scope = 'user-read-private user-read-playback-state playlist-read-private user-library-read user-modify-playback-state playlist-modify-public playlist-modify-private';

// -------------------- SCREEN ---------------------

// Create a screen object.
var screen = blessed.screen({
    smartCSR: true,
    log: "./debug.log",
    title: "Rotulo TUI"
});

// Debug logger at the bottom of the screen
var logger = blessed.log({
    parent: screen,
    width: '100%',
    height: '20%',
    top: '80%',
    border: { type: 'line' }
});

api.setLogger(logger);

// -------------------- AUTHENTICATION ---------------------

// Make an API call to verify the token
async function validateToken(token) {
    try {
        // Simple request to test token
        await axios({
            method: "GET",
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            url: 'https://api.spotify.com/v1/me'
        });

        return true; // Status was withing 2xx so the token is valid
    } catch (err) {
        return false; // Status was something else than 2xx, so token is invalid
    }
}

// Get the token saved locally
async function getSavedToken() {
    try {
        // Read token
        const data = await fs.readFile('./settings.json', 'utf8');
        return JSON.parse(data).token;
    } catch (err) {
        logger.log("Error reading settings.json: ", err);
        return "";
    }
}

// Save a valid token locally 
async function saveToken() {
    try {
        // Read file and change the token
        const data = await fs.readFile('./settings.json', 'utf8');
        const updated = JSON.parse(data);
        updated.token = token;

        // Write
        await fs.writeFile('./settings.json', JSON.stringify(updated));
    } catch (err) {
        logger.log("Error updating settings.json:", err);
    }
}

// Function to fetch a authorized token with the Spotify API
async function getToken() {
    return new Promise(async (resolve, reject) => {
        // Local server for callback
        const server = http.createServer(async (req, res) => {
            // Read the token from the url if present
            const queryObject = url.parse(req.url, true).query;
            if (queryObject.code) {
                try {
                    // Request token with given code
                    const response = await axios.post('https://accounts.spotify.com/api/token',
                        new URLSearchParams({
                            grant_type: 'authorization_code',
                            code: queryObject.code,
                            redirect_uri: redirect_uri,
                            client_id: client_id,
                            client_secret: client_secret,
                        }).toString()
                    );

                    // Show message in browser window
                    res.end("Login successful! You can close this tab and return to the terminal.");

                    // Stop local server and return token
                    server.close();
                    resolve(response.data.access_token);
                } catch (err) {
                    res.end("Error exchanging code for token.");
                    reject(err);
                }
            }
        }).listen(3000);

        // Options for the login request
        const authUrl = 'https://accounts.spotify.com/authorize?' +
            querystring.stringify({
                response_type: 'code',
                client_id,
                scope,
                redirect_uri
            })

        // Open the Spotify login page in the browser
        const open = (await import('open')).default;
        open(authUrl);
    });
}

// Validate stored token or request new one
async function login() {
    const savedToked = await getSavedToken();

    // Check validity
    if (await validateToken(savedToked)) {
        // Use the stored one
        token = savedToked;
        api.setToken(token);
        logger.log("Saved token was valid and is now used");
    } else {
        // Fetch a new one
        token = await getToken();
        api.setToken(token);
        saveToken();
        logger.log("Stored token invalid, fetched and stored new one succesfully");
    }

    // Open playlist view and wait untill the page is finished
    const selectedPlaylists = await playlistView.show();
    playlistView.hide();
    trackView.show(selectedPlaylists); 
}

// -------------------- PLAYLIST SELECTION ---------------------

// Playlist selection view
var playlistView = new playlistList({
    parent: screen,
    width: '100%',
    height: '80%',
});

// ------------------------- TRACK VIEW -------------------------

// Playlist selection view
var trackView = new trackList({
    parent: screen,
    width: '100%',
    height: '80%',
});

// ------------------------- HELPERS ----------------------------

// Quit on Escape
screen.key('escape', function (ch, key) {
    return process.exit(0);
});

// Start the app and render the screen
login();
screen.render();