const searchInput = document.getElementById('search');


// Function to filter tracks
function searchTracks() {
    // Grab all the tracks
    const tracks = document.querySelectorAll('.track');
    const query = searchInput.value.toLowerCase().trim();
    // const parsedQuery = query ? query.split(/\s+/) : [];
    const filteredSongs = [];

    tracks.forEach(track => {
        if(matches(track.getAttribute("query"), query)) {
            filteredSongs.push(track);
            track.classList.add("show");
        } else {
            track.classList.remove("show");
        }
    });

    // console.log(parsedQuery);
    // console.log(tracks);
    console.log(filteredSongs);

    // const evaluated = evalInfix(tokenized);
    // console.log(evaluated);
}

function matches(trackString, queryString) {
  const tags = trackString.toLowerCase().split(/\s+/);

  // Handle parentheses by recursion (optional, skip if not needed)
  if (queryString.includes("(")) {
    const inner = queryString.match(/\(([^()]+)\)/);
    if (inner) {
      const innerResult = matches(trackString, inner[1]);
      return matches(trackString, queryString.replace(inner[0], innerResult ? "true" : "false"));
    }
  }

  // Simplify query
  const query = queryString
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  // Split on OR first
  const orParts = query.split(/\s+or\s+/);

  return orParts.some(orPart => {
    // For each OR group, split on AND
    const andParts = orPart.split(/\s+and\s+/);

    // All AND conditions must pass
    return andParts.every(part => {
      part = part.trim();
      if (part.startsWith("not ")) {
        const tag = part.replace("not ", "").trim();
        return !tags.includes(tag);
      } else if (part === "true") {
        return true;
      } else if (part === "false") {
        return false;
      } else {
        return tags.includes(part);
      }
    });
  });
}


function tokenize(q) {
  return q
    .toLowerCase()
    // surround parentheses with spaces so split will separate them
    .replace(/\(/g, ' ( ')
    .replace(/\)/g, ' ) ')
    // normalize multiple spaces
    .trim()
    .split(/\s+/)
    .map(t => {
    //   if (t === 'and' || t === 'or' || t === 'not' || t === '(' || t === ')') return {substring: t, meaning: "token"};
    //   return {substring: t, meaning: "tag"}; // a tag token (e.g. "120bpm", "house", "acid")
        if (t === 'and' || t === 'or' || t === 'not' || t === '(' || t === ')') return t;
      return t; // a tag token (e.g. "120bpm", "house", "acid")
    });
}

function eligible(trackQuery, query) {
    for (const queryElement of query) {
        // console.log(`Does ${trackQuery} include ${queryElement}`);
        if (trackQuery.includes(queryElement)) {
            // console.log("YESS");
            return true;
        }
    };

    return false;
}

// Add event listeners
searchInput.addEventListener('input', searchTracks);