var ipc = require('electron').ipcMain;
var io = require('socket.io-client');
var remote = require('electron').remote;
var colors = require('colors');
var say = require('say');
var browserWindow;
var changeStationScreen;
var socket;
var getAdminFunction;

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

module.exports.init = function(clientIPC,createdWindow, webSocket,changeStationScreenFunction,getAdminFunctionPassed){
	getAdminFunction = getAdminFunctionPassed;
	ipc = clientIPC;
	browserWindow = createdWindow;
	socket = webSocket;
	changeStationScreen = changeStationScreenFunction;

	socket.on('databaseValueDidChange',function(data){
		if(data == "all"){
			console.log(stationManagerConsolePrefix + "Database Reset!");
			browserWindow.webContents.send('databaseValueDidReset');
		}else{
			console.log(stationManagerConsolePrefix + "New data! " + JSON.stringify(data));
			browserWindow.webContents.send('databaseValueDidChange',
			{
				"key" : data.key,
				"dataValue" : data.dataValue
			});
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

ipc.on('clearDatabase',function(){
	console.log(stationManagerConsolePrefix + "[" + "CLEAR".error + "] " + "CLEARING DATABASE!".bold.error);
	socket.emit("clearDatabase");
});

ipc.on('setDatabaseValue',function(event, data){
	console.log(stationManagerConsolePrefix + "[" + "SET".warn + "] " + JSON.stringify(data));
	socket.emit("setDatabaseValue",data);
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
		console.log(stationManagerConsolePrefix + "[" + "GET".info + "] " + JSON.stringify(databaseData));
		//console.log("got value '" + databaseData.dataValue + "' for key '" + data + "'");
		event.returnValue = databaseData.dataValue;
	}
	});
})