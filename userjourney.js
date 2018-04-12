var fs = require("fs-extra");
var webshot = require("webshot");
var resemble = require("node-resemble-js");
var dbl = require('./sqlite_con_man');



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
    
    constructor(options){
        this.options = options?options:opts;
        this.project = '';
        this.isMobile = '';
        this.runTests = '';
        this.testImg = '';
        this.pivotImg = '';
        this.fileName = '';
        this.QueueName = '';
        this.filesExist;
        this.project_id;
        this.channelWrapper;
        this.timestamp;
        this.testLocations;
        this.dbi = new dbl("../app.db");
    }
    checkFilesP(resolve, reject) {
        let parentDir = this.getParentDir(fileName);
        var self = this;
        fs.readdir(parentDir, (err, files) => {
            if (!err) {
                console.log("listing files");
                files.forEach(file => {
                    if (file === self.extractFile(self.pivotImg)) {
                        self.filesExist["pivot"] = true;
                    }
                    if (file === self.extractFile(self.testImg)) {
                        self.filesExist["test"] = true;
                    }
                });
                var fileFound = self.filesExist.test ? self.testImg : self.pivotImg;
                console.log(self.filesExist, extractFile(fileFound),
                    "list file .done");
                var message = "Test Found "+ (self.filesExist.test?"Pivot Img":"Test Img");
                self.logToDataBase("insert into log_info(t_id,log_info,log_image) values("
                                + (project_id===undefined?0:project_id)+",\""
                                + message+"\",\""
                                +self.extractFile(fileFound)+"\")");
                resolve();
            } else {
                fs.emptyDir('./public/images/' + self.project + '/', err => {
                    if (err) {
                        console.log("files error", err);
                        reject(process.exit('0'));
                    }
                    var message = "Project created here";
                    logToDataBase("insert into log_info(t_id,log_info,log_image) values("
                                +self.project_id?self.project_id:0+",\""
                                + message+"\",\""
                                + 0 +"\")");
                    console.log("Creating Project here", err);
                    resolve();
                });
            }
        });
    }
    getScreensP (resolve, reject) {
        var self = this;
        self.fileName = (self.filesExist.pivot) ?
            './public/images/' + self.project + '/' + self.name + '_' + self.timestamp + '.png' 
            : './public/images/' + self.project + '/' + self.name + '.png';

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
                    var data_info = "Image Difference Registered:" + data.misMatchPercentage +"\%.";
                    if (data.misMatchPercentage > 5) {
                        var diff_img = './public/images/' + self.project + '/' + name + '_' + timestamp + '_diff.png';
                        console.log("name:" + name + ",datafailed:true", diff_img);
                        data.getDiffImage().pack().pipe(fs.createWriteStream(diff_img));
                        self.logToDataBase("insert into log_info (t_id,log_info,log_image) values ("+
                                            self.project_id+",\""+data_info+"\",\""+extractFile(diff_img)+"\")");
                    } else {
                        console.log("name:" + name + ",datafailed:false");
                        self.logToDataBase("insert into log_info (t_id,log_info,log_image) values ("+
                                        self.project_id+",\""+data_info+"\",\""+extractFile(self.testImg)+"\")");
                    }
                    self.logToDataBase("update test set t_val='" +data.misMatchPercentage + "' where id="+self.project_id+";");

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