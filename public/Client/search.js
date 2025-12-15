var map = [];
const search = document.getElementById("searchbar")
const savedFilters = document.getElementById("saved-filters")

loadFilters();

// On key input evaluate again
search.addEventListener('input', (event) => {
    evaluate();
});

function loadFilters() {
    // Clear current DOM
    savedFilters.innerHTML = "";

    // Load the filters from the localstorage
    if (localStorage.getItem("filters") === null) {
        console.log("No filters stored in localstorage yet");
        localStorage.setItem("filters", JSON.stringify([]));
    } else {
        // For each filter, add them to the DOM element
        const filters = JSON.parse(localStorage.getItem("filters"));
        filters.forEach(filter => {
            let item = document.createElement("a");
            item.classList.add("dropdown-item");
            item.textContent = filter.name;
            savedFilters.appendChild(item);

            // Add click events
            item.addEventListener("click", () => {
                search.value = filter.query;
                evaluate();
            });
        });
    }
}

function clearFilter() {
    if (localStorage.getItem("filters") === null) {
        console.log("No filters to clear");
    } else {
        const filterName = prompt("Type the name of the filter to clear");
        const filters = JSON.parse(localStorage.getItem("filters"));
        const newFilters = filters.filter(item => item.name !== filterName);
        localStorage.setItem("filters", JSON.stringify(newFilters));

        // Clear and reload filters
        loadFilters();
    }
}

function saveFilter() {
    const filterName = prompt("New filter");

    if (localStorage.getItem("filters") === null) {
        console.log("No filters stored in localstorage yet");
        localStorage.setItem("filters", JSON.stringify([
            { name: filterName, query: search.value }
        ]));
    } else {
        const filters = JSON.parse(localStorage.getItem("filters"));
        filters.push({ name: filterName, query: search.value });
        localStorage.setItem("filters", JSON.stringify(filters));
    }
    // Clear and reload filters
    loadFilters();
}

// Clear the searchox and update
function clearSearch() {
    search.value = "";
    evaluate()
}

function exportToPlaylist() {
    alert("Not implemented yet");
}

function addToQueue() {
    alert("Not implemented yet");
}

// function setFilter() {

// }

// Return all the tracks currently visible
function getIncludedTracks() {
    let includedTracks = [];
    const items = document.querySelectorAll(".track-item");

    // Loop over every DOM item and check if its visible
    items.forEach(item => {
        if (!item.classList.contains("d-none")) {
            // Add Spotify URI to list
            includedTracks.push(`spotify:track:${item.getAttribute("spotify-id")}`);
        }
    });

    if (includedTracks.length === 0) {
        throw new Error(`No tracks to play`);
    }

    return includedTracks;
}

// Play the currently included tracks
async function playTracks() {    
    try {
        // Call Spotify to set player context
        const response = await fetch(`/api/play`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(getIncludedTracks())
        });

        // Error
        if (!response.ok) {
            throw new Error(`Spotify API Status error (playing tracks): ${response.status}`);
        }
    } catch (err) {
        console.log(err);
    }
}





function evaluate() {
    map = []

    const currentValue = search.value;
    const separated = currentValue.split(" | ");

    separated.forEach(element => {
        map.push(analyseSubstring(element.trim()));
    });

    const items = document.querySelectorAll(".track-item");
    // console.log(items);
    items.forEach(item => {
        let queryForTrack = item.children[1].innerHTML;
        for (let i = 0; i < item.children[2].children.length; i++) {
            queryForTrack += ` ${item.children[2].children[i].children[0].innerHTML}`
        }

        if (evaluateTrack(queryForTrack)) {
            item.classList.remove("d-none");
        } else {
            item.classList.add("d-none");
        }
    });
}

function evaluateTrack(element) {
    let includedAcrossRows = false;

    map.forEach(row => {
        let includedAcrossLine = true;

        row.forEach(token => {
            if (element.trim().toLowerCase().includes(token.string.trim().toLowerCase())) {
                // tag is present
                if (token.operator == "exclude") {
                    // and it shouldnt be
                    includedAcrossLine = false;
                }
            } else {
                // tag is not present
                if (token.operator == "include") {
                    // and it should be
                    includedAcrossLine = false;
                }
            }
        });

        // The track applies if this line is evaluated to be true
        if (includedAcrossLine) {
            includedAcrossRows = true;
        }
    })

    // log the element when 
    return includedAcrossRows;
}

function analyseSubstring(str) {
    let substringMap = []
    const separated = str.split(" ");
    separated.forEach(element => {
        if (element[0] == "-") {
            substringMap.push({ operator: "exclude", string: element.substring(1) });
        } else {
            substringMap.push({ operator: "include", string: element });
        }
    });

    return substringMap;
}