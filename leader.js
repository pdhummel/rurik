class AvailableLeaders {
    constructor() {
        this.allLeaders = {};
        this.availableLeaders = {};
        this.addLeader("Gleb");
        this.addLeader("Sviatoslav");
        this.addLeader("Theofana");

    }

    addLeader(name) {
        var leader = new Leader(name);
        this.availableLeaders[name] = leader;
        this.allLeaders[name] = leader;
    }

    getLeaderByName(name) {
        return this.allLeaders[name];
    }

    chooseLeader(name) {
        if (name in this.availableLeaders) {
            delete this.availableLeaders[name];
            return this.allLeaders[name];
        }
    }

    isLeaderAvailable(name) {
        if (name in availableLeaders) {
            return true;
        } else {
            return false;
        }
    }
}


class Leader {
    constructor(name) {
        this.name = name;
    }
}


module.exports = AvailableLeaders;