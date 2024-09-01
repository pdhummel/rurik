class AvailableLeaders {
    constructor() {
        this.allLeaders = {};
        this.availableLeaders = {};
        this.addLeader("Boris", "When you attack an opponent in Boris's region, reveal one less scheme card and steal one coin from that opponent.");
        this.addLeader("Sviatopolk", "Rebels in Sviatopolk's region count as your troops for purposes of rule. If you defeat a rebel in that region, replace it with one of your troops.");
        this.addLeader("Yaroslav", "", "In Yaroslav's region, you win ties for rule and your opponents lose the abilities of their structures.");
        this.addLeader("Mstislav", "In Mstislav's region, it only costs you one tax point to tax or one build point to build, regardless of who rules that region.");
        this.addLeader("Gleb", "", "Once per round, when you attack in Gleb's region with no casualty, gain two movement points to use with any of your troops located in his region (including Gleb).");
        this.addLeader("Theofana", "", "Once per round, when you tax in Theofana's region, you may move her to an adjacent region or gain one coin from the supply. If you use this ability, you cannot tax again this turn.");
        this.addLeader("Maria", "", "Once per round when you muster troops, you may place them in a single region adjacent to Maria's region that you do not occupy.");
        this.addLeader("Predslava", "", "Once per round, on your turn, you may move an opponent's troop to an adjacent region for free. The opponent gains one coin from the supply.");
        this.addLeader("Sviatoslav", "", "Before you spend any build points on your turn, you may move Sviatoslav to an adjacent region with a rebel or spend one coin to move Sviatoslav to any adjacent region.");
        this.addLeader("Agatha", "", "When you move Agatha, you may move up to two of your troops along with her for free.");
        this.addLeader("Sudislav", "", "You may spend attack points as muster points instead, to muster troops in Sudislav's region.");    }

    addLeader(name, description=null) {
        var leader = new Leader(name, description);
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
    constructor(name, description=null) {
        this.name = name;
        this.description = description;
    }
}


module.exports = AvailableLeaders;