const path = require("path");
const fs = require("fs");

const DATABASE = "database.json";
const DEFAULT = "data.json";

module.exports = class DB {
    constructor() {
        this._path = path.join(__dirname, "../json/", DATABASE);
        this._default = path.join(__dirname, "../json/", DEFAULT);
        this._try = 0;
        try {
            this._data = require(this._path);
        } catch (err) {
            this._data = require(this._default).Setting.App;
            this.write(this._data);
        }
    }

    get = (key) => {
        return this._data[key] || null;
    }

    set = (key, val) => {
        if (!this._data[key]) return false;
        this._data[key] = val;

    }

    write = (data) => {
        if (this._try > 5) return;
        fs.writeFile(this._path, JSON.stringify(data), (err) => {
            if (err) {
                this._try++;
                return this.write({});
            }
        });
    }
}