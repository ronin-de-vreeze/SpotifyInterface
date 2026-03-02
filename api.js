// HANDLE LOGINS
// HANDLE API CALLS
// STATIC

const fs = require("fs").promises;
const axios = require('axios');
let token;
let logger;

// Get the playlists included according to settings.json
async function loadSavedPlaylistPreferences() {
    try {
        const data = await fs.readFile('./settings.json', 'utf8');
        return JSON.parse(data).includedPlaylists || [];
    } catch (err) {
        return [];
    }
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
        logger.log(`${response.status} | ${options.url}`);

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

function setToken(t) {
    token = t;
}

function setLogger(l) {
    logger = l;
}

async function playSong(id) {
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
}

async function addTrackToPlaylist(trackId, playlist) {
    try {
        const response = await axios({
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            data: { "uris": ["spotify:track:" + trackId] },
            url: `https://api.spotify.com/v1/playlists/${playlist.id}/items`
        });


        logger.log(`Attempt to add ${playlist.name} to ${trackId} finished with status ${response.status}`);

        // if (response.statusText = "OK") {
        // trackView.addTagToCurrent(playlist);
        // }
    } catch (err) {
        logger.log(err);
    }
}

async function addTrackToNewPlaylist(tid, pname) {
    try {
        const response = await axios({
            method: "POST",
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            data: {
                "name": pname,
                "description": "New playlist description",
                "public": false
            },
            url: `https://api.spotify.com/v1/me/playlists/`
        });

        logger.log("created playlist with code " + response.status);

        // The the new tag to the current song
        const newPlaylist = {
            id: response.data.id,
            name: response.data.name,
            owner: response.data.owner.display_name,
            included: true
        };
        await addTrackToPlaylist(tid,
            newPlaylist);

        // Add the tag to the saved preferences
        // addPlaylistPreferences(response.data.id);
        return newPlaylist;
    } catch (err) {
        logger.log(err);
    }
}

module.exports = { loadSavedPlaylistPreferences, spotifyFetchPaginated, setToken, setLogger, getTracks, playSong, addTrackToNewPlaylist, addTrackToPlaylist }