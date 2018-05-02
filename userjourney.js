const fs = require("fs-extra");
const webshot = require("webshot");
const resemble = require("node-resemble-js");
const dbl = require('./sqlite_con_man');
const async = require("async");
const mmnt = require("moment");


const desktopAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36';

const opts = {
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
let selfer = null;
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
        this.filesExist = { test: false, pivot: false };
        this.project_id = 0;
        this.timestamp = mmnt().format("MM-D-YY-h-mm-s");
        this.testLocations = "http://timeslive.co.za";
        this.name = '';
        selfer = this;
        this.log = false;
        this.dbi = null;
    }
    setup(base_path,projects,p){
        console.log("ujsetup");
        let self = selfer;
        let imgBsPath = base_path?base_path:'./public/images/';
        self.project = p;
        self.name = (projects === undefined) ? self.project : projects[p];
    }
    async dbSetup(){
        console.log("uj DB setup");
        return new Promise((w,f)=> {
            let self = selfer;
            self.dbi = new dbl("../app.db");
            self.dbi.multiquery(["insert into test(t_name) values('" + self.name + "')"]);
            self.dbi.e.on('done', () => {
                let d = self.dbi.datamulti[0];
                self.dbi.db.all("select id from test order by id desc limit 1", (err, rows) => {
                    rows.forEach((row) => {
                        self.project_id = row.id;
                    });
                    w();
                });
            });
        });
    }
    filesInit(imgBsPath){
        console.log("files init");
        let self = selfer;
        console.log("timestamp",self.timestamp)
        self.testImg = self.testImg?self.testImg:imgBsPath + self.project + '/' + self.name + '_' + self.timestamp + '.png';
        self.pivotImg = self.pivotImg?self.pivotImg:imgBsPath + self.project + '/' + self.name + '.png';
        self.fileName = (self.filesExist.pivot) ? self.testImg : self.pivotImg;
        self.QueueName = self.name + "_" + self.timestamp;
        self.fileName = (self.filesExist.pivot) ?self.testImg
            :self.pivotImg;
        self.diff_img = imgBsPath + self.project + '/' + self.name + '_' + self.timestamp + '_diff.png';
    }
    genMessage(opt,mismatch){
        let msg;
        let self = selfer;
        let insert = "insert into log_info(t_id,log_info,log_image) values(";
        let update = "";
        let pID = (self.project_id===undefined?0:self.project_id);
        let q= "";
        let fileFound = self.filesExist.test ? self.testImg : self.pivotImg;
        switch(opt){
            case "readdir":
                msg = "Test Found "+ (self.filesExist.test?"Test Img":"Pivot Img");
                q =insert+ pID+",\""+ msg+"\",\""
                    +self.extractFile(fileFound)+"\")";
                break ;
            case "emptydir":
                msg = "Project created here"
                q =insert+ pID+",\""+ msg+"\",\""
                    +self.extractFile(fileFound)+"\")";
                break ;
            case "mismatchY":
                msg = "Image Difference :" + mismatch +"\%. "+this.extractFile(self.pivotImg);
                q=insert+ pID+",\""+ msg+"\",\""
                    +self.extractFile(self.diff_img)+"\")";
                break ;
            case "mismatchN":
                msg = "Image Difference :" + mismatch +"\%.";
                q=insert+ pID+",\""+ msg+"\",\""
                    +self.extractFile(fileFound)+"\")";
                break ;

            case "update":
                msg = "";
                q=update+ pID+",\""+ msg+"\",\""
                    +self.extractFile(fileFound)+"\")";
                break ;
            default:
                break ;
        }
        if (self.log)
            this.logToDataBase(q);
    }
    checkFilesP(resolve, reject) {
        console.log("files checker");
        let self = selfer;
        let parentDir = self.getParentDir(self.pivotImg);
        fs.readdir(parentDir, (err, files) => {
            if (!err) {
                console.log("listing files >>" ,self.pivotImg, self.testImg);
                let s = self;
                files.forEach(file => {
                    if (file === self.extractFile(self.pivotImg))
                        self.filesExist["pivot"] = true;
                    if (file === self.extractFile(self.testImg)) 
                        self.filesExist["test"] = true;
                    if (!self.log)
                        console.log(file);
                });
                let fileFound = self.filesExist.test ? self.testImg : self.pivotImg;
                console.log(self.filesExist, self.extractFile(fileFound),
                    "list file .done");
                self.genMessage("readdir");
                resolve();
            } else {
                fs.emptyDir(parentDir, err1 => {
                    if (err1) {
                        console.log("files error", err);
                        //reject(process.exit('0'));
                    }
                    self.genMessage("emptydir");
                    console.log("Creating Project here", err);
                    resolve();
                });
            }
        });
    }
    getScreensP (resolve, reject) {
        let self = selfer;

        try {
            console.log(self.fileName, "attempt for image");
            webshot(self.testLocations, self.fileName, self.options, function(err) {
                console.log("img error or rundiff");
                if (err) {
                    console.log(err.trace);
                    reject(err);
                }
                console.log("Building test cases", self.fileName);
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
            let splitPath = path.split('/');
            splitPath.pop();
            return this.arrayToPath(splitPath);
        } catch (ex) {
            console.log(ex);
        }
    }
    extractFile (filePath) {
        let arr = filePath.split("/"); //unix/unix-like
        arr.reverse();
        return arr[0];
    }
    runDiff (name, timestamp) {
        let self = this;
        try {
            if (self.filesExist.pivot && self.filesExist.test)
                resemble(self.pivotImg)
                .compareTo(self.testImg).ignoreNothing().onComplete(function(data) {
                    if (data.misMatchPercentage > 5) {
                        console.log("name:" + name + ",datafailed:true", self.diff_img);
                        data.getDiffImage().pack().pipe(fs.createWriteStream(self.diff_img));
                        self.genMessage("mismatchY",data.misMatchPercentage);
                    } else {
                        console.log("name:" + name + ",datafailed:false");
                        self.genMessage("mismatchN",data.misMatchPercentage);
                    }
                    self.logToDataBase("update test set t_val='"                    
                        +data.misMatchPercentage + "' where id="+self.project_id+";");
                });
            else
                throw ("runDiff error ");
        } catch (ex) {
            console.log(ex, "testfiles not found");
        }
    }

    logToDataBase (qry) {
        let self = selfer;
        try{
            if (this.project_id !== 0)
                selfer.dbi.db.all(qry, function(err, row) {
                    if (err){
                        console.log(err,qry,"logToDb Failed");
                    }
                    else
                        console.log(qry,"log in to db");
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