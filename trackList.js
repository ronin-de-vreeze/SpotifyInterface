var blessed = require('neo-blessed');
const axios = require('axios');

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
            content: "Test",

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



    removeCurrent() {
        const currentID = this.getSelectedId();
        this.tracks = this.tracks.filter((el) => el.id != currentID);
        this.fillTracks();
    }

    addTagToCurrent(playlist) {
        this.getSelected().tags.push(playlist);
        this.fillTracks();
    }


    removeTagFromCurrent(playlist) {
        let selectedItem = this.getSelected();
        selectedItem.tags = selectedItem.tags.filter((el) => el.id != playlist.id);
        this.fillTracks();
    }

    getSelectedTags() {
        return this.getSelected().tags;
    }

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

    show() {
        this.searchbar.show();
        this.focus();
        super.show();
    }

    setItems(tracks) {
        this.tracks = tracks;
        this.fillTracks();
    }
}

module.exports = trackList