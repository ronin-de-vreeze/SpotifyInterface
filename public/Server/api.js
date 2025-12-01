const express = require("express");
const router = express.Router();

const MAX_RETRIES = 3;
const includedPlaylists = ["4R2zBJmoxG4FZ1CggA16kg"];

router.get('/info', async (req, res) => {
    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${req.cookies.access_token}` }
        });

        if (!response.ok) { 
            throw new Error(`Spotify API Status error: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).send({
            "name": data.display_name,
            "id": data.id,
            "image": (data.images && data.images.length > 0) ? data.images[0].url : null
        });
    } catch (error) {
        console.error("Caught error while fetching user info:", error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/tracks', async (req, res) => {
    try {
        const tracks = await getTracksWithTags(req.cookies.access_token);
        res.json(tracks);
    } catch (error) {
        console.error("Failed to get tracks:", error);
        res.status(error.status || 500).json({ error: error.message });
    }
});

async function getTracksWithTags(token) {
    let [tracks, playlistsWithTracks] = await Promise.all([
        getSavedTracks(token),
        getPlaylistsWithTracks(token)
    ]);

    // Project playlists with tracks on the original tracks array
    playlistsWithTracks.forEach(playlist => {
        playlist.tracks.forEach(track => { 
            const foundTrack = tracks.find(trackObject => track.id === trackObject.id);
            if (foundTrack) {
                foundTrack.tags.push({
                    id: playlist.id,
                    name: playlist.name
                });
            }
        });
    });

    return tracks;
}

async function getPlaylistsWithTracks(token) {
    let playlists = await getPlaylists(token);
    let playlistsWithTracks = [];

    playlists.forEach(async (playlist) => {
        // Check if it is in the selected playlists
        if(includedPlaylists.includes(playlist.id)) {
            // Get all items in a playlist
            const tracksInPlaylist = await getTracksInPlaylist(token,`${playlist.tracks}?offset=0&limit=50`);
            
            playlistsWithTracks.push({
                id: playlist.id,
                name: playlist.name,
                tracks: tracksInPlaylist
            });
        }                
    });

    return playlistsWithTracks;
}

async function getTracksInPlaylist(token, url) {
    let tracks = [];

    while (url) {
        console.log(`Fetching: ${url}`);

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Spotify API Status error: ${response.status}`);
        }

        const data = await response.json();
        if (data.items) {
            tracks.push(...data.items.map(item => ({
                id: item.track.id,
                name: item.track.name
            })));
        }

        url = data.next;
    }

    return tracks;
}

async function getSavedTracks(token) {
    let tracks = [];
    let url = `https://api.spotify.com/v1/me/tracks?offset=0&limit=50`

    while (url) {
        console.log(`Fetching: ${url}`);

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Spotify API Status error: ${response.status}`);
        }

        const data = await response.json();
        if (data.items) {
            tracks.push(...data.items.map(item => ({
                id: item.track.id,
                name: item.track.name,
                artist: item.track.artists[0].name,
                image: item.track.album.images.length > 0 ? item.track.album.images[0].url : null,
                tags: []
            })));
        }
        url = data.next;
    }

    return tracks;
}

router.get('/playlists', async (req, res) => {
    try {
        const playlists = await getPlaylists(req.cookies.access_token);
        res.json(playlists);
    } catch (error) {
        console.error("Failed to get playlists:", error);
        res.status(error.status || 500).json({ error: error.message });
    }
});

async function getPlaylists(token) {
    let playlists = [];
    let url = `https://api.spotify.com/v1/me/playlists?offset=0&limit=50`

    while (url) {
        console.log(`Fetching: ${url}`);

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Spotify API Status error: ${response.status}`);
        }

        const data = await response.json();
        if (data.items) {
            playlists.push(...data.items.map(item => ({
                id: item.id,
                name: item.name,
                ownerid: item.owner ? item.owner.id : 'unknown',
                ownername: item.owner ? item.owner.display_name : 'Unknown User',
                tracks: item.tracks.href,
                size: item.tracks.total,
                image: (item.images && item.images.length > 0) ? item.images[0].url : null
            })));
        }
        url = data.next;
    }

    return playlists;
}

router.post('/:trackid/add/:playlistid', async (req, res) => {
    try {
        const data = {
            "uris": [
                `spotify:track:${req.params.trackid}`
            ]
        }
        const response = await fetch(`https://api.spotify.com/v1/playlists/${req.params.playlistid}/tracks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.access_token}` 
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Spotify API Status error: ${response.status}`);
        }

        res.sendStatus(response.status);
    } catch (error) {
        console.error("Failed to add playlist to track:", error);
        res.status(500).json({ error: error });
    }
});

router.post('/:trackid/remove/:playlistid', async (req, res) => {
    try {
        const data = {
            "tracks": [
                {
                    "uri": `spotify:track:${req.params.trackid}`
                }
            ]
        }
        const response = await fetch(`https://api.spotify.com/v1/playlists/${req.params.playlistid}/tracks`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.access_token}` 
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Spotify API Status error: ${response.status}`);
        }

        res.sendStatus(response.status);
    } catch (error) {
        console.error("Failed to remove playlist from track:", error);
        res.status(500).json({ error: error });
    }
});

router.post('/:trackid/create/:playlistname', async (req, res) => {
    console.log(req.cookies.user_id);
    // Create the playlist
    // Add it to the song given
    // If succcesfull send 200 and return the id of the playlist

    try {
        const data = {
            "name": req.params.playlistname,
            "public": false
        }

        const response = await fetch(`https://api.spotify.com/v1/users/${req.cookies.user_id}/playlists`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.access_token}` 
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Spotify API Status error: ${response.status}`);
        }

        res.status(response.status).json({message: (await response.json()).snapshot_id});
    } catch (error) {
        console.error("Failed to create playlist:", error);
        res.status(500).json({ error: error });
    }
});

module.exports = router;