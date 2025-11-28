
// popup element
const popup = document.getElementById("popup");
const loadingPopup = document.getElementById("loadingPopup");
var selectedSongID = "";

async function loadTracks() {
    loadingPopup.classList.add("show");
    const tracksTable = document.getElementById("tracks-table");
    const response = await fetch("/tracks", { method: "POST" });

    if (response.ok) {
        const tracks = await response.json();
        tracksTable.innerHTML = "";

        // Foreach playlists, add to table
        for (let track_id in tracks) {
            const tracksRow = tracksTable.insertRow();
            tracksRow.classList.add("track");
            // tracksRow.setAttribute("spotify-id", playlist_id);
            tracksRow.setAttribute("spotify-id", track_id);

            const rowPlay = tracksRow.insertCell();
            rowPlay.innerHTML = "▶";
            rowPlay.addEventListener('click', async () => {
                const response = await fetch("/play", {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([track_id])
                });

                if (!response.ok) {
                    alert("A problem occured, make sure that your SPotify is playing to allow the request...");
                }
            });

            const rowArtist = tracksRow.insertCell();
            rowArtist.innerHTML = tracks[track_id].artist;

            const rowName = tracksRow.insertCell();
            rowName.innerHTML = tracks[track_id].name;

            const rowAdd = tracksRow.insertCell();
            rowAdd.innerHTML = "+";
            rowAdd.addEventListener('click', () => {
                popup.classList.add('show');
                selectedSongID = track_id;
            })

            const rowTags = tracksRow.insertCell();
            tracks[track_id].playlists.forEach(el => {
                const element = document.createElement("span");
                element.innerHTML = el.name;
                element.classList.add("tag");
                element.setAttribute("spotify-id", el.id);
                rowTags.appendChild(element);

                
                const removeBtn = document.createElement("span");
                removeBtn.innerHTML = " X";
                element.appendChild(removeBtn);
                removeBtn.addEventListener("click", async () => {
                    console.log(`Remove tag ${ el.name} from track ${tracks[track_id].name}`);

                    const response = await fetch(`/remove/${el.id}/from/${track_id}`, {
                        method: 'POST'
                    });

                    if (!response.ok) {
                        alert("A problem occured");
                        alert(response);
                    }

                    loadTracks();
                });

                // /remove/:playlist_id/from/:track_id
            });
        }
        
        loadingPopup.classList.remove("show");
    } else {
        console.log(response);
    }
}   

async function loadPlaylists() {
    loadingPopup.classList.add("show");
    const table = document.getElementById("playlist-table");

    // Fetch playlists
    const response = await fetch("/playlists");

    // If OK, load response
    if (response.ok) {
        const playlists = await response.json();

        // Parse cookies if possible
        let includedPlaylistsDict = []
        if (document.cookie != null && document.cookie != "") {
            includedPlaylistsDict = JSON.parse(decodeURIComponent(document.cookie.replace("playlists=", "")));
        }

        // Create table
        table.innerHTML = "";
        popup.innerHTML = "";

        const header = table.insertRow();
        const firstHeader = document.createElement('th');
        firstHeader.innerHTML = "Title";
        header.appendChild(firstHeader);
        const secondHeader = document.createElement('th');
        secondHeader.innerHTML = "Author";
        header.appendChild(secondHeader);
        const thirdHeader = document.createElement('th');
        thirdHeader.innerHTML = "Content";
        header.appendChild(thirdHeader);

        // Create styling for tags
        const styleElement = document.getElementById('playlists-styling');

        // Foreach playlists, add to table
        for (let playlist_id in playlists) {
            // Add to popup
            const popupPlaylist = document.createElement("span");
            popupPlaylist.classList.add("tag");
            popupPlaylist.setAttribute("spotify-id", playlist_id);
            popupPlaylist.innerHTML = playlists[playlist_id].name;
            popup.appendChild(popupPlaylist);
            popupPlaylist.addEventListener('click', async () => {
                console.log(`Add playlist ${playlists[playlist_id].name} with ID ${playlist_id} to track ${selectedSongID}`);
                popup.classList.remove("show");

                const response = await fetch(`/add/${playlist_id}/to/${selectedSongID}`, {
                    method: 'POST'
                });

                if (!response.ok) {
                    alert("A problem occured");
                    alert(response);
                }

                loadTracks();
            });

            const playlistRow = table.insertRow();
            playlistRow.classList.add("playlist");
            playlistRow.setAttribute("spotify-id", playlist_id);
            playlistRow.setAttribute("spotify-name", playlists[playlist_id].name);

            if (playlist_id in includedPlaylistsDict) {
                playlistRow.classList.add("selected");
            }

            const rowName = playlistRow.insertCell();
            rowName.innerHTML = playlists[playlist_id].name;

            const rowAuthor = playlistRow.insertCell();
            rowAuthor.innerHTML = `by ${playlists[playlist_id].owner}`;

            const rowSongs = playlistRow.insertCell();
            rowSongs.innerHTML = `${playlists[playlist_id].size} songs`;

            
            playlistRow.addEventListener('click', function () {
                playlistRow.classList.toggle("selected");
                const playlists = [...document.querySelectorAll('.playlist.selected')].map(input => input.closest('.playlist'));
                document.querySelector('#playlists h1').innerHTML = `Your Playlists (${playlists.length} selected)`;
                let selectedPlaylists = {};
                Array.from(playlists).map((el) => {
                    selectedPlaylists[el.getAttribute("spotify-id")] = el.getAttribute("spotify-name");
                });

                const jsonString = JSON.stringify(selectedPlaylists);
                document.cookie = `playlists=${encodeURIComponent(jsonString)}; path=/; max-age=3600; secure`;
                console.log(document.cookie);
            });

            styleElement.textContent += `
                .tag[spotify-id="${playlist_id}"] {
                    background-color: hsl(${generateHash(playlist_id) % 360}, 88%, 67%);
                }
            `;
        }
        
        loadingPopup.classList.remove("show");
    } else {
        console.log(response);
    }
}

const generateHash = (string) => {
    let hash = 0;
    for (const char of string) {
        hash = (hash << 5) - hash + char.charCodeAt(0);
        hash |= 0;
    }
    return hash;
};

// const playButton = document.getElementById("play");
// playButton.addEventListener("click", async () => {
//     const tracks = document.querySelectorAll('.track.show');
//     let selectedTracks = [];
//     Array.from(tracks).map((el) => { selectedTracks.push(el.getAttribute("spotify-id")) });

    // const response = await fetch("/play", {
    //     method: 'POST',
    //     headers: {
    //         'Accept': 'application/json',
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(selectedTracks)
    // });

    // if (!response.ok) {
    //     alert("A problem occured, make sure that your SPotify is playing to allow the request...");
    // }
// });

document.addEventListener("DOMContentLoaded", async function () {
    configureMenu();

    await loadPlaylists();
    loadTracks();
});

function configureMenu() {
    const items = Array.from(document.querySelectorAll('.menu-item'));

    items.forEach(element => {
        element.addEventListener('click', () => {
            // Set this tabs as selected
            items.forEach(otherItem => {
                if (otherItem === element) {
                    otherItem.classList.add("active");
                } else {
                    otherItem.classList.remove("active");
                }
            });

            // Open right content tab
            Array.from(document.querySelectorAll(`.content-tab`)).forEach(contentTab => {
                if (element.getAttribute("page-id") == contentTab.id) {
                    contentTab.classList.add("show");
                } else {
                    contentTab.classList.remove("show");
                }
            });
        });
    });
}