// Start express and import authentication routes
const express = require("express");
const router = express.Router();

// Return use information, namely name, id and picture
router.get('/info', async (req, res) => {
    try {
        // Make API call
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: { 'Authorization': `Bearer ${req.cookies.access_token}` }
        });

        // If the repsonse is not a success
        if (!response.ok) { 
            throw new Error(`Spotify API Status error: ${response.status}`);
        }

        // Else extract the body and return data to page
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

// Get all the tracks the user saved, with their tags
router.post('/tracks', async (req, res) => {
    try {
        // Get the tracks with tags and return when no prolems encountered
        const tracks = await getTracksWithTags(req.cookies.access_token, JSON.parse(req.body.included));
        res.json(tracks);
    } catch (error) {
        console.error("Failed to get tracks:", error);
        res.status(error.status || 500).json({ error: error.message });
    }
});

// Return a list of tracks with their respective tags they include
async function getTracksWithTags(token, includedPlaylists) {
    // First get all the tracks and all the playlists with the tracks in them
    // Once successfull, move on
    let [tracks, playlistsWithTracks] = await Promise.all([
        getSavedTracks(token),
        getPlaylistsWithTracks(token, includedPlaylists)
    ]);

    // Project playlists with tracks on the original tracks array
    // For each playlists, and for each track in that playlist
    playlistsWithTracks.forEach(playlist => {
        playlist.tracks.forEach(track => { 
            // If it is in the liked tracks
            const foundTrack = tracks.find(trackObject => track.id === trackObject.id);
            if (foundTrack) {
                // Add the playlist as a tag to the found track
                foundTrack.tags.push({
                    id: playlist.id,
                    name: playlist.name
                });
            }
        });
    });

    return tracks;
}

// Get the playlists and the tracks in them
async function getPlaylistsWithTracks(token, includedPlaylists) {
    // Get all the playlists the user has saved
    let playlists = await getPlaylists(token);

    // Foreach playlists, get the tracks in the playlists in parallel
    // Create an array of objects holding id, name and an array of tracks
    const trackPromises = playlists
        .filter(playlist => includedPlaylists.includes(playlist.id))
        .map(async (playlist) => {
            const tracksInPlaylist = await getTracksInPlaylist(token, playlist.tracks); 
            return {
                id: playlist.id,
                name: playlist.name,
                tracks: tracksInPlaylist
            };
        });

    // Return all at once when finished
    return Promise.all(trackPromises);
}

// Fetch all the tracks in a playlist
async function getTracksInPlaylist(token, url) {
    let tracks = [];

    while (url) {
        // Fetch the API endpoint
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Throw error if the API returns an error
        if (!response.ok) {
            throw new Error(`Spotify API Status error: ${response.status}`);
        }

        // Otherwise, decode and loop over the items
        const data = await response.json();
        if (data.items) {
            // If the returned item is a track, add it to the list
            const validTracks = data.items.filter(item => item.track !== null);
            tracks.push(...validTracks.map(item => ({
                id: item.track.id,
                name: item.track.name
            })));
        }
    
        // Loop while there is more data to find
        url = data.next;
    }

    return tracks;
}

// Get all the tracks in the users liked songs
async function getSavedTracks(token) {
    let tracks = [];
    let url = `https://api.spotify.com/v1/me/tracks?offset=0&limit=50`

    // Loop while there are more songs to fetch
    while (url) {
        // API call
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Returned an error
        if (!response.ok) {
            throw new Error(`Spotify API Status error: ${response.status}`);
        }

        // Otherwise decode
        const data = await response.json();
        if (data.items) {
            // Add data to the list
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

// Return all the playlists saved by the user
router.get('/playlists', async (req, res) => {
    try {
        const playlists = await getPlaylists(req.cookies.access_token);
        res.json(playlists);
    } catch (error) {
        console.error("Failed to get playlists:", error);
        res.status(error.status || 500).json({ error: error.message });
    }
});

// Get all the playlists saved by the current user
async function getPlaylists(token) {
    let playlists = [];
    let url = `https://api.spotify.com/v1/me/playlists?offset=0&limit=50`

    // While there are more playlists to fetch
    while (url) {
        // API call
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // Error
        if (!response.ok) {
            throw new Error(`Spotify API Status error: ${response.status}`);
        }

        // Append data to list if the call was succesfull
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

        // Repeat
        url = data.next;
    }

    return playlists;
}

module.exports = router;