var blessed = require('neo-blessed');
const appInterface = require("./interface")

class trackList extends blessed.list {
    constructor(options) {
        options.height = options.height + '-3';
        options.top = options.top + '+3';
        options.keys = true;
        options.interactive = true;
        options.hidden = true;
        options.tags = true;
        options.border = { type: 'line' };
        options.style = {
            focus: {
                border: {
                    fg: 'red',
                }
            },
            selected: {
                fg: 'black',
                bg: 'white',
                bold: true
            }
        }

        super(options);
        this.searchterms = ""

        this.searchbar = blessed.box({
            keys: true,
            interactive: true,
            parent: options.parent,
            width: '100%',
            height: '0%+3',
            hidden: true,
            tags: true,
            border: { type: 'line' },
            style: {
                focus: {
                    border: {
                        fg: 'red',
                    }
                },
            }
        });

        this.key('f', (ch, key) => {
            if (!this.searchbar.focused) {
                this.searchbar.focus();
            }
        });

        this.searchbar.on('keypress', (char, key) => {
            if (key.full == "enter") {
                this.focus();
            } else if (key.full == "backspace") {
                this.searchterms = this.searchterms.slice(0, -1);
                this.fillTracks();
                this.render();
            } else if (char) {
                this.searchterms += char;
                this.fillTracks();
                this.render();
            }
        });

        this.key('p', async function (ch, key) {
            const id = this.getSelectedId();
            appInterface.playSong(id);
        });

        // this.key('r', async function (ch, key) {
        //     const tags = this.getSelectedTags();
        //     const playlist = (await this.selectPlaylist(tags));
        //     const song_id = this.getSelectedId();

        //     try {
        //         const response = await axios({
        //             method: "DELETE",
        //             headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        //             data: { "items": [{ "uri": "spotify:track:" + song_id }] },
        //             url: `https://api.spotify.com/v1/playlists/${playlist.id}/items`
        //         });

        //         logger.log(`Attepted to remove the tags finsihed with code ${response.status}`);
        //         if (response.statusText = "OK") {
        //             this.removeTagFromCurrent(playlist);
        //         }
        //     } catch (err) {
        //         logger.log(err);
        //     }

        // });

        // Add a playlists (tag) to a song 
        this.key('a', async function(ch, key) {
            const allTracks = appInterface.getIncludedPlaylists();
            const alreadyPresent = this.getSelected().tags.map(el => el.id);
            const filteredPlaylists = allTracks.filter(el => !(alreadyPresent.includes(el.id)));
            const choise = await this.selectPlaylist(filteredPlaylists);

            const currentTrack = this.getSelected();

            if (choise) {
                await appInterface.addTrackToPlaylist(currentTrack.id, choise);
                this.addTagToCurrent(choise);
            } else {
                const name = await this.createPlaylist();
                const newPlaylist = await appInterface.createNewPlaylist(name);
                await appInterface.addTrackToPlaylist(currentTrack.id, newPlaylist);
                this.addTagToCurrent(newPlaylist);
            }
        });
    }

    async selectPlaylist(playlists) {
        let popup = blessed.list({
            parent: this,
            keys: true,
            interactive: true,

            width: 'shrink',
            height: '50%',
            top: 'center',
            left: 'center',
            label: 'Select playlist to add',

            border: { type: 'line' },

            style: {
                focus: {
                    border: {
                        fg: 'red',
                    }
                },
                selected: {
                    bg: 'blue',
                    fg: 'white',
                    bold: true
                }
            }
        });

        popup.setItems(['New playlist', ...playlists.map(el => el.name)]);
        popup.focus();

        return new Promise((resolve, reject) => {
            popup.key('enter', async (ch, key) => {
                this.remove(popup);
                if (popup.selected == 0) {
                    resolve(null);
                } else {
                    resolve(playlists[popup.selected - 1]);
                }
            });
        });
    }

    async createPlaylist() {
        let popup = blessed.box({
            parent: this,
            keys: true,
            interactive: true,

            width: '50%',
            height: '50%',
            top: 'center',
            left: 'center',
            label: 'Name your new playlist',
            border: { type: 'line' },

            style: {
                focus: {
                    border: {
                        fg: 'red',
                    }
                },
                selected: {
                    bg: 'blue',
                    fg: 'white',
                    bold: true
                }
            }
        });
        popup.focus();

        return new Promise((resolve, reject) => {
            popup.on('keypress', (char, key) => {
                if (key.full == "enter") {
                    this.remove(popup);
                    resolve(popup.content);
                } else if (key.full == "backspace") {
                    popup.content = popup.content.slice(0, -1);
                    this.parent.render();
                } else if (char) {
                    popup.content += char;
                    this.parent.render();
                }
            });
        });
    }

    // removeCurrent() {
    //     const currentID = this.getSelectedId();
    //     this.tracks = this.tracks.filter((el) => el.id != currentID);
    //     this.fillTracks();
    // }

    addTagToCurrent(playlist) {
        this.getSelected().tags.push(playlist);
        this.fillTracks();
    }

    // removeTagFromCurrent(playlist) {
    //     let selectedItem = this.getSelected();
    //     selectedItem.tags = selectedItem.tags.filter((el) => el.id != playlist.id);
    //     this.fillTracks();
    // }

    getSelected() {
        return this.filtered[this.selected];
    }

    getSelectedId() {
        return this.getSelected().id;
    }

    fillTracks() {
        this.filtered = this.tracks.filter((track) => track.name.toLowerCase().includes(this.searchterms));
        this.searchbar.content = `{white-bg}{black-fg}${this.filtered.length} results for:{/white-bg}{/black-fg} ${this.searchterms}`;
        super.setItems(this.filtered.map((el) => {
            return `${el.name} {blue-fg}${el.artist}{/blue-fg} {green-fg}| ${el.tags.map(e => { return e.name }).join(", ")}`;
        }));
        this.parent.render();
    }

    async show(playlists) {
        super.show();
        this.searchbar.show();
        this.focus();

        // Get the songs in all of the playlists
        this.tracks = await appInterface.getTracks(playlists);
        this.fillTracks();       
    }
}

module.exports = trackList