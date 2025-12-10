// const example = [
//     "house disco",
//     "house acid",
//     "house fast",
//     "house disco fast",
//     "rap house",
//     "rap disco"
// ]

var map = [];
const search = document.getElementById("searchbar")

search.addEventListener('input', (event) => {
    map = []

    const currentValue = event.target.value;
    const separated = currentValue.split(" | ");

    separated.forEach(element => {
        map.push(analyseSubstring(element.trim()));
    });

    // example.forEach(element => {
    //     evaluateTrack(element);
    // });

    const items = document.querySelectorAll(".track-item");
    console.log(items);
    items.forEach(item => {
        if (evaluateTrack(item.children[0].innerHTML)) {
            item.classList.remove("d-none");
        } else {
            item.classList.add("d-none");
        }
    });
});

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