
const express = require('express');
const querystring = require('node:querystring');
const path = require('path');
const testData = require("./public/data/data.json");

const app = express()
app.use(require('cookie-parser')());
app.use(express.json());

var api = require('./api.js');

// Spotify app credentials TODO move to .env file
var client_id = '7354254814454ecbbef62bcc4d680591';
var redirect_uri = 'http://127.0.0.1:3000/callback';
var client_secret = '5beb5d19d27b49688a13a3bdbf65bdb3';
var scope = 'user-read-private user-read-playback-state playlist-read-private user-library-read user-modify-playback-state playlist-modify-public playlist-modify-private';

// Root endpoint 
app.get('/', (req, res) => {
   if (req.cookies.access_token) {
      // Logged in, redirect to the app
      res.redirect("/app");
   } else {
      // Not logged in, show the login page 
      res.sendFile(path.join(__dirname + "/public/pages/home.html"), null, function (err) {
         if (err) { console.error('Error sending file:', err); }
      });
   }
});

// Login page endpoint, redirect to Spotify Auth
app.get('/login', (req, res) => {
   res.redirect(
      'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
         response_type: 'code',
         client_id,
         scope,
         redirect_uri
      }));
});

// Callback nedpoint, get code from url and request token
app.get('/callback', async (req, res) => {
   const code = req.query.code;
   const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
         'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
         'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: querystring.stringify({
         code,
         redirect_uri,
         grant_type: 'authorization_code'
      })
   });

   const data = await response.json();
   if (data.error) {
      console.log("Error with token JSON");
      return res.status(400).send('Token exchange failed: ' + data.error_description);
   }

   // Save the access token in the cookies and redirect to app
   res.cookie('access_token', data.access_token, { httpOnly: true, sameSite: 'lax' });
   res.redirect(`/app`);
});

// App page, if accessed by not logged in, redirect to login
app.get("/app", (req, res) => {
   if (req.cookies.access_token) {
      // Logged in
      res.sendFile(path.join(__dirname + "/public/pages/app.html"), null, function (err) {
         if (err) { console.error('Error sending file:', err); }
      });
   } else {
      // Not logged in
      res.redirect("/login");
   }
});

// Logout by clearing stored token
app.get("/logout", (req, res) => {
   res.clearCookie('access_token');
   res.redirect("/");
});

// Return some info about the user, name etc...
app.get("/api/info", async (req, res) => {
   const fetchResponse = await api.spotifyFetch("GET", "me", req.cookies.access_token);

   if (fetchResponse.success) {
      res.json({
         success: true,
         data: {
            name: fetchResponse.data.display_name
         }
      });
   } else {
      res.json({
         success: false,
         data: "Error encountered and could not return correct data"
      });
   }
});

// Return all the playlists owned by the user
app.get("/api/playlists", async (req, res) => {
   const playlists = (await spotifyFetchPaginated("me/playlists", req.cookies.access_token)).map(e => {
      return {
         id: e.id,
         title: e.name,
         owner: e.owner.display_name
      }
   });

   res.json(playlists);
});

async function spotifyFetchPaginated(endpoint, access_token) {
   let url = 'https://api.spotify.com/v1/' + endpoint; // + '?offset=0&limit=50';
   let colletion = [];

   const headers = {
      method: "GET",
      headers: { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' },
   };

   do {
      const response = await fetch(url, headers);

      if (response.ok) {
         const data = await response.json();
         url = data.next;

         colletion.push(...data.items);
      }
   } while (url);

   return colletion;
}

app.post("/api/songs", async (req, res) => {
   urls = [...(req.body.map((id) => { return `playlists/${id}/items`; }))] // 'me/tracks',
   collection = {}

   for(let i = 0; i < urls.length; i++) {

      const results = await spotifyFetchPaginated(urls[i], req.cookies.access_token)

      results.forEach(result => {
         if (result.track.id in collection) {
            collection[result.track.id].tags.push(req.body[i]);
         } else {
            collection[result.track.id] = { 
               name: result.track.name,
               artist: result.track.artists[0].name,
               tags: [req.body[i]]
            }
         }
      });
   }
   console.log(collection);
   res.json(collection);
});

app.use(express.static(__dirname + '/public'));

app.listen(3000, () => console.log('Example app listening on port 3000!'))