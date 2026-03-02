var blessed = require('neo-blessed');
const { setPlaylists, spotifyFetchPaginated, loadSavedPlaylistPreferences } = require("./api");
const handler = require("./handler")
const fs = require("fs").promises;

class playlistList extends blessed.box {
    constructor(options) {
        // Create self
        options.keys = true;
        options.interactive = true;
        options.hidden = true;
        options.tags = true;
        super(options);

        // Create list with excluded songs
        this.excluded = blessed.list({
            keys: true,
            interactive: true,
            parent: this,

            width: '50%',
            height: '100%',
            hidden: true,
            label: "Excluded",

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

        // Create list for included songs
        this.included = blessed.list({
            keys: true,
            interactive: true,
            parent: this,

            width: '50%',
            left: '50%',
            height: '100%',
            hidden: true,
            label: "Included",

            border: { type: 'line' },
            style: {
                focus: {
                    border: {
                        fg: 'red',
                    }
                },
                selected: {
                    bg: 'blue', // Or any color that stands out
                    fg: 'white',
                    bold: true
                }
            }
        });

        // Switch between lists
        this.included.key('tab', async (ch, key) => {
            this.excluded.focus();
        });
        this.excluded.key('tab', async (ch, key) => {
            this.included.focus();
        });

        // Exclude playlist
        this.included.key('left', async (ch, key) => {
            this.playlists.filter(el => el.included == true)[this.included.selected].included = false;
            this.fillPlaylists();
        });

        // Include playlist
        this.excluded.key('right', async (ch, key) => {
            this.playlists.filter(el => el.included == false)[this.excluded.selected].included = true
            this.fillPlaylists();
        });
    }

    // Set the included playlists id's to the settings.json file
    async savePlaylistPreferences() {
        try {
            // Update info
            const data = await fs.readFile('./settings.json', 'utf8');
            const updated = JSON.parse(data);
            updated.includedPlaylists = this.getIncludedPlaylists().map(el => { return el.id; });

            // Write to file
            await fs.writeFile('./settings.json', JSON.stringify(updated));
        } catch (err) {
            this.parent.log("Error writing to settings.json: ", err);
        }
    }

    // Fetch all the playlists from the Spotify API, returns { id, name, owner, included }
    async fetchPlaylists() {
        // Get the preferences stored locally
        const includedPlaylists = await loadSavedPlaylistPreferences();

        const playlists = await spotifyFetchPaginated("me/playlists", (item) => {
            return {
                id: item.id,
                name: item.name,
                owner: item.owner.display_name,
                included: includedPlaylists.includes(item.id)
            }
        });

        return playlists;
    }

    getIncludedPlaylists() {
        return this.playlists.filter(el => el.included == true);
    }

    // Populate the lists
    fillPlaylists() {
        this.excluded.setItems(this.playlists.filter(el => el.included == false).map((el) => { return `${el.name} by ${el.owner}`; }));
        this.included.setItems(this.playlists.filter(el => el.included == true).map((el) => { return `${el.name} by ${el.owner}`; }));
        this.parent.render();
    }

    // Child children and fill the lists, then focus on the left list
    async show() {
        this.playlists = await this.fetchPlaylists();

        this.excluded.show();
        this.included.show();
        this.excluded.focus();

        this.fillPlaylists();
        super.show();

        return new Promise((resolve) => {
            // Move to track screen
            this.excluded.key('enter', async (ch, key) => {
                // callback(this.getIncludedPlaylists());
                this.savePlaylistPreferences();
                handler.setPlaylists(this.getIncludedPlaylists());
                resolve(this.getIncludedPlaylists());
            });
            this.included.key('enter', async (ch, key) => {
                // callback(this.getIncludedPlaylists());
                this.savePlaylistPreferences();
                handler.setPlaylists(this.getIncludedPlaylists());
                resolve(this.getIncludedPlaylists());
            });
        });
    }
}

module.exports = playlistList