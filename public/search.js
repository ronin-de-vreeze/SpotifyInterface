const includeInput = document.getElementById('include');
const excludeInput = document.getElementById('exclude');


// Function to filter tracks
function filterTracks() {
    // Grab all the tracks
    const tracks = document.querySelectorAll('.track');

    const includeValue = includeInput.value.toLowerCase().trim();
    const excludeValue = excludeInput.value.toLowerCase().trim();

    // Split include words by spaces, ignore empty strings
    const includeWords = includeValue ? includeValue.split(/\s+/) : [];

    tracks.forEach(track => {
        const title = track.getAttribute("query").toLowerCase();

        // Check include: if empty, include all; else check if at least one word matches
        const includeMatch = includeWords.length === 0 || includeWords.some(word => title.includes(word));

        // Check exclude: if empty, exclude nothing; else check if title contains the phrase
        const excludeMatch = excludeValue && title.includes(excludeValue);

        // Show track only if it matches include and does NOT match exclude
        if(includeMatch && !excludeMatch) {
            track.classList.add("show");
        } else {
            track.classList.remove("show");
        }
    });
}

// Add event listeners
includeInput.addEventListener('input', filterTracks);
excludeInput.addEventListener('input', filterTracks);