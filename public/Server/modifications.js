const express = require("express");
const router = express.Router();

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
            throw new Error(`Spotify API Status error (creating): ${response.status}`);
        }

        const playlist_id = (await response.json()).id;

        const add_data = {
            "uris": [
                `spotify:track:${req.params.trackid}`
            ]
        }
        const add_response = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.access_token}` 
            },
            body: JSON.stringify(add_data)
        });

        if (!response.ok) {
            throw new Error(`Spotify API Status error (adding): ${add_response.status}`);
        }

        res.status(response.status).json({id: playlist_id});
    } catch (error) {
        console.error("Failed to create playlist:", error);
        res.status(500).json({ error: error });
    }
});

router.post('/play', async (req, res) => {
    try {
        const data = {
            "uris": req.body
        }

        const response = await fetch(`https://api.spotify.com/v1/me/player/play`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.cookies.access_token}` 
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Spotify API Status error (creating): ${response.status}`);
        }
        
        res.sendStatus(response.status);
    } catch (error) {
        console.error("Failed to create playlist:", error);
        res.status(500).json({ error: error });
    }
});

module.exports = router;