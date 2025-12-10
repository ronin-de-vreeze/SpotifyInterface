const tracksTable = document.getElementById("tracks-table")
const popup = document.getElementById("popup")
const popupItems = document.getElementById("popup-items")

load();

// Create a color based on the hash of a ID
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
}

function createBadge(name, button = null) {
    // Create badge
    const tagItem = document.createElement("span");
    tagItem.classList.add("badge", "d-inline-flex", "align-items-center", "p-2", "rounded-pill", "m-1");
    tagItem.style.backgroundColor = `hsl(${stringToColor(name)}, 100%, 85%)`;
    tagItem.style.color = `hsl(${stringToColor(name)}, 100%, 18%)`;
    const tagText = document.createElement("span");
    tagText.classList.add("px-1");
    tagItem.appendChild(tagText);

    // Set content
    tagText.innerHTML = name;

    // Create button if defined
    if (button) {
        // Add Seperator
        const seperator = document.createElement("span");
        seperator.classList.add("vr", "mx-2");
        tagItem.appendChild(seperator);

        // Add button
        const tagButton = document.createElement("span");
        tagButton.innerHTML = button.icon;

        tagButton.addEventListener("click", button.function);
        tagItem.appendChild(tagButton);
    }

    return tagItem;
}

function createTagOnTrack(name, tagId, trackId) {
    const item = createBadge(name,
        {
            icon: // Cross icon
                `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"/>
            </svg>`,

            function: // Remove this track
                async () => {
                    const response = await fetch(`/api/${trackId}/remove/${tagId}`, { method: 'POST' });

                    if (response.ok) {
                        item.remove();
                    }
                }
        }
    )

    return item;
}

// Add a track li to the table 
function addTrackToTable(track) {
    const trackitem = tracksTable.insertRow();
    trackitem.classList.add("track-item");
    trackitem.setAttribute("spotify-id", track.id);

    // Cell with the track name and artist name
    const nameCell = trackitem.insertCell();
    nameCell.innerHTML = track.name;
    const artistCell = trackitem.insertCell();
    artistCell.innerHTML = track.artist;

    // Cell containing all the tags
    const tagsCell = trackitem.insertCell();
    tagsCell.classList.add("track-tags");
    track.tags.forEach((tag) => {
        const item = createTagOnTrack(tag.name, tag.id, track.id);
        tagsCell.appendChild(item);
    });

    // const response = await fetch(`/api/${track.id}/create/${addName.value}`, { method: 'POST' })

    // if (response.ok) {
    //     const data = await response.json();
    //     createTag(tagsCell, addName.value, data.id, track.id);
    // }
}

// Executed on startup
async function load() {
    try {
        tracksTable.addEventListener('click', async (e) => {
            if (e.target.classList.contains("track-tags")) {
                const trackRow = e.target.closest('.track-item');
                const itemsCell = e.target;
                console.log("hit");
                itemsCell.appendChild(popup);
                popup.classList.remove("d-none");
                popup.setAttribute("currentID", trackRow.getAttribute("spotify-id"));
            }
        });

        // Set user image and name 
        fetch('/api/info', { method: 'GET' }).then(data => {
            data.json().then(data_json => {
                // document.getElementById("user-name").innerHTML = `Welcome ${data_json.name}`
                // document.getElementById("user-photo").src = data_json.image;
                document.cookie = `user_id=${data_json.id}`;
            });
        });

        // Fetch the tracks
        fetch('/api/tracks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                included: localStorage.getItem("playlists")
            })
        }).then(data => {
            // When the data is sucessfully returned
            data.json().then(data_json => {
                data_json.forEach(track => {
                    addTrackToTable(track);
                });
            });
        });

        fetch('/api/playlists', { method: 'GET' }).then(data => {
            data.json().then(data_json => {
                const includedSaved = JSON.parse(localStorage.getItem("playlists"));

                data_json.forEach(playlist => {
                    if (includedSaved.includes(playlist.id)) {
                        const currentBadge = createBadge(playlist.name,
                            {
                                icon: // Cross icon
                                    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                                    </svg>`,

                                function: // Remove this track
                                    async () => {

                                    }
                            }
                        );

                        currentBadge.classList.add("playlist-badge");
                        currentBadge.addEventListener("click", async () => {
                            const trackid = currentBadge.closest(".track-item").getAttribute("spotify-id");
                            console.log(`Add playlist with ID ${playlist.id} to song with id ${trackid}`)

                            const response = await fetch(`/api/${trackid}/add/${playlist.id}`, { method: 'POST' })

                            if (response.ok) {
                                console.log(response);
                                currentBadge.closest(".track-tags").appendChild(createTagOnTrack(playlist.name, playlist.id, trackid));
                                popup.classList.add("d-none");
                            }
                        });
                        popupItems.appendChild(currentBadge);
                    }
                });
            });
        });
    } catch (err) {
        // Return errors
        console.error(err);
    }
}