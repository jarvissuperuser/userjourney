var UjC = require("./userjourney");

var uj = new UjC(undefined,"./test.db");

uj.pivotImg = "./test1.png";
uj.testImg = "./test2.png";


var test = new Promise(uj.checkFilesP);
console.log(uj);