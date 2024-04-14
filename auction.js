class AuctionSpace {
    constructor(actionName, quantity, extraCoin=0) {
        this.actionName = actionName;
        this.quantity = quantity;
        this.extraCoin = extraCoin;
        this.color = null;
        this.advisor = 0;
        this.bidCoins = 0;
    }

    auctionBid(color, advisor, bidCoins) {
        this.color = color;
        this.advisor = advisor;
        this.bidCoins = bidCoins;
    }

    copyBid(auctionSpace) {
        this.color = auctionSpace.color;
        this.advisor = auctionSpace.advisor;
        this.bidCoins = auctionSpace.bidCoins;
    }
    
    clone() {
        var auctionSpace = new AuctionSpace(this.actionName, this.quantity, this.extraCoin);
        return auctionSpace;
    }
}


class AuctionBoard {
    constructor(numberOfPlayers) {
        this.numberOfPlayers = numberOfPlayers;
        this.board = {};
        this.reset();
        this.numberOfRows = this.board["muster"].length;
    }

    isPlayerAlreadyInColumn(actionName, color) {
        for (var i=0; i<this.numberOfRows; i++) {
            if (this.board[actionName][i].color == color) {
                return true;
            }
        }
        return false;        
    }

    isPlayerIn3Columns(color) {
        var count = 0;
        var columns = Object.keys(this.board);
        for (var k=0; k<columns.length; k++) {
            var actionName = columns[k];
            for (var i=0; i<this.numberOfRows; i++) {
                if (this.board[actionName][i].color == color) {
                    count = count + 1;
                    break;
                }
            }
        }
        if (count >= 3) {
            return true;
        }
        return false;
    }

    // row=0-3
    auctionBid(actionName, color, advisor, bidCoins) {
        if (this.isColumnFull(actionName)) {
            throw new Error("Cannot place advisor in " + actionName + " column, because it is full.");
        }
        // check for 2 advisors from the same player
        if (this.isPlayerAlreadyInColumn(actionName, color)) {
            if (! this.isPlayerIn3Columns(color)) {
                throw new Error("Cannot place advisor in " + actionName + " column, because you can only place a second advisor in the same column, if you are in three or more different columns.");
            }
        }

        var totalBid = advisor + bidCoins;
        for (var i=0; i < this.numberOfRows; i++) {
            var currentBid = this.board[actionName][i].advisor + this.board[actionName][i].bidCoins;
            if (totalBid > currentBid) {
                // "move" everything down
                for (var j=this.numberOfRows-1; j>i; j--) {
                    this.board[actionName][j].copyBid(this.board[actionName][j-1]);
                }
                this.board[actionName][i].auctionBid(color, advisor, bidCoins);
                break;
            }
        }
    }

    isColumnFull(actionName) {
        var isFull = false;
        var count = 0;
        for (var i=0; i<this.numberOfRows; i++) {
            if (this.board[actionName][i].advisor > 0) {
                count++;
            } else {
                break;
            }
        }
        if (count >= this.numberOfRows) {
            isFull = true;
        }
        return isFull;
    }

    reset() {
        this.board["muster"] = [];
        this.board["move"] = [];
        this.board["attack"] = [];
        this.board["tax"] = [];
        this.board["build"] = [];
        this.board["scheme"] = [];
        if (this.numberOfPlayers <= 2) {
            this.board["muster"].push(new AuctionSpace("muster", 3, 0));
            this.board["muster"].push(new AuctionSpace("muster", 2, 0));
            this.board["muster"].push(new AuctionSpace("muster", 1, 1));
            this.board["move"].push(new AuctionSpace("move", 3, 0));
            this.board["move"].push(new AuctionSpace("move", 2, 0));
            this.board["move"].push(new AuctionSpace("move", 1, 0));
            this.board["attack"].push(new AuctionSpace("attack", 2, 0));
            this.board["attack"].push(new AuctionSpace("attack", 1, 0));
            this.board["attack"].push(new AuctionSpace("attack", 1, 1));
            this.board["tax"].push(new AuctionSpace("tax", 2, 0));
            this.board["tax"].push(new AuctionSpace("tax", 1, 0));
            this.board["tax"].push(new AuctionSpace("tax", 1, 1));
            this.board["build"].push(new AuctionSpace("build", 2, 0));
            this.board["build"].push(new AuctionSpace("build", 1, 0));
            this.board["build"].push(new AuctionSpace("build", 1, 1));
            this.board["scheme"].push(new AuctionSpace("scheme", 3, 0));
            this.board["scheme"].push(new AuctionSpace("scheme", 2, 0));
            this.board["scheme"].push(new AuctionSpace("scheme", 1, 0));
        } else {
            this.board["muster"].push(new AuctionSpace("muster", 3, 0));
            this.board["muster"].push(new AuctionSpace("muster", 2, 0));
            this.board["muster"].push(new AuctionSpace("muster", 1, 0));
            this.board["muster"].push(new AuctionSpace("muster", 1, 1));
            this.board["move"].push(new AuctionSpace("move", 4, 0));
            this.board["move"].push(new AuctionSpace("move", 3, 0));
            this.board["move"].push(new AuctionSpace("move", 2, 0));
            this.board["move"].push(new AuctionSpace("move", 1, 0));
            this.board["attack"].push(new AuctionSpace("attack", 2, 0));
            this.board["attack"].push(new AuctionSpace("attack", 1, 0));
            this.board["attack"].push(new AuctionSpace("attack", 1, 1));
            this.board["attack"].push(new AuctionSpace("attack", 1, 2));
            this.board["tax"].push(new AuctionSpace("tax", 3, 0));
            this.board["tax"].push(new AuctionSpace("tax", 2, 0));
            this.board["tax"].push(new AuctionSpace("tax", 1, 0));
            this.board["tax"].push(new AuctionSpace("tax", 1, 1));
            this.board["build"].push(new AuctionSpace("build", 2, 0));
            this.board["build"].push(new AuctionSpace("build", 1, 0));
            this.board["build"].push(new AuctionSpace("build", 1, 1));
            this.board["build"].push(new AuctionSpace("build", 1, 2));
            this.board["scheme"].push(new AuctionSpace("scheme", 3, 0));
            this.board["scheme"].push(new AuctionSpace("scheme", 2, 0));
            this.board["scheme"].push(new AuctionSpace("scheme", 1, 0));
            this.board["scheme"].push(new AuctionSpace("scheme", 1, 1));
        }
    }
}

module.exports = AuctionBoard, AuctionSpace;

//ab = new AuctionBoard(2);
//console.log(ab);