class Rebels {
    constructor() {
        this.rewards = [];
        this.rewards.push("honey");
        this.rewards.push("honey");
        this.rewards.push("fish");
        this.rewards.push("stone");
        this.rewards.push("fur");
        this.rewards.push("2 coins");
        this.rewards.push("wood");
        this.rewards.push("coin");
        this.rewards.push("2 coins");
        this.rewards.push("coin");
        this.rewards.push("wood");
        this.rewards.push("stone");
        this.rewards.push("coin");
        this.rewards.push("coin");
        this.rewards.push("fish");
        this.rewards.push("wood");
        this.rewards.push("2 coins");
        this.rewards.push("stone");
        this.rewards.push("fish");
    }
    
    placeRandomRebel() {
        var i = Math.floor(Math.random() * this.rewards.length);
        var reward = this.rewards[i];
        this.rewards[i] = this.rewards[this.rewards.length-1];
        this.rewards.pop();
        return reward;
    }    

}

module.exports = Rebels
