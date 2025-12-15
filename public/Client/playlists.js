load();

// Elements
const playlistsListOwned = document.getElementById("playlists-list-owned");
const playlistsList = document.getElementById("playlists-list");
const includedSaved = JSON.parse(localStorage.getItem("playlists") || "[]");

// Executed on startup
async function load() {
    try {
        const infoRes = await fetch('/api/info');
        if (!infoRes.ok) throw new Error(`Info fetch error: ${infoRes.status} ${infoRes.statusText}`);
        const infoJson = await infoRes.json();
        const user_id = infoJson?.id || "";

        const res = await fetch('/api/playlists');
        if (!res.ok) throw new Error(`Playlists fetch error: ${res.status} ${res.statusText}`);
        const data_json = await res.json();
        if (!Array.isArray(data_json)) throw new Error('Invalid playlists response');
        data_json.forEach(playlist => createPlaylistBadge(playlist, user_id));
    } catch (err) {
        console.error('Failed to load playlists', err);
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

// Create badge
function createPlaylistBadge(playlist, user_id) {
    // Basic validation
    if (!playlist || !playlist.id) return;
    const id = playlist.id;
    const name = String(playlist.name || '');
    const ownername = String(playlist.ownername || '');
    const ownerid = playlist.ownerid || '';
    const size = playlist.size != null ? String(playlist.size) : '';

    // Ensure target lists exist
    if (!playlistsListOwned || !playlistsList) return;

    // Create badge
    const item = document.createElement("span");
    item.setAttribute("spotify-id", id);
    item.classList.add("playlist-tag-item", "badge", "d-inline-flex", "align-items-center", "p-2", "rounded-pill", "m-1");
    item.style.backgroundColor = `hsl(${stringToColor(name)}, 100%, 85%)`;
    item.style.color = `hsl(${stringToColor(name)}, 100%, 18%)`;

    // Name
    const tagText = document.createElement("span");
    tagText.classList.add("px-1");
    tagText.textContent = name;
    item.appendChild(tagText);

    // Add Seperator
    const seperator = document.createElement("span");
    seperator.classList.add("vr", "mx-2");
    item.appendChild(seperator);

    // Owner
    const tagOwner = document.createElement("span");
    tagOwner.classList.add("px-1");
    tagOwner.textContent = ownername;
    item.appendChild(tagOwner);

    // Add Seperator
    const seperator2 = document.createElement("span");
    seperator2.classList.add("vr", "mx-2");
    item.appendChild(seperator2);

    // Size
    const tagSize = document.createElement("span");
    tagSize.classList.add("px-1");
    tagSize.textContent = size;
    item.appendChild(tagSize);

    // Include or exclude once clicked
    item.addEventListener("click", () => {
        item.classList.toggle("include");
        updateIncludedPlaylists();
    });

    // Add it to the right list
    if (ownerid === user_id) {
        playlistsListOwned.appendChild(item);
    } else {
        playlistsList.appendChild(item);
    }

    // Add include class if in included playlists
    if (includedSaved.includes(id)) item.classList.add("include");
}

// Set the included playlists in localStorage again
function updateIncludedPlaylists() {
    const selectedElements = Array.from(document.querySelectorAll(".playlist-tag-item.include"));
    const arrayIncluded = selectedElements.map((el) => el.getAttribute("spotify-id"));
    localStorage.setItem("playlists", JSON.stringify(arrayIncluded));
}
