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

    const response = await fetch("/tracks", requestOptions);
    if (response.ok) {
        const tracks = await response.json();
        const list = document.getElementById("tracks");

        for (let track_id in tracks) {
            // Add name li
            let list_item = document.createElement("li");
            list_item.classList.add("track");
            list_item.addEventListener("click", () => {
                list_item.classList.toggle("included");
            });
            list.appendChild(list_item);
            list_item.innerHTML = tracks[track_id].name;
            list_item.setAttribute("spotify-id", track_id);

            // Add list for tags
            let tags_list = document.createElement("ul");
            list.appendChild(tags_list);

            let add_button = document.createElement("li");
            tags_list.appendChild(add_button);
            add_button.innerHTML = "+";
            add_button.addEventListener("click", async () => {
                console.log(`Open popup here for ${tracks[track_id].name}`)
                const playlistToAdd = "3JAXKCPcBQw1ORmUKbO4dC";

                const add_response = await fetch(`/add/${playlistToAdd}/to/` + track_id, {
                    method: "POST"
                });

                if (add_response.ok) {
                    addTagToSong(tags_list, playlistToAdd, "Placeholder", track_id, tracks[track_id].name);
                }
            });

            for (let index in tracks[track_id].playlists) {
                addTagToSong(tags_list,
                    tracks[track_id].playlists[index].id,
                    tracks[track_id].playlists[index].name,
                    track_id,
                    tracks[track_id].name);
            }
        }
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
    const response = await fetch("/playlists");
    if (response.ok) {
        const playlists = await response.json();
        const list = document.getElementById("playlists");

        let includedPlaylistsDict = []
        if(document.cookie != null && document.cookie != "") {
            includedPlaylistsDict = JSON.parse(decodeURIComponent(document.cookie.replace("playlists=", "")));
        }

        for (let playlist_id in playlists) {
            // Add name li
            let list_item = document.createElement("div");
            list_item.classList.add("playlist");
            list.appendChild(list_item);
            list_item.innerHTML = playlists[playlist_id];
            list_item.setAttribute("spotify-id", playlist_id);

            if(playlist_id in includedPlaylistsDict) { 
                list_item.classList.add("included");
            }

            list_item.addEventListener("click", () => {
                list_item.classList.toggle("included");

                const tracks = document.querySelectorAll('.playlist.included');
                let selectedPlaylists = {};
                Array.from(tracks).map((el) => { 
                    selectedPlaylists[el.getAttribute("spotify-id")] = el.innerHTML; 
                })

                console.log(selectedPlaylists);
                const jsonString = JSON.stringify(selectedPlaylists);

                document.cookie = `playlists=${encodeURIComponent(jsonString)}; path=/; max-age=3600; secure`;
                console.log(document.cookie);

                document.getElementById("refresh-popup").classList.add("show");
            });
        }
    } else {
        console.log(response);
    }
}

async function loadName() {
    const response = await fetch("/name");
    if (response.ok) {
        const name = await response.text();
        const element = document.getElementById("name");
        element.innerHTML = name;
    } else {
        console.log(response);
    }
}