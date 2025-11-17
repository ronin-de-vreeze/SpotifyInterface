async function loadTracks() {
    const tracksContent = document.getElementById("tracks-table-container");
    tracksContent.innerHTML = "Loading";

    const response = await fetch("/tracks", { method: "POST" });

    if (response.ok) {
        const tracks = await response.json();

        // Create table
        const tracksTable = document.createElement('table');
        tracksContent.innerHTML = "";
        tracksContent.appendChild(tracksTable);

        // Foreach playlists, add to table
        for (let track_id in tracks) {
            const tracksRow = tracksTable.insertRow();
            tracksRow.classList.add("track");
            // tracksRow.setAttribute("spotify-id", playlist_id);
            // tracksRow.setAttribute("spotify-name", playlists[playlist_id].name);

            const rowArtist = tracksRow.insertCell();
            rowArtist.innerHTML = tracks[track_id].artist;
            
            const rowName = tracksRow.insertCell();
            rowName.innerHTML = tracks[track_id].name;

            const rowTags = tracksRow.insertCell();
            tracks[track_id].playlists.forEach(el => {
                const element = document.createElement("span");
                element.innerHTML = el.name;
                element.classList.add("tag");
                element.setAttribute("spotify-id", el.id);
                rowTags.appendChild(element);
            });
        }
    } else {
        console.log(response);
    }
}

async function loadPlaylists() {
    const playlistsContent = document.getElementById("playlists-content");
    playlistsContent.innerHTML = "Loading";

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
        const playlistsTable = document.createElement('table');
        playlistsContent.innerHTML = "";
        playlistsContent.appendChild(playlistsTable);

        // Create styling for tags
        const styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        document.head.appendChild(styleElement);

        // Foreach playlists, add to table
        for (let playlist_id in playlists) {
            const playlistRow = playlistsTable.insertRow();
            playlistRow.classList.add("playlist");
            playlistRow.setAttribute("spotify-id", playlist_id);
            playlistRow.setAttribute("spotify-name", playlists[playlist_id].name);

            const rowIncluded = playlistRow.insertCell();
            const rowIncludedCheckbox = document.createElement("input");
            rowIncludedCheckbox.type = "checkbox";
            rowIncluded.appendChild(rowIncludedCheckbox);

            const rowName = playlistRow.insertCell();
            rowName.innerHTML = playlists[playlist_id].name;

            const rowInfo = playlistRow.insertCell();
            rowInfo.innerHTML = `${playlists[playlist_id].owner} | ${playlists[playlist_id].size} songs`;

            if (playlist_id in includedPlaylistsDict) {
                rowIncludedCheckbox.checked = true;
            }

            rowIncludedCheckbox.addEventListener('change', function() {
                console.log("TEST");

                const playlists = [...document.querySelectorAll('.playlist td input:checked')].map(input => input.closest('.playlist'));
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

//     const response = await fetch("/play", {
//         method: 'POST',
//         headers: {
//             'Accept': 'application/json',
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(selectedTracks)
//     });

//     if (!response.ok) {
//         alert("A problem occured, make sure that your SPotify is playing to allow the request...");
//     }
// });

function openView(event, tabName) {
    var i, tabcontent, tablinks;

    // Remove all content
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Set current content to active
    document.getElementById(tabName).style.display = "block";

    // Set all tabs to inactive
    tablinks = document.getElementsByClassName("tab-item");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    // Set current tab to active
    event.currentTarget.className += " active";
}

function openPlaylistsView(event) {
    openView(event, 'playlists-content');
    loadPlaylists();
}

function openTracksView(event) {
    openView(event, 'tracks-content');
    loadTracks();
}

window.addEventListener("load", (event) => {
    document.getElementById("default-open").click();
});