var UjC = require("./userjourney");

var uj = new UjC(undefined,"./test.db");

uj.pivotImg = "./test.png";
uj.testImg = "./test2.png";

uj.testLocations = process.argv.splice(2)[0]?process.argv.splice(2)[0]:"http://timeslive.co.za";
//uj.filesExist["pivot"] = true;
var test = new Promise(uj.checkFilesP);

test.then(()=>{
    uj.filesInit();
    uj.diff_img = "diff.png";
    return new Promise(uj.getScreensP)})
.then(function(){
    uj.runDiff(uj.testImg);
})
.catch(function(e){
    console.log(e);
});
//console.log(uj);