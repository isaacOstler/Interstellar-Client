var ipc = require('electron').ipcMain;
var io = require('socket.io-client');
var remote = require('electron').remote;
var colors = require('colors');
var say = require('say');
var browserWindow;
var changeStationScreen;
var socket;
var getAdminFunction;
var allowConsoleLogs = false;
var serverFunctionManager;
var oldUpdates = [];

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
var stationManagerConsolePrefix = "[" + "STATION MANAGER".verbose + "] ";

module.exports.init = function(clientIPC,createdWindow, webSocket,changeStationScreenFunction,getAdminFunctionPassed,serverFunctionManagerPassed){
	getAdminFunction = getAdminFunctionPassed;
	ipc = clientIPC;
	browserWindow = createdWindow;
	socket = webSocket;
	changeStationScreen = changeStationScreenFunction;
	serverFunctionManager = serverFunctionManagerPassed;

	socket.on('databaseValueDidChange',function(data){
		if(data == "all"){
			console.log(stationManagerConsolePrefix + "Database Reset!");
			browserWindow.webContents.send('databaseValueDidReset');
		}else{
			if(allowConsoleLogs){
				console.log(stationManagerConsolePrefix + "New data! [" + data.guid + "] " + data.key + " " + JSON.stringify(data.dataValue));
			}
			var detected = false;
			for(var i = 0;i < oldUpdates.length;i++){
				if(oldUpdates[i] == data.guid){
					detected = true;
				}
			}
			if(detected){
				if(allowConsoleLogs){
					console.log(stationManagerConsolePrefix + "BLOCKING OLD DATA [".input + data.guid.toString().info + "]".input);
				}
				for(var i = 0;i < oldUpdates.length;i++){
					if(oldUpdates[i] == data.guid){
						oldUpdates.splice(i,1);
					}
				}
			}else{
				browserWindow.webContents.send('databaseValueDidChange',
				{
					"key" : data.key,
					"dataValue" : data.dataValue
				});
			}
		}
	});
	console.log(stationManagerConsolePrefix + "did init");
}

module.exports.setStation = function(stationName){
	global.sharedObj = {stationLoaded: stationName};
}
/*
ipc.on('createDatabaseListener',function(event, data){
	console.log("database listener registered");
});*/
function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
   };
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

ipc.on('clearDatabase',function(){
	console.log(stationManagerConsolePrefix + "[" + "CLEAR".error + "] " + "CLEARING DATABASE!".bold.error);
	serverFunctionManager.resetScripts();
	socket.emit("clearDatabase");
});

ipc.on('setDatabaseListeners',function(event,data){
	socket.emit("setDatabaseListeners",data);
});

ipc.on('setDatabaseValue',function(event, data){
	var guid = guidGenerator();
	if(allowConsoleLogs){
		console.log(stationManagerConsolePrefix + "[" + "SET".warn + "] [" + guid + "] " + JSON.stringify(data));
	}
	data.guid = guid;
	socket.emit("setDatabaseValue",data);
	browserWindow.webContents.send('databaseValueDidChange',
	{
		"key" : data.key,
		"dataValue" : data.dataValue
	});
	oldUpdates.splice(oldUpdates.length,0,guid);
	data = null;
});

ipc.on('say',function(event,data){
	say.speak(data);
})

ipc.on('setCurrentScreen',function(event, data){
	console.log("command issued to change screen to " + data);
	changeStationScreen(data);
});

ipc.on('getDatabaseValue',function(event,data){
	socket.emit("getDatabaseValue",data);
	socket.on("databaseValueForKey",function(databaseData){
	if(databaseData.key == data){
		if(allowConsoleLogs){
			console.log(stationManagerConsolePrefix + "[" + "GET".info + "] " + JSON.stringify(databaseData));
		}
		//console.log("got value '" + databaseData.dataValue + "' for key '" + data + "'");
		event.returnValue = databaseData.dataValue;
	}
	});
})