const tracksTable = document.getElementById("tracks-table")

// Addd playlists popup elemnts 
const popup = document.getElementById("popup")
const popupItems = document.getElementById("popup-playlists")
const newName = document.getElementById("popup-new-playlist-name");

// To store what track was last selected to add the tag to
var selectedTrack = null;


const searchFilters = document.getElementById("popup-playlist-search");
searchFilters.addEventListener("input", () => {
    const filterText = searchFilters.value.toLowerCase();
    const playlistBadges = popupItems.querySelectorAll(".playlist-badge");

    // Show all of them
    playlistBadges.forEach(badge => {
        badge.classList.remove("d-none");
    });

    if (filterText.trim() !== "") {
        playlistBadges.forEach(badge => {
            const badgeText = badge.children[0].textContent.toLowerCase();
            
            if (badgeText.includes(filterText)) {
                badge.classList.remove("d-none");
            } else {
                badge.classList.add("d-none");
            }
        });
    }
});

load();

// Create a color based on the hash of a ID
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
}

async function createNewTag(event) {
    try {
        // Make request to create new playlist on Spotify
        const response = await fetch(`/api/${selectedTrack}/create/${newName.value}`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userid: localStorage.getItem("userid") || 0
            })
        })

        if (!response.ok) {
            throw new Error(`Spotify API: ${response.status} ${response.statusText}`);
        }

        // If sucessful, get the returned data
        const data = await response.json();

        // Add the tag to the song
        const newTag = createTagOnTrack(newName.value, data.id, selectedTrack);
        event.target.closest(".track-tags").appendChild(newTag);

        // Add the new tag to the local storage included list
        const current = JSON.parse(localStorage.getItem("playlists") || "[]");
        current.push(data.id);
        newString = JSON.stringify(current);
        localStorage.setItem("playlists", newString);

        // Close popup, clear input field and refresh the playlists in the popup
        popup.classList.add("d-none");
        newName.value = "";
        initializePlaylistsPopup();
    } catch (err) {
        console.log(`Error when creating new tag: ${err}`);
    }
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
    tagText.textContent = name;

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
    nameCell.textContent = track.name;
    const artistCell = trackitem.insertCell();
    artistCell.textContent = track.artist;

    // Cell containing all the tags
    const tagsCell = trackitem.insertCell();
    tagsCell.classList.add("track-tags");

    const addTagButton = document.createElement("button");
    addTagButton.classList.add("bg-transparent", "border-0", "text-secondary-emphasis", "me-2"); //  , "rounded-circle", "border-0", "d-inline-flex", "align-items-center", "justify-content-center"
    addTagButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                            </svg>`;
    tagsCell.appendChild(addTagButton);

    // Add tags to cell
    track.tags.forEach((tag) => {
        const item = createTagOnTrack(tag.name, tag.id, track.id);
        tagsCell.appendChild(item);
    });

    // Once the tracks tags cell is clicked, show the popup to add tag
    addTagButton.addEventListener('click', async (e) => {
        tagsCell.appendChild(popup);
        popup.classList.remove("d-none");

        selectedTrack = track.id;
    });
}

// Executed on startup
async function load() {
    try {
        // Fetch user info
        const infoRes = await fetch('/api/info');
        if (!infoRes.ok) throw new Error(`Info fetch error: ${infoRes.status} ${infoRes.statusText}`);
        const infoJson = await infoRes.json();
        localStorage.setItem("userid", infoJson.id);

        // Fetch the tracks
        fetch('/api/tracks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                included: localStorage.getItem("playlists") || []
            })
        }).then(data => {
            if (!data.ok) {
                throw new Error(`Error fetching tracks: ${data.status}: ${data}`);
            }

            // When the data is sucessfully returned
            data.json().then(data_json => {
                data_json.forEach(track => {
                    addTrackToTable(track);
                });
            });
        });

        // Add the selected and user owned playlists to the popup
        initializePlaylistsPopup();
    } catch (err) {
        // Return errors
        console.error(err);
    }
}

function initializePlaylistsPopup() {
    fetch('/api/playlists', { method: 'GET' }).then(response => {
        // Check response
        if (!response.ok) {
            throw new Error(`Error fetching playlists: ${response.status}: ${response}`);
        }

        const userid = localStorage.getItem("userid");

        // If playlists fetch sucessfully
        response.json().then(playlists => {
            popupItems.innerHTML = "";
            const includedSaved = JSON.parse(localStorage.getItem("playlists") || "[]");

            playlists.forEach(playlist => {
                // If the playlist is in the included list and owned by the user
                if (includedSaved.includes(playlist.id) && playlist.ownerid === userid) {
                    // Create badge
                    const playlistBadge = createBadge(playlist.name,
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

                    // And append to the popup
                    playlistBadge.classList.add("playlist-badge");
                    popupItems.appendChild(playlistBadge);

                    // Once the tag is clicked, inform Spotify to add the tag to the track
                    playlistBadge.addEventListener("click", async () => {
                        const response = await fetch(`/api/${selectedTrack}/add/${playlist.id}`, { method: 'POST' })

                        if (response.ok) {
                            // Find the track's tags cell and append a new tag to it
                            playlistBadge.closest(".track-tags").appendChild(createTagOnTrack(playlist.name, playlist.id, selectedTrack));
                            popup.classList.add("d-none");
                        } else {
                            alert("Error adding tag to track (Spotify API returned error");
                        }
                    });
                }
            });
        });
    });
}