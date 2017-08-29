var fs = require("fs");
var mkdirp = require('mkdirp');
var archiver = require('archiver');
var extract = require('extract-zip');
const replace = require('replace-in-file');
var walk = require('walk');
var colors = require('colors');

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

var menuHasBeenDownloaded = false;
module.exports.init = function(cardLoc,screenLoc,downloadLoc){
	cardFolderLocation = cardLoc;
	screenFolderLocation = screenLoc;
	downloadFolderLocation = downloadLoc;
	console.log("[" + "CARD MANAGER".blue + "] " + "Deleting old downloads....".grey);
	removeAllItemsAndDeleteFolder(downloadLoc);
	//mkdirp.sync(downloadLoc);
	console.log("[" + "CARD MANAGER".blue + "] " + "Complete".info);
	console.log("[" + "CARD MANAGER".blue + "] " + "Deleting old cards....".grey);
	removeAllItemsAndDeleteFolder(cardFolderLocation);
	//mkdirp.sync(cardFolderLocation);
	console.log("[" + "CARD MANAGER".blue + "] " + "Complete".info);
}

module.exports.initCard = function(cardPath,cardName,callback){
	//this method is both public and private
	initCard(cardPath,cardName,callback);
}

module.exports.getCardPaths = function(){
	return cards
}

var downloadedCards = 0;
var cards = [];
module.exports.setCards = function(cardsArray){
	cards = cardsArray;
}

module.exports.downloadCard = function(data,callback){
	if (!fs.existsSync(downloadFolderLocation)){
		console.log("Creating cards folder...".info);
		mkdirp.sync(downloadFolderLocation);
	}
	if (!fs.existsSync(cardFolderLocation)){
		console.log("Creating cards folder...".info);
		mkdirp.sync(cardFolderLocation);
	}
	mkdirp(downloadFolderLocation, function(err) {
		var downloadPath = downloadFolderLocation + "/" + data.cardName;
		var wstream = fs.createWriteStream(downloadPath);
		wstream.write(data.bufferStream);
		wstream.end();
		wstream.on('close',function(){
			var downloadMessage = data.cardName + " recieved...";
			console.log("[" + "CARD MANAGER".blue + "] " + downloadMessage.info);
			initCard(downloadPath,data.cardName,callback);
		});
	});
}


function initCard(cardPath,cardName,callback){
	extract(cardPath, {dir: cardFolderLocation + "/" + cardName}, function (err) {
		if(err && (err != undefined && err != null)){
		 	//crap
		 	var message = "[ERR] An unexpected error was hit decompressing card '" + cardName + "'\n" + err;
		 	console.log("[" + "CARD MANAGER".blue + "] " + message.error);
		 }else{
		 	//card has been recieved, and decompressed!  WOOOO
		 	if(cardName != "menu"){
		 		downloadedCards++;
		 	}else{
		 		menuHasBeenDownloaded = true;
		 	}
		 	console.log("[" + "CARD MANAGER".blue + "] " + "card '" + cardName + "' downloaded and decompressed");
		 	
		 		if(cardName == cards[cards.length - 1] || cardName == "menu"){
		 			console.log("[" + "CARD MANAGER".blue + "] " +  "Starting Station".bold.error);
		 			//when all the cards have been downloaded, then you start
		 			callback(cardFolderLocation + "/" + cardName + "/cards/" + cardName);
		 	}
		 	if(cards.length > 0 && downloadedCards == cards.length){
		 		//removeAllItemsAndDeleteFolder(__dirname + "/downloads");
		 	}
		 }
	});
}

function removeAllItemsAndDeleteFolder(path) {

	if(path == "/"){
		return; //don't let the user delete the entire file system
	}

	if(path == __dirname + "/"){
		return; //don't let the user delete the entire directory...
	}

	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
      	removeAllItemsAndDeleteFolder(curPath);
      } else { // delete file
      	fs.unlinkSync(curPath);
      }
  });
		fs.rmdirSync(path);
	}
}