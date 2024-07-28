class GameLog {
    constructor(game) {
        this.game = game;
        this.entries = [];
    }

    log(text) {
        this.addEntry(text, this.game);
    }

    info(text) {
        this.addEntry(text, this.game);
    }

    addEntry(text, game=null) {
        var entry = new Entry(text, game);
        this.entries.push(entry);
    }

    getEntriesSinceLastTurn(player) {
        var ts = player.lastActionTimeStamp;
        return this.getEntriesAfterTimestamp(ts);
    }

    getEntriesAfterTimestamp(ts) {
        var entries = [];
        for (var i=0; i<this.entries.length; i++) {
            var entry = this.entries[i];
            if (entry.timeStamp > ts) {
                entries.push(entry);
            }
        }
        return entries;
    }

    getEntriesAfterPosition(count=-1) {
        var entries = [];
        for (var i=0; i<this.entries.length; i++) {
            if (i > count) {
                var entry = this.entries[i];
                entries.push(entry);
            }
        }
        return entries;
    }

}

class Entry {
    constructor(text, game) {
        this.timeStamp = Date.now();
        this.text = text;
        if (game != undefined && game != null) {
            this.round = game.currentRound;
            var player = game.players.getCurrentPlayer();
            this.player = player.color;
            player.lastActionTimeStamp = this.timeStamp;
        }
    }
}

module.exports = GameLog