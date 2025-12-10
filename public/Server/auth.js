const express = require("express");
const router = express.Router();
const querystring = require('node:querystring');

// Login logic
router.get('/login', (req, res) => {
    const authUrl = 'https://accounts.spotify.com/authorize?' + querystring.stringify({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: process.env.SPOTIFY_SCOPE,
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

            const responseID = await fetch('https://api.spotify.com/v1/me', {
                headers: {
                    'Authorization': 'Bearer ' + data.access_token
                }
            });
            const dataID = await responseID.json();
            res.cookie('user_id', dataID.id, { maxAge: data.expires_in * 1000 });
            
            return res.redirect(`/`);
        } catch (err) {
            // Json parse error
            return res.status(400).send("Problem parsing json: " + response + " " + err);
        }

    } else {
        // Return error
        return res.status(400).send('Token exchange failed: ' + response);
    }
});

// Log the user out and clear cookies
router.get('/logout', async (req, res) => {
    res.clearCookie('access_token');
    res.clearCookie('user_id');
    res.redirect('/');
});

module.exports = router;