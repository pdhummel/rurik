class Validator {
    constructor() {}

    static validateColor(color) {
        if (color != "yellow" && color != "white" && color != "blue" && color != "red") {
            throw new Error("color must be yellow, white, blue, or red.")
        }
    }

    static validateTablePosition(tablePosition) {
        if (tablePosition != "N" && tablePosition != "E" && tablePosition != "S" && tablePosition != "W") {
            throw new Error("tablePosition must be N,E,S,W.")
        }
    }



} module.exports = Validator