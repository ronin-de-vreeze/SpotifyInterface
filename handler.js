// HANDLE SHARED RESOURCES

const fs = require("fs").promises;

let playlists;

function setPlaylists(p) {
    playlists = p;
}

function getPlaylists() {
    return playlists;
}

function addPlaylist(newPlaylist) {
    playlists.push(newPlaylist);
    // Save locally
}

module.exports = { getPlaylists, setPlaylists }