        load();

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

                        data_json.forEach(playlist => {
                            const row = table.insertRow();

                            const cell0 = row.insertCell();
                            const cellImg = document.createElement("img");
                            cellImg.src = playlist.image;
                            cell0.appendChild(cellImg);

                            const cell1 = row.insertCell();
                            cell1.innerHTML = playlist.name;

                            const cell2 = row.insertCell();
                            cell2.innerHTML = playlist.ownername;

                            const cell3 = row.insertCell();
                            cell3.innerHTML = `${playlist.size} songs`;
                        });
                    });
                });

                fetch('/tracks', { method: 'GET' }).then(data => {
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
                            cellAdd.addEventListener('click', () => {
                                fetch(`/${track.id}/create/KANKER`, { method: 'POST' })
                            });

                            const cell3 = row.insertCell();
                            cell3.innerHTML = track.tags.map((tag) => { return tag.name }).join(", ");
                        });
                    });
                });
            } catch (err) {
                console.error(err);
            }
        }