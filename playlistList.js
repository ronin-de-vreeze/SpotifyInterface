var blessed = require('neo-blessed');
const appInterface = require("./interface")

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
            let item = this.playlists.filter(el => el.included == true);
            if(item.length > 0) { item[this.included.selected].included = false; }
            this.fillPlaylists();
        });

        // Include playlist
        this.excluded.key('right', async (ch, key) => {
            let item = this.playlists.filter(el => el.included == false);
            if(item.length > 0) { item[this.excluded.selected].included = true; }
            this.fillPlaylists();
        });
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
        this.excluded.show();
        this.included.show();
        this.excluded.focus();
        super.show();

        this.playlists = await appInterface.fetchPlaylists();
        this.parent.log(this.playlists);

        this.fillPlaylists();

        return new Promise((resolve) => {
            // Move to track screen
            this.excluded.key('enter', async (ch, key) => {
                appInterface.savePlaylists(this.getIncludedPlaylists());
                resolve(this.getIncludedPlaylists());
                this.hide();
            });
            this.included.key('enter', async (ch, key) => {
                appInterface.savePlaylists(this.getIncludedPlaylists());
                resolve(this.getIncludedPlaylists());
                this.hide();
            });
        });
    }
}

module.exports = playlistList