const express = require("express");
const router = express.Router();

router.get('/name', async (req, res) => {
    const accessToken = req.cookies.access_token;
    const result = await spotifyRequest('/v1/me', accessToken, "GET");
    res.send(result.data.display_name);
});

router.get('/playlists', async (req, res) => {
    const accessToken = req.cookies.access_token;

    let playlists = {};
    let url = `/v1/me/playlists?limit=50&offset=0`;

    do {
        let result = await spotifyRequest(url, accessToken, "GET");
        if (result.status == 200) {
            result.data.items.forEach(playlist => {
                playlists[playlist.id] = playlist.name;
            });

            url = result.data.next;
        } else {
            return res.status(result.status).send(result);
        }
    } while (url != null);

    res.send(playlists);
});

async function getTracksInPlaylist(playlist_id, accessToken) {
    let tracks = []
    let url = `/v1/playlists/${playlist_id}/tracks?limit=50&offset=0`;

    do {
        let result = await spotifyRequest(url, accessToken, "GET");
        if (result.status == 200) {
            result.data.items.forEach(track => {
                tracks.push({ id: track.track.id, name: track.track.name });
            });

            url = result.data.next;
        } else {
            return null;
        }
    } while (url != null);

    return tracks;
}

router.post("/play", async (req, res) => {
    const accessToken = req.cookies.access_token;
    const trackIds = await req.body;

    try {
        for (const track_id of trackIds) {
            const url = `/v1/me/player/queue?uri=spotify:track:${track_id}`;
            const result = await spotifyRequest(url, accessToken, "POST");

            if (result.status !== 200) {
                return res.sendStatus(500);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
})

router.post('/tracks', async (req, res) => {
    const accessToken = req.cookies.access_token;
    let tracks = {}

    let parsedPlaylist = [] 
    if(req.cookies.playlists != null) {
        parsedPlaylist = JSON.parse(decodeURIComponent(req.cookies.playlists));
    }
    for (const [playlist_id, playlist_name] of Object.entries(parsedPlaylist)) {
        const tracksInPlaylist = await getTracksInPlaylist(playlist_id, accessToken);

        if (!tracksInPlaylist) {
            console.error(`Failed to fetch tracks for playlist ${playlist_id} (${playlist_name})`);
            continue;
        }

        for (const track of tracksInPlaylist) {
            if (tracks[track.id]) {
                tracks[track.id].playlists.push({
                    id: playlist_id,
                    name: playlist_name
                });
            } else {
                tracks[track.id] = {
                    name: track.name,
                    artists: track.artists,
                    // anything else you want from track
                    playlists: [{
                        id: playlist_id,
                        name: playlist_name
                    }]
                };
            }
        }
    };

    res.status(200).send(tracks);
});

async function spotifyRequest(endpoint, accessToken, method, headers = null, body = null) {
    const baseUrl = 'https://api.spotify.com';
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    }

    if (body && (method !== 'GET' && method !== 'HEAD')) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const status = response.status;

        // Try parsing JSON, but handle empty responses gracefully
        let data;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        // Handle known Spotify API error codes
        if (status === 400) console.error('Bad request — invalid parameters.');
        if (status === 401) console.error('Unauthorized — check or refresh your token.');
        if (status === 403) console.error('Forbidden — you lack permissions.');
        if (status === 404) console.error('Not found — invalid endpoint or resource.');
        if (status === 429) console.error('Rate limit exceeded — retry after delay.');
        if (status >= 500) console.error('Spotify server error — try again later.');

        return { data, status };
    } catch (error) {
        console.error('Network or unexpected error:', error);
        return { data: null, status: 0, error: error.message };
    }
}

router.post("/add/:playlist_id/to/:track_id", async (req, res) => {
    const accessToken = req.cookies.access_token;
    const playlist_id = req.params.playlist_id;
    const track_id = req.params.track_id;
    const body_json = {
        "uris": [
            "spotify:track:" + track_id
        ]
    };

    const response = await spotifyRequest(
        `/v1/playlists/${playlist_id}/tracks`, 
        accessToken, 
        "POST",
        {'Content-Type': 'application/json'},
        body_json
    );

    res.send(response.status);
});

router.post("/remove/:playlist_id/from/:track_id", async (req, res) => {
    const accessToken = req.cookies.access_token;
    const playlist_id = req.params.playlist_id;
    const track_id = req.params.track_id;
    const body_json = {
        // "uris": [
        //     "spotify:track:" + track_id
        // ]

        "tracks": [
            {
                "uri": "spotify:track:" + track_id
            }
        ]
    };

    const response = await spotifyRequest(
        `/v1/playlists/${playlist_id}/tracks`, 
        accessToken, 
        "DELETE",
        {'Content-Type': 'application/json'},
        body_json
    );

    res.send(response.status);
});

module.exports = router;