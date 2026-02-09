const express = require('express');
const app = express()
const querystring = require('node:querystring');
const path = require('path');
app.use(require('cookie-parser')());

app.use(express.json());

var client_id = '7354254814454ecbbef62bcc4d680591';
var redirect_uri = 'http://127.0.0.1:3000/callback';
var client_secret = '5beb5d19d27b49688a13a3bdbf65bdb3';
var scope = 'user-read-private user-read-playback-state playlist-read-private user-library-read user-modify-playback-state playlist-modify-public playlist-modify-private';

app.get('/', (req, res) => {
   if (req.cookies.access_token) {
      // Logged in
      res.redirect("/app");
   } else {
      // Not logged in
      res.sendFile(path.join(__dirname + "/public/pages/home.html"), null, function (err) {
         if (err) {
            console.error('Error sending file:', err);
         }
      });
   }
});

app.get("/api/data", async (req, res) => {
   const fetchResponse = await spotifyFetch("GET", "me", req.cookies.access_token);
   console.log(fetchResponse);

   if(fetchResponse.success) {
      res.json({ data: fetchResponse.data });
   } else {
      res.json({ data: "Error" });
   }
});

async function spotifyFetch(method, endpoint, access_token) {
   try {
      const headers = {
         method: method,
         headers: { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' },
      };
      console.log(headers);


      const response = await fetch('https://api.spotify.com/v1/' + url, headers);

      if (!response.ok) {
         return {
            success: false,
            data: 'Error with Spotify request: ' + response.status
         };
      }

      const data = await response.json();
      return {
         success: true,
         data: data
      };
   } catch (err) {
      return {
         success: false,
         data: 'network request error: ' + err
      };
   }
}

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


   const id_res = await fetch('https://api.spotify.com/v1/me', {
      method: 'GET',
      headers: {
         'Authorization': 'Bearer ' + data.access_token,
      }
   });

   const id_data = await id_res.json();
   if (id_data.error) {
      console.log("Error with token JSON");
      return res.status(400).send('Token exchange failed: ' + data.error_description);
   }

   res.cookie('access_token', data.access_token, { httpOnly: true, sameSite: 'lax' });
   res.cookie('user_id', id_data.id, { httpOnly: true, sameSite: 'lax' });

   // Redirect to your app UI with user_id param
   res.redirect(`/`);
});

app.get("/app", (req, res) => {
   if (req.cookies.access_token) {
      // Logged in
      res.sendFile(path.join(__dirname + "/public/pages/app.html"), null, function (err) {
         if (err) {
            console.error('Error sending file:', err);
         }
      });
   } else {
      // Not logged in
      res.redirect("/login");
   }
});

app.get("/logout", (req, res) => {
   res.clearCookie('access_token');
   res.clearCookie('user_id');
   res.redirect("/");
});

app.use(express.static(__dirname + '/public'));

app.listen(3000, () => console.log('Example app listening on port 3000!'))