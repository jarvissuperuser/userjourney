/**
 * basic unit test
 * @author Timothy Mugadzab <MugadzaT@tisoblackstar.co.za>
*/

var UjC = require("./userjourney");
var moment = require("moment");


var uj = new UjC(undefined,"./test.db");

uj.timestamp = moment().format("MM-D-YY-h-mm-s");
uj.project = "test";
// uj.pivotImg = "./test.png";
// uj.testImg = "./test2.png";



uj.testLocations = process.argv.splice(2)[0]?process.argv.splice(2)[0]:"http://timeslive.co.za";
//uj.filesExist["pivot"] = true;
var test = new Promise(function(w,l){
    uj.setup();
    uj.timestamp = moment().format("MM-D-YY-h-mm-s");
    uj.checkFilesP(w,l);
});

test.then(()=>{
    //uj.filesInit();
    uj.setup();
    uj.filesExist['test'] = true;
    return new Promise(uj.getScreensP)})
.then(function(){
    uj.runDiff(uj.testImg);
})
.catch(function(e){
    console.log(e);
});
//console.log(uj);