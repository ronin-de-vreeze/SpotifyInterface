load();

function addPlaylistToTable(table, id, name, image, ownername, size, index) {
    const row = table.insertRow(index);
    row.classList.add("playlist-item");
    row.setAttribute("spotify-id", id);

    row.addEventListener("click", () => {
        row.classList.toggle("show");

        const selectedElements = Array.from(document.querySelectorAll(".playlist-item.show"));
        const arrayIncluded = selectedElements.map((el) => { return el.getAttribute("spotify-id"); });

        localStorage.setItem("playlists", JSON.stringify(arrayIncluded));
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

async function load() {
    try {

        fetch('/info', { method: 'GET' }).then(data => {
            data.json().then(data_json => {
                document.getElementById("user-name").innerHTML = `Welcome ${data_json.name}`
                document.getElementById("user-photo").src = data_json.image;
                document.cookie = `user_id=${data_json.id}`;
            });
        });


        fetch('/playlists', { method: 'GET' }).then(data => {
            data.json().then(data_json => {
                const table = document.getElementById("playlists-table")
                const includedSaved = JSON.parse(localStorage.getItem("playlists"));

                data_json.forEach(playlist => {
                    const row = addPlaylistToTable(table,
                        playlist.id,
                        playlist.name,
                        playlist.image,
                        playlist.ownername,
                        playlist.size,
                        -1
                    );

                    if (includedSaved.includes(playlist.id)) {
                        row.classList.add("show");
                    }
                });
            });
        });

        fetch('/tracks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Essential for sending a body
            },
            body: JSON.stringify({
                included: localStorage.getItem("playlists")
            })
        }).then(data => {
            data.json().then(data_json => {
                const table = document.getElementById("tracks-table")

                data_json.forEach(track => {
                    const row = table.insertRow();

                    const cellPlay = row.insertCell();
                    cellPlay.innerHTML = ">";

                    const cell0 = row.insertCell();
                    const cellImg = document.createElement("img");
                    cellImg.src = track.image;
                    cell0.appendChild(cellImg);

                    const cell1 = row.insertCell();
                    cell1.innerHTML = track.name;

                    const cell2 = row.insertCell();
                    cell2.innerHTML = track.artist;

                    const cellAdd = row.insertCell();
                    cellAdd.innerHTML = "+";

                    const cell3 = row.insertCell();
                    track.tags.forEach((tag) => {
                        const tagItem = document.createElement("div");
                        tagItem.classList.add("tag");
                        tagItem.style.backgroundColor = stringToColor(tag.id);
                        const tagText = document.createElement("span");
                        const tagButton = document.createElement("span");
                        tagText.innerHTML = tag.name;
                        tagButton.innerHTML = "X";
                        tagItem.appendChild(tagText);
                        tagItem.appendChild(tagButton);
                        cell3.appendChild(tagItem);
                    });

                    cellAdd.addEventListener('click', async () => {
                        const playlistName = prompt("Name");
                        const response = await fetch(`/${track.id}/create/${playlistName}`, { method: 'POST' })

                        if (response.ok) {
                            cell3.innerHTML += ", " + playlistName;

                            addPlaylistToTable(document.getElementById('playlists-table'),
                                (await response.json()).id,
                                playlistName,
                                "playlist.image",
                                "playlist.ownername",
                                "playlist.size",
                                0
                            );
                        }
                    });
                });
            });
        });
    } catch (err) {
        console.error(err);
    }
}