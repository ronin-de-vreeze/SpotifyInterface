module.exports = {
    getSongs: async function (access_token) {
        // Get all songs in the liked songs
        console.log("Fetching songs");
        let songs = (await this.spotifyFetchPaginated("me/tracks", access_token)).map(e => {
            return {
                id: e.track.id,
                title: e.track.name,
                artist: e.track.artists[0].name,
                tags: []
            }
        });
        
        // Get all playlists
        console.log("Fetching playlists");
        const playlists = (await this.spotifyFetchPaginated("me/playlists", access_token)).map(e => {
            return {
                id: e.id,
                title: e.name,
                owner: e.owner.display_name
            }
        });

        const filtered = playlists.filter(function(element) {
            if (element.owner != "Ronin") {
                return false; 
            }
            return true;
        })

        console.log("Gettings songs in playlsits");
        for(const playlist of filtered) {
            const response = await this.spotifyFetchPaginated("playlists/" + playlist.id + "/tracks", access_token)
            const songsInPlaylist = response.map(s => { 
                return {
                    id: s.track.id,
                    title: s.track.name 
                }
            });
            console.log(`${playlist.title}: retrieved ${songsInPlaylist.length} songs `);
        }

        console.log("Setting tags on the songs");
        

        return { songs: songs, playlists: filtered, combined: [] };
    },

    getPlaylists: async function (access_token) {
        return (await spotifyFetchPaginated("me/playlists", access_token)).map(e => {
            return {
                id: e.id,
                title: e.name,
                songs: []
            }
        });
    },
    
    spotifyFetchPaginated: async function (endpoint, access_token) {
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
    },

    spotifyFetch: async function (method, endpoint, access_token) {
        try {
            const headers = {
                method: method,
                headers: { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' },
            };

            const response = await fetch('https://api.spotify.com/v1/' + endpoint, headers);

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

}