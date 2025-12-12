var map = [];
const search = document.getElementById("searchbar")

function clearSearch() {
    search.value = "";
    evaluate()
}
search.addEventListener('input', (event) => {
    evaluate();
});

function evaluate() {
    map = []

    const currentValue = search.value;
    const separated = currentValue.split(" | ");

    separated.forEach(element => {
        map.push(analyseSubstring(element.trim()));
    });

    const items = document.querySelectorAll(".track-item");
    console.log(items);
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

async function playTracks() {
    let includedTracks = [];
    const items = document.querySelectorAll(".track-item");
    items.forEach(item => {
        if (!item.classList.contains("d-none")) {
            includedTracks.push(`spotify:track:${item.getAttribute("spotify-id")}`);
        }
    });

    try {
        const response = await fetch(`/api/play`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(includedTracks)
        });

        if (!response.ok) {
            throw new Error(`Spotify API Status error (playing tracks): ${response.status}`);
        } else {
            console.log("succesfully played tracks");
        }
    } catch (err) {
        console.log(err);
    }
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