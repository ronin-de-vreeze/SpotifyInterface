// Imports
var blessed = require('neo-blessed');
const interface = require("./interface");
const trackList = require('./trackList.js');
const playlistList = require('./playlistList.js');

// -------------------- SCREEN ---------------------

// Create a screen object.
var screen = blessed.screen({
    smartCSR: true,
    log: "./debug.log",
    title: "Rotulo TUI"
});
// Debug logger at the bottom of the screen
var logger = blessed.log({
    parent: screen,
    width: '100%',
    height: '20%',
    top: '80%',
    border: { type: 'line' }
});
interface.setLogger(logger);

// -------------------------- VIEWS ---------------------------

// Playlist selection view
var playlistView = new playlistList({
    parent: screen,
    width: '100%',
    height: '80%',
});

// Playlist selection view
var trackView = new trackList({
    parent: screen,
    width: '100%',
    height: '80%',
});

// ------------------------- APP LOOP ----------------------------

async function start() {
    await interface.login();
    logger.log("Moving to playlist screen");

    const includedPlaylists = await playlistView.show();
    logger.log("Moving to song screen");
    
    trackView.show(includedPlaylists);
}
// Quit on Escape
screen.key('escape', function (ch, key) {
    return process.exit(0);
});

// Start the app and render the screen
start();
screen.render();