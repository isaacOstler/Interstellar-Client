var IF_SERVER_FUNCTION_MANAGER_ipc = require('electron').ipcMain;
var IF_SERVER_FUNCTION_MANAGER_io; //= require('socket.io-client');
var IF_SERVER_FUNCTION_MANAGER_remote = require('electron').remote;
var IF_SERVER_FUNCTION_MANAGER_colors;// = require('colors');
var IF_SERVER_FUNCTION_MANAGER_station = "UNKNOWN STATION";
var IF_SERVER_FUNCTION_MANAGER_browserWindow;
var IF_SERVER_FUNCTION_MANAGER_changeStationScreen;
var IF_SERVER_FUNCTION_MANAGER_socket;
var IF_SERVER_FUNCTION_MANAGER_databaseValueDidChangeCallbacks = [];
var SerialPort;

module.exports.resetScript = function(){
	console.log("Please set a reset function for your server script!".error.bold)
}

var InterstellarFramework = function(){
	this.onDatabaseClear = function(callback){
		module.exports.resetScript = callback;
	}
	this.onDatabaseValueChange = function(valueName,callback){
		console.log("[INTERSTELLAR] databaseListener created, watching value " + valueName + " (run callback upon change)");
		IF_SERVER_FUNCTION_MANAGER_databaseValueDidChangeCallbacks.push({
			"key" : valueName,
			"callback" : callback
		});
		callback(this.getDatabaseValue(valueName));
	}
	/*
	Function Name : setDatabaseValue(valueKey,newData)
	Parameters : (string) value key, this string will be used to identify the value on the database
				 (var) newData, this value is the value that will be set on the database
	Returns : none
	Purpose : Update value on the database, and if no value exists, create a new document
	*/
	this.setDatabaseValue = function(valueKey,newData){
		var databaseValue = {
			"key" : valueKey,
			"dataValue" : newData
		};
		IF_SERVER_FUNCTION_MANAGER_socket.emit("setDatabaseValue",databaseValue);
	}

	this.runServerFunction = function(passedFunction){
		var stringifiedFunction = String(passedFunction);
		var ipcRenderer = require('electron').ipcRenderer;
		var argumentObjects = [];
		
		for (i = 1; i < arguments.length; i++) {
			argumentObjects.parse(argumentObjects.length,0,arguments[i]);
		}
		ipcRenderer.send("runServerFunction",stringifiedFunction,argumentObjects);
	}
	/*
	Function Name : getStation()
	Parameters : none
	Returns : (String) the current station loaded
	Purpose : Returns the station (string) that has been loaded by interstellar
	*/


	this.getStation = function(){
		return IF_SERVER_FUNCTION_MANAGER_station;
	}

	this.clearDatabaseListners = function(){
		IF_SERVER_FUNCTION_MANAGER_databaseValueDidChangeCallbacks = [];
	}
	/*
	Function Name : IFDeepCopyArray()
	Parameters : array
	Returns : (array) a deep copied array (no matter what the contents of the orginial array)
	Purpose : Javascript copies arrays much like pointers, which can be annoying at times.  
			  .slice() works with primitives, but not objects and prototypes.  IFDeepCopyArray
			  will create a TRUE deep copy.
	Credit : http://stackoverflow.com/a/23536726/3781277
	*/

	this.IFDeepCopyArray = function(o) {
		var output, v, key;
		output = Array.isArray(o) ? [] : {};
		for (key in o) {
			v = o[key];
			output[key] = (typeof v === "object") ? IFDeepCopyArray(v) : v;
		}
		return output;
	}

	/*
	Function Name : setCurrentScreen()
	Parameters : screenName
	Returns : none
	Purpose : FOR BRIDGE STATION USE ONLY!  Sets the current screen to the screen specified
	*/

	this.setCurrentScreen = function(screenName){
		IF_SERVER_FUNCTION_MANAGER_changeStationScreen(screenName);
	}

	/*
	Function Name : getDatabaseValue()
	Parameters : (String) key of database value
	Returns : (Var) value of the database value under the specified key on the mongo database
	Purpose : Returns the value of the specified key on the mongo database
	*/

	this.getDatabaseValue = function(data){
		IF_SERVER_FUNCTION_MANAGER_socket.emit("getDatabaseValue",data);
		IF_SERVER_FUNCTION_MANAGER_socket.on("databaseValueForKey",function(databaseData){
			if(databaseData.key == data){
				console.log("key: '".bold + databaseData.key + "' value: '".bold + databaseData.dataValue);
				return databaseData.dataValue;
			}
		});
	}
}
var Interstellar = new InterstellarFramework();


module.exports.initServerFunctionWithInterstellarDefaults = function(clientIPC,createdWindow, webSocket,socketIO,serialport,colors,changeStationScreenFunction,station){
	IF_SERVER_FUNCTION_MANAGER_ipc = clientIPC;
	IF_SERVER_FUNCTION_MANAGER_browserWindow = createdWindow;
	IF_SERVER_FUNCTION_MANAGER_socket = webSocket;
	IF_SERVER_FUNCTION_MANAGER_io = socketIO;
	IF_SERVER_FUNCTION_MANAGER_changeStationScreen = changeStationScreenFunction;
	IF_SERVER_FUNCTION_MANAGER_station = station;
	console.log(serialport);
	SerialPort = serialport;

	IF_SERVER_FUNCTION_MANAGER_socket.on('databaseValueDidChange',function(data){
		for(var i = 0;i < IF_SERVER_FUNCTION_MANAGER_databaseValueDidChangeCallbacks.length;i++){
			var callbackObject = IF_SERVER_FUNCTION_MANAGER_databaseValueDidChangeCallbacks[i];
			if(data.key == callbackObject.key){
				callbackObject.callback(data.dataValue);
			}
		}
	});
	~*~
}