var UjC = require("./userjourney");

var uj = new UjC(undefined,"./test.db");

uj.pivotImg = "./test1.png";
uj.testImg = "./test2.png";
uj.testLocations = process.argv.splice(2)[0]?process.argv.splice(2)[0]:"http://google.co.za";
uj.filesExist["pivot"] = true;
var test = new Promise(uj.checkFilesP);
uj.fileName = uj.testImg;
test.then(()=>{return new Promise(uj.getScreensP)})
.catch(function(e){
    console.log(e);
});
console.log(uj);