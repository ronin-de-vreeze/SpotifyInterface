const express = require("express");
const router = express.Router();
const querystring = require('node:querystring');
// var client_id = '7354254814454ecbbef62bcc4d680591';
// var redirect_uri = 'http://localhost:3000/callback';
// var client_secret = '5beb5d19d27b49688a13a3bdbf65bdb3';
// var scope = 'user-read-private user-read-playback-state playlist-read-private user-library-read user-modify-playback-state playlist-modify-public playlist-modify-private';

// Login logic
router.get('/login', (req, res) => {
    const authUrl = 'https://accounts.spotify.com/authorize?' + querystring.stringify({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID, 
        scope: process.env.SCOPE,
        redirect_uri: process.env.SPOTIFY_REDIRECT
    });

    // Redirect to spotify auth
    res.redirect(authUrl);
});

// Callback after spotify auth
router.get('/callback', async (req, res) => {
    // Get access token with code provided
    const code = req.query.code;
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: querystring.stringify({
            code,
            redirect_uri: process.env.SPOTIFY_REDIRECT,
            grant_type: 'authorization_code'
        })
    });

    if (response.ok) {
        try {
            const data = await response.json();

            // Token exchange succes, set cookie for an hour, redirect to home to show app
            res.cookie('access_token', data.access_token, { httpOnly: true, sameSite: 'lax', maxAge: data.expires_in * 1000 });
            return res.redirect(`/`);
        } catch (err) {
            // Json parse error
            return res.status(400).send("Problem parsing json: " + response);
        }

    } else {
        // Return error
        return res.status(400).send('Token exchange failed: ' + response);
    }
});


router.get('/logout', async (req, res) => {
    res.clearCookie('access_token');
    res.redirect('/');
});

module.exports = router;