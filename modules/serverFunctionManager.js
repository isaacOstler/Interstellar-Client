var ipc = require('electron').ipcMain;
var fs = require("fs");
var io = require('socket.io-client');
var remote = require('electron').remote;
var SerialPort = require("serialport");
var colors = require('colors');
const clearRequire = require('clear-require');
const importFresh = require('import-fresh');

var browserWindow;
var changeStationScreen;
var socket;
var station;
var scripts = [];

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

var serverFunctionManagerMainMessage = "[" + "SERVER FUNCTION MANAGER".yellow + "] ";

module.exports.init = function(clientIPC,createdWindow, webSocket,changeStationScreenFunction,station){
	ipc = clientIPC;
	browserWindow = createdWindow;
	socket = webSocket;
	changeStationScreen = changeStationScreenFunction;
	station = station;

	socket.on('databaseValueDidChange',function(data){
		browserWindow.webContents.send('databaseValueDidChange',
		{
			"key" : data.key,
			"dataValue" : data.dataValue
		});
	});
}

module.exports.takeServerScriptsInFolder = function(path){
	if (fs.existsSync(path)) {
		var files = walkSync(path)
		for(var i = 0;i < files.length;i++){
			console.log(serverFunctionManagerMainMessage + "Script Found!".bold + "  ('" + files[i].toString().input + "')");
			loadScript(path + "/" + files[i],files[i]);
		}
	}else{
		console.log(serverFunctionManagerMainMessage + "There are no server scripts at path '".error + path.toString().error + "'".error);
	}
}

module.exports.resetScripts = function(){
	console.log(serverFunctionManagerMainMessage + "Reseting Scripts".bold.error);
	for(var i = 0;i < scripts.length;i++){
		scripts[i].object.resetScript();
		//clearRequire(scripts[i].path);
		//delete scripts[i].object;
		//scripts[i].object = importFresh(scripts[i].path);
	}
}

function loadScript(path,scriptName){
	if(scriptName == undefined || scriptName == ""){
		scriptName = "Script";
	}

	fs.readFile(path, function read(err, serverScriptCode) {
		fs.readFile(__dirname + "/../modules/serverFunctionScriptTemplates.js", function read(err, data) {
			if(err){
				console.log(serverFunctionManagerMainMessage + "ERROR!  ".error + err.toString().error);
				return;
			}
			var codeSegments = data.toString().split("~*~");
			var code = codeSegments[0];
			code += serverScriptCode + codeSegments[1];
			fs.writeFile(path, code, function (err) {
				if(err){
					console.log(serverFunctionManagerMainMessage + "ERROR!  ".error + err.toString().error);
					return;
				}
				var scriptLoaded = importFresh(path);
				scripts.push({"object" : scriptLoaded,"path" : path});
				scriptLoaded.initServerFunctionWithInterstellarDefaults(ipc,browserWindow,socket,colors,SerialPort,changeStationScreen,station);
				console.log(serverFunctionManagerMainMessage + scriptName.input + " loaded....".info);
			});
		});
	});
}

// List all files in a directory in Node.js recursively in a synchronous fashion
var walkSync = function(dir, filelist) {
	var fs = fs || require('fs'),
	files = fs.readdirSync(dir);
	filelist = filelist || [];
	files.forEach(function(file) {
		if (fs.statSync(dir + '/' + file).isDirectory()) {
			filelist = walkSync(dir + "/" + file, filelist);
		}
		else {
			filelist.push(file);
		}
	});
	return filelist;
};