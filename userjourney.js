var fs = require("fs-extra");
var webshot = require("webshot");
var resemble = require("node-resemble-js");
var moment = require("moment");
var dbl = require('./sqlite_con_man');

const desktopAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36';

var opts = {
    screenSize: {
        width: 1920,
        height: 1080
    },
    shotSize: {
        width: "all",
        height: "all"
    },
    userAgent: desktopAgent
}; 

class UserJourney{
    
    constructor(options,db){
        this.options = options?options:opts;
        this.project = '';
        this.isMobile = '';
        this.runTests = '';
        this.testImg = '';
        this.pivotImg = '';
        this.diff_img = '';
        this.fileName = '';
        this.QueueName = '';
        this.filesExist = [];
        this.project_id;
        this.timestamp;
        this.testLocations;
        this.name;
        this.dbi = new dbl(db?db:"../app.db");
    }
    setup(base_path,projects){
        var self = this;
        var imgBsPath = base_path?base_path:'./public/images/';
        self.timestamp = moment().format("MM-D-YY-h-mm-s");
        console.log("Loading Tests app at " + self.timestamp);
        self.name = (projects === undefined) ? self.project : projects[p];
        self.testImg = imgBsPath + project + '/' + self.name + '_' + self.timestamp + '.png';
        self.pivotImg = imgBsPath + project + '/' + self.name + '.png';
        self.fileName = (runTests === 'yes') ? self.self.testImg : self.pivotImg;
        self.filesExist = { test: false, pivot: false };
        self.QueueName = name + "_" + timestamp;
        self.dbi.multiquery(["insert into test(t_name) values('" + self.name + "')"]);
        self.dbi.e.on('done', () => {
            var d = self.dbi.datamulti[0];
            self.dbi.db.all("select id from test order by id desc limit 1", (err, rows) => {
                rows.forEach((row) => {
                    self.project_id = row.id;
                });
            });
        });
        
        self.fileName = (self.filesExist.pivot) ?
            imgBsPath + self.project + '/' + self.name + '_' + self.timestamp + '.png' 
            :imgBsPath + self.project + '/' + self.name + '.png';
        self.diff_img = imgBsPath + self.project + '/' + self.name + '_' + self.timestamp + '_diff.png';
    }
    genMessage(opt,mismatch){
        var msg; 
        var insert = "insert into log_info(t_id,log_info,log_image) values(";
        var update = "";
        var pID = (self.project_id===undefined?0:self.project_id); 
        var q= "";
        switch(opt){
            case "readdir":
                msg = "Test Found "+ (self.filesExist.test?"Test Img":"Pivot Img");
                q =insert,+ pID+",\""+ msg+"\",\""
                    +self.extractFile(fileFound)+"\")";
                break ;
            case "emptydir":
                msg = "Project created here"
                q =insert,+ pID+",\""+ msg+"\",\""
                    +self.extractFile(fileFound)+"\")";
                break ;
            case "mismatch":
                msg = "Image Difference :" + mismatch +"\%.";
                q=insert,+ pID+",\""+ msg+"\",\""
                    +self.extractFile(fileFound)+"\")";
                break ;
            case "update":
                msg = "";
                q=insert,+ pID+",\""+ msg+"\",\""
                    +self.extractFile(fileFound)+"\")";
                break ;
            default:
                break ;
        }
        this.logToDataBase(q);
    }
    checkFilesP(resolve, reject) {
        let parentDir = this.getParentDir(fileName);
        var self = this;
        fs.readdir(parentDir, (err, files) => {
            if (!err) {
                console.log("listing files");
                var s = self;
                files.forEach(file => {
                    if (file === self.extractFile(self.pivotImg))
                        self.filesExist["pivot"] = true;
                    if (file === self.extractFile(self.testImg)) 
                        self.filesExist["test"] = true;
                });
                var fileFound = self.filesExist.test ? self.testImg : self.pivotImg;
                console.log(self.filesExist, extractFile(fileFound),
                    "list file .done");
                // var message = "Test Found "+ (self.filesExist.test?"Test Img":"Pivot Img");
                // self.logToDataBase("insert into log_info(t_id,log_info,log_image) values("
                //                 + (self.project_id===undefined?0:self.project_id)+",\""
                //                 + message+"\",\""
                //                 +self.extractFile(fileFound)+"\")");
                self.genMessage("readdir");
                resolve();
            } else {
                fs.emptyDir('./public/images/' + self.project + '/', err => {
                    if (err) {
                        console.log("files error", err);
                        //reject(process.exit('0'));
                    }
                    /*var message = "Project created here";
                    logToDataBase("insert into log_info(t_id,log_info,log_image) values("
                                +self.project_id?self.project_id:0+",\""
                                + message+"\",\""  + 0 +"\")")*/;
                    self.genMessage("emptydir");
                    console.log("Creating Project here", err);
                    resolve();
                });
            }
        });
    }
    getScreensP (resolve, reject) {
        var self = this;

        try {
            console.log(self.fileName, "attempt for image");
            webshot(self.testLocations, self.fileName, self.options, function(err) {
                console.log("img error or rundiff");
                if (err) {
                    console.log(err);
                    reject(err);
                }
                console.log("Building test cases", self.QueueName);
                resolve();
            });
        } catch (ex) {
            console.log("exception getscreen", ex);
        }
    }
    arrayToPath (arr) {
        return arr.join('/');
    }
    getParentDir (path)  {
        try {
            var splitPath = path.split('/');
            splitPath.pop();
            return this.arrayToPath(splitPath);
        } catch (ex) {
            console.log(ex);
        }
    }
    extractFile (filePath) {
        var arr = filePath.split("/"); //unix/unix-like
        arr.reverse();
        return arr[0];
    }
    runDiff (name, timestamp) {
        var self = this;
        try {
            if (self.filesExist.pivot && self.filesExist.test)
                resemble(self.pivotImg)
                .compareTo(self.testImg).ignoreNothing().onComplete(function(data) {
                    if (data.misMatchPercentage > 5) {
                        console.log("name:" + name + ",datafailed:true", self.diff_img);
                        data.getDiffImage().pack().pipe(fs.createWriteStream(self.diff_img));
                        self.genMessage("mismatch",data.misMatchPercentage);
                    } else {
                        console.log("name:" + name + ",datafailed:false");
                        self.genMessage("mismatch",data.misMatchPercentage);
                    }
                    self.logToDataBase("update test set t_val='"                    
                        +data.misMatchPercentage + "' where id="+self.project_id+";");

                });
            else
                throw ("runDiff error");
        } catch (ex) {
            console.log(ex, "no file found");
        }
    }

    logToDataBase (qry) {
        try{
            if (this.project_id !== 0)
                dbi.db.all(qry, function(err, row) {
                    if (err){
                        console.log(err,qry,"logToDb Failed");
                    }
                    else
                        console.log(dbi.db.lastID,"log in to db");
                });
            else{
                            console.log('no project_id');
            }
        }catch(ex){
            console.log("logToDataBase failed",ex,qry);
        }
    }
}
module.exports = UserJourney;