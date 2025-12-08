load();

function updateincludedPlaylists() {
    const selectedElements = Array.from(document.querySelectorAll(".playlist-item.include"));
    const arrayIncluded = selectedElements.map((el) => { return el.getAttribute("spotify-id"); });
    localStorage.setItem("playlists", JSON.stringify(arrayIncluded));
}

function addPlaylistToTable(table, id, name, image, ownername, size, index, addByDefault) {
    const row = table.insertRow(index);
    row.classList.add("playlist-item");
    row.setAttribute("spotify-id", id);

    if(addByDefault) {
        row.classList.add("include");
        updateincludedPlaylists()
    }

    row.addEventListener("click", () => {
        row.classList.toggle("include");
        updateincludedPlaylists()
    })


    const cell0 = row.insertCell();
    const cellImg = document.createElement("img");
    cellImg.src = image;
    cell0.appendChild(cellImg);

    const cell1 = row.insertCell();
    cell1.innerHTML = name;

    const cell2 = row.insertCell();
    cell2.innerHTML = ownername;

    const cell3 = row.insertCell();
    cell3.innerHTML = `${size} songs`;

    return row;
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 100%, 50%)`;
}

function stringToColorLight(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 100%, 77%)`;
}

function addTag(tagCell, tagName, tagID, trackID) {
    // const tagItem = document.createElement("div");
    // tagItem.classList.add("tag");
    // tagItem.style.backgroundColor = stringToColor(tagID);
    // const tagText = document.createElement("span");
    // const tagButton = document.createElement("span");
    // tagText.innerHTML = tagName;

    // tagButton.innerHTML = "X";
    // tagButton.addEventListener("click", async () => {
    //     const response = await fetch(`/api/${trackID}/remove/${tagID}`, { method: 'POST' });

    //     if (response.ok) {
    //         tagItem.remove();
    //     }
    // });

    // tagItem.appendChild(tagText);
    // tagItem.appendChild(tagButton);
    // tagCell.appendChild(tagItem);

    const tagItem = document.createElement("span"); 
    tagItem.classList.add("badge", "align-items-center", "p-2", "text-dark", "rounded", "m-1");
    // tagItem.classList.add("tag");
    tagItem.style.backgroundColor = stringToColorLight(tagID);
    tagItem.style.border = `solid 2px ${stringToColor(tagID)}`;
    // tagItem.style.backgroundColor = stringToColor(tagID);
    const tagText = document.createElement("span");
    tagText.classList.add("px-1");
    const tagButton = document.createElement("span");
    tagButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-lg" viewBox="0 0 16 16">
        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
    </svg>
    `;
    tagText.innerHTML = tagName;

    tagButton.addEventListener("click", async () => {
        const response = await fetch(`/api/${trackID}/remove/${tagID}`, { method: 'POST' });

        if (response.ok) {
            tagItem.remove();
        }
    });

    tagItem.appendChild(tagText);
    tagItem.appendChild(tagButton);
    tagCell.appendChild(tagItem);
}

async function load() {
    try {

        fetch('/api/info', { method: 'GET' }).then(data => {
            data.json().then(data_json => {
                document.getElementById("user-name").innerHTML = `Welcome ${data_json.name}`
                document.getElementById("user-photo").src = data_json.image;
                document.cookie = `user_id=${data_json.id}`;
            });
        });


        // fetch('/api/playlists', { method: 'GET' }).then(data => {
        //     data.json().then(data_json => {
        //         const table = document.getElementById("playlists-table")
        //         const includedSaved = JSON.parse(localStorage.getItem("playlists"));

        //         data_json.forEach(playlist => {
        //             const row = addPlaylistToTable(table,
        //                 playlist.id,
        //                 playlist.name,
        //                 playlist.image,
        //                 playlist.ownername,
        //                 playlist.size,
        //                 -1,
        //                 false
        //             );

        //             if (includedSaved.includes(playlist.id)) {
        //                 row.classList.add("include");
        //             }
        //         });
        //     });
        // });

        fetch('/api/tracks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                included: localStorage.getItem("playlists")
            })
        }).then(data => {
            data.json().then(data_json => {
                const table = document.getElementById("tracks-table")

                data_json.forEach(track => {
                    const row = table.insertRow();
                    row.classList.add("track-item");
                    row.setAttribute("spotify-id", track.id);
                    let queryString = `name:${track.name} artist:${track.artist}`;

                    // const cellPlay = row.insertCell();
                    // cellPlay.innerHTML = ">";

                    // const cell0 = row.insertCell();
                    // const cellImg = document.createElement("img");
                    // cellImg.src = track.image;
                    // cell0.appendChild(cellImg);

                    const cell1 = row.insertCell();
                    cell1.innerHTML = track.name;

                    const cell2 = row.insertCell();
                    cell2.innerHTML = track.artist;

                    const cellAdd = row.insertCell();
                    cellAdd.innerHTML = "+";

                    const cell3 = row.insertCell();
                    track.tags.forEach((tag) => {
                        addTag(cell3, tag.name, tag.id, track.id);
                        queryString += ` tag:${tag.name}`;
                    });

                    row.setAttribute('query', queryString);

                    cellAdd.addEventListener('click', async () => {
                        const playlistName = prompt("Name");
                        const response = await fetch(`/api/${track.id}/create/${playlistName}`, { method: 'POST' })

                        if (response.ok) {
                            const data = await response.json();

                            addPlaylistToTable(document.getElementById('playlists-table'),
                                data.id,
                                playlistName,
                                "playlist.image",
                                "playlist.ownername",
                                "playlist.size",
                                0,
                                true
                            );

                            addTag(cell3, playlistName, data.id, track.id);
                        }
                    });
                });
            });
        });
    } catch (err) {
        console.error(err);
    }
}