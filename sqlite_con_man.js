var init = require("sqlite3").verbose();
var ev = require('events').EventEmitter;
var e = new ev();
var db = null;
var qry = "";
var datamulti = [];
var counter = 0;
var list = [];
// its going to be terminal app for now

var argv = "";

var manager = function(path_name) {
    db = new init.Database(path_name);
    this.db = db;
    this.fires = 0;
    this.fails = 0;
    this.e = e;
    e.on('res_done', this.listenercb);
    process
};

manager.prototype.data = {};
manager.prototype.datamulti = [];
manager.prototype.list = [];
manager.prototype.qry = "";
manager.prototype.listenercb = function(data) {
    datamulti.push(data.detail);
    if (list)
        if (datamulti.length === list.length) {
            manager.prototype.datamulti = datamulti;
            datamulti = [];
            e.emit('done');
        }
};
manager.prototype.listenercdn = null;
/**
 @param [] lst 
*/
manager.prototype.multiquery = function(lst) {
    var p = null;
    var selff = this;
    list = lst;
    lst.forEach((qy) => {
        qry = qy;
        this.transaction(qry)
    });
};

manager.prototype.transaction = function(qry) {
    db.all(qry, (err, row) => {
        e.emit("res_done", { detail: err ? err : row });
    });
};
module.exports = manager;