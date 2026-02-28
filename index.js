var blessed = require('neo-blessed');
const http = require('http');
const axios = require('axios');
const url = require('url');
const fs = require("fs").promises;
const querystring = require('node:querystring');
const trackList = require('./trackList.js');
const playlistList = require('./playlistList.js');

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
    const savedToken = await getSavedToken();

    // Check validity
    if (await validateToken(savedToken)) {
        // Use the stored one
        token = savedToken;
        logger.log("Saved token was valid and is now used");
    } else {
        // Fetch a new one
        token = await getToken();
        saveToken();
        logger.log("Stored token invalid, fetched and stored new one succesfully");
    }

    // Fetch the users playlists to start the app
    await getPlaylists().then((playlists) => {
        // Open playlist view
        playlistView.setItems(playlists);
        playlistView.show();

        screen.render();
    });
}

// -------------------- PLAYLIST SELECTION ---------------------

// Playlist selection view
var playlistView = new playlistList({
    parent: screen,
    width: '100%',
    height: '80%',
}, fetchSongs);

// Get the playlists included according to settings.json
async function getPlaylistPreferences() {
    try {
        const data = await fs.readFile('./settings.json', 'utf8');
        return JSON.parse(data).includedPlaylists;
    } catch (err) {
        logger.log("Error reading setings.json:", err);
        return [];
    }
}

// Set the included playlists id's to the settings.json file
async function setPlaylistPreferences(playlists) {
    try {
        // Update info
        const data = await fs.readFile('./settings.json', 'utf8');
        const updated = JSON.parse(data);
        updated.includedPlaylists = playlists.map(el => { return el.id; }); // TODO move this to the playlistList class

        // Write to file
        await fs.writeFile('./settings.json', JSON.stringify(updated));
    } catch (err) {
        logger.log("Error writing to settings.json: ", err);
    }
}

// Fetch all the playlists from the Spotify API
async function getPlaylists() {
    // Get the preferences stored locally
    const includedPlaylists = await getPlaylistPreferences();

    return await spotifyFetchPaginated("me/playlists", (item) => {
        return {
            id: item.id,
            name: item.name,
            owner: item.owner.display_name,
            included: includedPlaylists.includes(item.id)
        }
    });
}

async function fetchSongs(playlists) {
    trackView.key('a', async function (ch, key) {
        const alreadyPresent = trackView.getSelectedTags().map(el => el.id);
        const filteredPlaylists = playlists.filter(el => !(alreadyPresent.includes(el.id)));
        const resultingPlaylist = await trackView.selectPlaylist(filteredPlaylists);
        const currentTrack = trackView.getSelected();

        if (resultingPlaylist) {

            try {
                const response = await axios({
                    method: "POST",
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    data: { "uris": ["spotify:track:" + currentTrack.id] },
                    url: `https://api.spotify.com/v1/playlists/${resultingPlaylist.id}/items`
                });

                if (response.statusText = "OK") {
                    trackView.addTagToCurrent(resultingPlaylist);
                }
                logger.log(`Attempt to add ${resultingPlaylist.name} to ${currentTrack.id} finished with status ${response.status}`);
            } catch (err) {
                logger.log(err);
            }
        } else {
            const name = await trackView.createPlaylist();

            try {
                const response = await axios({
                    method: "POST",
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    data: {
                        "name": name,
                        "description": "New playlist description",
                        "public": false
                    },
                    url: `https://api.spotify.com/v1/me/playlists/`
                });
                
                if (response.statusText = "OK") {
                    logger.log("created playlist with code " + response.status);
                }
                // logger.log(`Attempt to add ${resultingPlaylist.name} to ${currentTrack.id} finished with status ${response.status}`);
            } catch (err) {
                logger.log(err);
            }
        }
    });

    trackView.key('r', async function (ch, key) {
        const tags = trackView.getSelectedTags();
        const playlist = (await trackView.selectPlaylist(tags));
        const song_id = trackView.getSelectedId();

        try {
            const response = await axios({
                method: "DELETE",
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                data: { "items": [{ "uri": "spotify:track:" + song_id }] },
                url: `https://api.spotify.com/v1/playlists/${playlist.id}/items`
            });

            logger.log(`Attepted to remove the tags finsihed with code ${response.status}`);
            if (response.statusText = "OK") {
                trackView.removeTagFromCurrent(playlist);
            }
        } catch (err) {
            logger.log(err);
        }

    });

    // Store the playlist preferences locally
    setPlaylistPreferences(playlists);

    // Get the songs in all of the playlists
    const songs = await getTracks(playlists);
    trackView.setItems(songs);

    playlistView.hide();
    trackView.show();
    screen.render();
}

// ------------------------- TRACK VIEW -------------------------

// Playlist selection view
var trackView = new trackList({
    parent: screen,
    width: '100%',
    height: '80%',
});

trackView.key('p', async function (ch, key) {
    const id = trackView.getSelectedId();
    logger.log(trackView.selected);
    logger.log(trackView.getSelected());

    try {
        const response_queue = await axios({
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            url: 'https://api.spotify.com/v1/me/player/queue?uri=spotify%3Atrack%3A' + id,
        });
        const response_skip = await axios({
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            url: 'https://api.spotify.com/v1/me/player/next'
        });

        logger.log(`Add to queue (status ${response_queue.status}) and skip to next (status ${response_skip.status})`);
    } catch (e) {
        logger.log("Could not play the song" + e);
    }
});

// ------------------------- HELPERS ----------------------------

// Fetch and endpoint until it reaches the end, the endpoint needs to take offset and limit, and also contain the property 'items'
async function spotifyFetchPaginated(endpoint, selector) {
    let collection = [];

    // Initial fetch options
    let options = {
        method: "GET",
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        url: 'https://api.spotify.com/v1/' + endpoint + '?offset=0&limit=50',
    };

    // While the list is not exhausted yet do:
    do {
        // Fetch current page
        const response = await axios(options);
        logger.log(`fetch ${options.url} returned status code ${response.status}`);

        // If succesful, get the selected items and add to the list
        if (response.statusText == "OK") {
            // Next page url
            options.url = response.data.next;
            // Add all the items from the current fetch to the collection
            collection.push(...response.data.items.map(selector));
        }
    } while (options.url); // While there is a next url

    return collection;
}

async function getSongsInPlaylist(playlist) {
    return await spotifyFetchPaginated(`playlists/${playlist.id}/items`, (item) => {
        return {
            name: item.item.name,
            id: item.item.id,
            artist: item.item.artists[0].name,
            tags: [{ id: playlist.id, name: playlist.name }]
        }
    });
}

async function getTracks(playlists) {
    let sum = [];

    // Foreach playlist endpoint
    for (let i = 0; i < playlists.length; i++) {
        const tracks = await getSongsInPlaylist(playlists[i]);

        tracks.forEach((track) => {
            const existing = sum.find((el) => el.id == track.id);
            if (existing) {
                existing.tags.push({ id: playlists[i].id, name: playlists[i].name });
            } else {
                sum.push(track);
            }
        });
    };

    return sum;
}

// Quit on Escape
screen.key('escape', function (ch, key) {
    return process.exit(0);
});

// Start the app and render the screen
login();
screen.render();