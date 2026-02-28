var blessed = require('neo-blessed');

class playlistList extends blessed.box {
    constructor(options, callback) {
        options.keys = true;
        options.interactive = true;
        options.hidden = true;
        options.tags = true;

        super(options);

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
                    bg: 'blue', // Or any color that stands out
                    fg: 'white',
                    bold: true
                }
            }
        });

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

        
        // Move to track screen
        this.excluded.key('enter', async (ch, key) => {
            callback(this.getIncludedPlaylists());
        });
        this.included.key('enter', async (ch, key) => {
            callback(this.getIncludedPlaylists());
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
    show() {
        this.excluded.show();
        this.included.show();
        this.excluded.focus();

        this.fillPlaylists();

        super.show();
    }

    // Store the playlists objects {name, id, owner, included}
    setItems(playlists) {
        this.playlists = playlists;
    }
}

module.exports = playlistList