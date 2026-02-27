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

// -------------------- TOKENS ---------------------

// Make an API call to verify the token
async function validateToken(token) {
    try {
        const response = await axios({
            method: "GET",
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            url: 'https://api.spotify.com/v1/me'
        });

        return response.status != 401;
    } catch (err) {
        return false;
    }
}

// Get the token saved in settings.json
async function getSavedToken() {
    try {
        const data = await fs.readFile('./settings.json', 'utf8');
        const parsed = JSON.parse(data);
        return parsed.token;
    } catch (err) {
        logger.log("Error reading file:", err);
        return "";
    }
}

// Save a valid token locally 
async function saveToken() {
    try {
        const data = await fs.readFile('./settings.json', 'utf8');
        const parsed = JSON.parse(data);
        parsed.token = token;
        await fs.writeFile('./settings.json', JSON.stringify(parsed));
    } catch (err) {
        logger.log("Error reading file:", err);
        return "";
    }
}

// -------------------- LOGIN SCREEN ---------------------

// Login view
const loginView = blessed.box({
    parent: screen,
    width: '100%',
    height: '80%',
    content: "Loggin in",
    border: { type: 'line' }
});

// Validate stored token and request new one if necessary
async function login() {
    const savedToken = await getSavedToken();

    // Fetch new token if needed
    if (await validateToken(savedToken)) {
        token = savedToken;
        logger.log("Saved token was valid and is now used");
    } else {
        token = await getToken();
        saveToken();
        logger.log("Stored token invalid, fetched and stored new one succesfully");
    }

    // Open playlist view and show playlists
    await getPlaylists().then((playlists) => {
        loginView.hide();
        playlistView.setItems(playlists);
        playlistView.show();
        screen.render();
    });
}

// Function to fetch a authorized token with the Spotify API
async function getToken() {
    return new Promise(async (resolve, reject) => {
        // // 1. Create a tiny temporary server
        const server = http.createServer(async (req, res) => {
            const queryObject = url.parse(req.url, true).query;

            if (queryObject.code) {
                // 2. We got the code! Now exchange it for an Access Token
                try {
                    const response = await axios.post('https://accounts.spotify.com/api/token',
                        new URLSearchParams({
                            grant_type: 'authorization_code',
                            code: queryObject.code,
                            redirect_uri: redirect_uri,
                            client_id: client_id,
                            client_secret: client_secret,
                        }).toString()
                    );

                    res.end("Login successful! You can close this tab and return to the terminal.");

                    // 3. Stop the server and return the token to the TUI
                    server.close();
                    resolve(response.data.access_token);
                } catch (err) {
                    res.end("Error exchanging code for token.");
                    reject(err);
                }
            }
        }).listen(3000);

        // 4. Construct the Auth URL
        const authUrl = 'https://accounts.spotify.com/authorize?' +
            querystring.stringify({
                response_type: 'code',
                client_id,
                scope,
                redirect_uri
            })

        // 5. Update TUI and Open Browser
        const open = (await import('open')).default;
        open(authUrl);
    });
}

// -------------------- PLAYLIST SELECTION ---------------------

// Playlist selection view
var playlistView = new playlistList({
    parent: screen,
    width: '100%',
    height: '80%',
    hidden: true,
}, fetchSongs);

// Get the playlists included according to settings.json
async function getPlaylistPreferences() {
    try {
        const data = await fs.readFile('./settings.json', 'utf8');
        const parsed = JSON.parse(data);
        return parsed.includedPlaylists;
    } catch (err) {
        logger.log("Error reading file:", err);
        return [];
    }
}

// Set the included playlists id's to the settings.json file
async function setPlaylistPreferences(playlists) {
    try {
        const data = await fs.readFile('./settings.json', 'utf8');
        const parsed = JSON.parse(data);
        parsed.includedPlaylists = playlists.map(el => { return el.id; });
        await fs.writeFile('./settings.json', JSON.stringify(parsed));
    } catch (err) {
        logger.log("Error reading file:", err);
        return "";
    }
}

// Fetch all the user owned playlists from the Spotify API
async function getPlaylists() {
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
        
        try {
            const response = await axios({
                method: "POST",
                headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                data: {"uris": [ "spotify:track:" + currentTrack.id ]},
                url: `https://api.spotify.com/v1/playlists/${resultingPlaylist.id}/items`
            });

            if(response.statusText = "OK") {
                trackView.addTagToCurrent(resultingPlaylist);
            }
            logger.log(`Attempt to add ${resultingPlaylist.name} to ${currentTrack.id} finished with status ${response.status}`);
        } catch (err) {
            logger.log(err);
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
                data: {"items": [{  "uri": "spotify:track:" + song_id }]},
                url: `https://api.spotify.com/v1/playlists/${playlist.id}/items`
            });

            logger.log(`Attepted to remove the tags finsihed with code ${response.status}`);
            if(response.statusText = "OK") {
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

async function spotifyFetchPaginated(endpoint, selector) {
    let sum = [];

    // Fetch options
    let options = {
        method: "GET",
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        url: 'https://api.spotify.com/v1/' + endpoint + '?offset=0&limit=50',
    };

    // While the list is not exhausted yet
    do {
        // Fetch current page
        const response = await axios(options);
        screen.log(`fetch ${options.url} returned status code ${response.status}`);

        // If succesful, get the selected items and add to the list
        if (response.statusText == "OK") {
            options.url = response.data.next; // Next page url
            sum.push(...response.data.items.map(selector));
        }
    } while (false);

    return sum;
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

// Focus our element.
loginView.focus();
login();

// Render the screen.
screen.render();