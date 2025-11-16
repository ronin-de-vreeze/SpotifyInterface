async function loadTracks() {
    const requestOptions = {
        method: "POST"
        // headers: {
        //     "Content-Type": "application/json",  // <-- Add this header
        // },
        // body: JSON.stringify({
        //     "4R2zBJmoxG4FZ1CggA16kg": "Setlist",
        //     "3JAXKCPcBQw1ORmUKbO4dC": "testtt"
        // })
    };

    
    const tracksContent = document.getElementById("tracks-content");
    tracksContent.innerHTML = "Loading";

    const response = await fetch("/tracks", requestOptions);

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
            rowTags.innerHTML = "tracks[track_id].artist";
        }

    //     for (let track_id in tracks) {
    //         // Add name li
    //         let list_item = document.createElement("li");
    //         list_item.classList.add("track");


    //         list.appendChild(list_item);
    //         list_item.innerHTML = tracks[track_id].name;
    //         let queryString = tracks[track_id].name;
    //         list_item.setAttribute("spotify-id", track_id);

    //         // Add list for tags
    //         let tags_list = document.createElement("ul");
    //         list_item.appendChild(tags_list);

    //         let add_button = document.createElement("li");
    //         tags_list.appendChild(add_button);
    //         add_button.innerHTML = "+";
    //         add_button.addEventListener("click", async () => {
    //             console.log(`Open popup here for ${tracks[track_id].name}`)
    //             const playlistToAdd = "3JAXKCPcBQw1ORmUKbO4dC";

    //             const add_response = await fetch(`/add/${playlistToAdd}/to/` + track_id, {
    //                 method: "POST"
    //             });

    //             if (add_response.ok) {
    //                 addTagToSong(tags_list, playlistToAdd, "Placeholder", track_id, tracks[track_id].name);
    //             }
    //         });

    //         for (let index in tracks[track_id].playlists) {
    //             addTagToSong(tags_list,
    //                 tracks[track_id].playlists[index].id,
    //                 tracks[track_id].playlists[index].name,
    //                 track_id,
    //                 tracks[track_id].name);
    //         }

    //         list_item.setAttribute("query", queryString);
    //     }
    } else {
        console.log(response);
    }
}

function addTagToSong(tags_list, playlist_id, playlist_name, track_id, track_name) {
    let tag_item = document.createElement("li");
    tag_item.setAttribute("spotify-id", playlist_id);
    tags_list.appendChild(tag_item);

    let tag_item_name = document.createElement("span");
    tag_item_name.innerHTML = playlist_name;
    let tag_item_remove = document.createElement("span");
    tag_item_remove.innerHTML = "X";
    tag_item_remove.addEventListener("click", async () => {
        console.log(`Remove ${playlist_name}(${playlist_id}) from ${track_name}(${track_id})`);
        const remove_response = await fetch(`/remove/${playlist_id}/from/` + track_id, {
            method: "POST"
        });

        if (remove_response.ok) {
            tag_item.remove();
        }
    });

    tag_item.appendChild(tag_item_name);
    tag_item.appendChild(tag_item_remove);
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
        }
    } else {
        console.log(response);
    }
}

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

function openSearchView(event) {
    openView(event, 'search-content');
    // document.getElementById('search-content').style.display = "block";

    // // Set all tabs to inactive
    // tablinks = document.getElementsByClassName("tab-item");
    // for (i = 0; i < tablinks.length; i++) {
    //     tablinks[i].className = tablinks[i].className.replace(" active", "");
    // }
    // // Set current tab to active
    // event.currentTarget.className += " active";
}