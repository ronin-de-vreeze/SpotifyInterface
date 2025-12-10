load();

const playlistsListOwned = document.getElementById("playlists-list-owned");
const playlistsList = document.getElementById("playlists-list");

function getId() {
  const cookie = `; ${document.cookie}`;
  const parts = cookie.split(`; user_id=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// Executed on startup
async function load() {
    try {
        const id = getId();
        console.log(document.cookie);

        fetch('/api/playlists', { method: 'GET' }).then(data => {
            data.json().then(data_json => {
                const includedSaved = JSON.parse(localStorage.getItem("playlists"));

                data_json.forEach(playlist => {
                    const item = createBadge(playlist.name, playlist.id, playlist.size, playlist.ownername);
                    if (playlist.ownerid === id) {
                        playlistsListOwned.appendChild(item);
                    } else {
                        playlistsList.appendChild(item);
                    }

                    if (includedSaved.includes(playlist.id)) {
                        item.classList.add("include");
                    }
                });
            });
        });
    } catch (err) {
        // Return errors
        console.error(err);
    }
}

// Create a color based on the hash of a ID
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 360);
}

function createBadge(name, id, size, owner) {
    // Create badge
    const tagItem = document.createElement("span");
    tagItem.setAttribute("spotify-id", id);
    tagItem.classList.add("playlist-tag-item", "badge", "d-inline-flex", "align-items-center", "p-2", "rounded-pill", "m-1");
    tagItem.style.backgroundColor = `hsl(${stringToColor(name)}, 100%, 85%)`;
    tagItem.style.color = `hsl(${stringToColor(name)}, 100%, 18%)`;

    // Name
    const tagText = document.createElement("span");
    tagText.classList.add("px-1");
    tagText.innerHTML = name;
    tagItem.appendChild(tagText);

    // Add Seperator
    const seperator = document.createElement("span");
    seperator.classList.add("vr", "mx-2");
    tagItem.appendChild(seperator);

    // Owner
    const tagOwner = document.createElement("span");
    tagOwner.classList.add("px-1");
    tagOwner.innerHTML = owner;
    tagItem.appendChild(tagOwner);

    // Add Seperator
    const seperator2 = document.createElement("span");
    seperator2.classList.add("vr", "mx-2");
    tagItem.appendChild(seperator2);

    // Size
    const tagSize = document.createElement("span");
    tagSize.classList.add("px-1");
    tagSize.innerHTML = size;
    tagItem.appendChild(tagSize);

    tagItem.addEventListener("click", () => {
        tagItem.classList.toggle("include");
        updateincludedPlaylists();
    });

    return tagItem;
}

function updateincludedPlaylists() {
    const selectedElements = Array.from(document.querySelectorAll(".playlist-tag-item.include"));
    const arrayIncluded = selectedElements.map((el) => { return el.getAttribute("spotify-id"); });
    localStorage.setItem("playlists", JSON.stringify(arrayIncluded));
}
