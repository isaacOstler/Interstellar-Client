/* Copyright (C) 2017 Interstellar Team - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the MIT license.
 *
 * You should have received a copy of the MIT license with
 * this file. If not, please email lavapig2020@gmail.com,
 * or visit interstellar's website
 *
 * Created by Isaac Ostler, to be used
 * to change education forever!  Your imagination is the limit!
 */

console.log("INTERSTELLAR LIBRARIES DID INIT");
var databaseListeners = []; //full description of this variable and how it works below
/*
	The databaseListeners Array
	this array keeps track of all database listeners instantiated by the card.  If anything ever changes
	on the database, an event will be fired and catched by interstellar client.  Interstellar client is then
	responsible for detecting which variable was changed, it cycles through this array, and calls any callback
	functions attatched to that variable changing.

	STANDARD OBJECT IN THIS ARRAY:
	The standard JSON object in this array will look like this:
	{
		"key" : "foo.foo", //database value that will be on the server
		"callback" : function(){} //callback function to be called when this value is changed
	}
	*/
var presetListeners = []; //full description of this variable and how it works below
/*
	The presetListeners Array
	this array keeps track of all presets saved to the userPrefs.JSON file, when a change is detected, the
	onPresetValueChange event listener will cycle through this array and call any callbacks subscribed to
	that data.

	STANDARD OBJECT IN THIS ARRAY:
	The standard JSON object in this array will look like this:
	{
		"key" : "foo.foo", //database value that will be in the presets folder
		"callback" : function(){} //callback function to be called when this value is changed
	}
	*/


function onPresetValueChange(valueName,callback){
  	console.log("[INTERSTELLAR] presetListener created, watching value " + valueName + " (run callback upon change)");
  	presetListeners.push({
  		"key" : valueName,
  		"callback" : callback
  	});
  	callback(getPresetValue(valueName).value);
}
/*
Function Name : onDatabaseValueChange(valueName,callback(newData){})
Parameters : (string) valueName, this is the key of the value on the database.  
			 (JSON) \/
					 (string) when passed "observeInitial", the callback will immediatly be passed the database value
			 (function) callback, this function will be called when the database value changes
Returns : none
Purpose : Watches passed variable 'valueName' on database for changes, if changes are detected
		  the passed callback function will be called, and the new value of the variable will
		  be passed
		  */

		  function onDatabaseValueChange(valueName,callback){
		  	console.log("[INTERSTELLAR] databaseListener created, watching value " + valueName + " (run callback upon change)");
		  	databaseListeners.push({
		  		"key" : valueName,
		  		"callback" : callback
		  	});
		  	callback(getDatabaseValue(valueName));
		  }
/*
Function Name : setDatabaseValue(valueKey,newData)
Parameters : (string) value key, this string will be used to identify the value on the database
			 (var) newData, this value is the value that will be set on the database
Returns : none
Purpose : Update value on the database, and if no value exists, create a new document
*/
function setDatabaseValue(valueKey,newData){
	var databaseValue = {
		"key" : valueKey,
		"dataValue" : newData
	};
	var ipcRenderer = require('electron').ipcRenderer;
	ipcRenderer.send("setDatabaseValue",databaseValue);
}

function getAdminPassword(callbackPassed){
	//returns the admin password through a callback
	var ipcRenderer = require('electron').ipcRenderer;
	ipcRenderer.send("getAdminPassword");
	let callback = callbackPassed;
	ipcRenderer.once("recieveAdminPassword",function(event, password){
		callback(password);
	})
}

function getFileNamesInFolder(folder,screen,callback){
	var ipcRenderer = require('electron').ipcRenderer;
	ipcRenderer.send("getFileNamesInFolder",{"path" : folder,"screen" : screen});
	ipcRenderer.once("recieveFileNamesInFolder",function(event,fileNames){
		callback(fileNames)
	})
}

function interstellarSay(string){
	var ipcRenderer = require('electron').ipcRenderer;
	ipcRenderer.send("say",string);
}

function closeCoreWindow(windowID,event){
	$("#" + windowID).stop();
	$("#" + windowID).slideUp();
}

function openCoreWindow(windowID,event){
	var element = $("#" + windowID);
	if((event.pageX + element.width()) < $(window).width()){
		element.css("left",event.pageX + "px");
	}else{
		element.css("left",(($(window).width() - element.width()) - 10) + "px");
	}
	if((event.pageY + element.height()) < $(window).height()){
		element.css("top",event.pageY + "px");
	}else{
		element.css("top",(($(window).height() - element.height()) - 10) + "px");
	}
	element.stop();
	element.slideDown();
}

function runServerFunction(passedFunction){
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


function getStation(){
	var remote = require('electron').remote;
	return remote.getGlobal('sharedObj').stationLoaded; 
}

function clearDatabaseListners(){
	console.log("[CLEARING LISTENERS]".info + " " + databaseListeners);
	databaseListeners = [];
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

function IFDeepCopyArray(o) {
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

function setCurrentScreen(screenName){
	var ipcRenderer = require('electron').ipcRenderer;
	ipcRenderer.send("setCurrentScreen",screenName);
}

/*
Function Name : getDatabaseValue()
Parameters : (String) key of database value
Returns : (Var) value of the database value under the specified key on the mongo database
Purpose : Returns the value of the specified key on the mongo database
*/

function getDatabaseValue(key){
	var ipcRenderer = require('electron').ipcRenderer;
	return ipcRenderer.sendSync("getDatabaseValue",key);
}

function setPresetValue(key,value,callback){
	var data = {"key" : key, "value" : value};
	var ipcRenderer = require('electron').ipcRenderer;
	let functionCallback = callback;
	ipcRenderer.send("setPresetWithKey",data);
	ipcRenderer.once("presetDidWrite",function(){
		if(functionCallback != undefined){
			functionCallback();
		}
	});
}
function getPresetValue(key){
	var ipcRenderer = require('electron').ipcRenderer;
	return ipcRenderer.sendSync("getPresetWithKey",key);
}

require('electron').ipcRenderer.on('presetsFileDidChange', (event, message) => {
	for(var i = 0; i < presetListeners.length;i++){
		if(message.key == presetListeners[i].key){
			presetListeners[i].callback(message.value);
		}
	}
});
require('electron').ipcRenderer.on('databaseValueDidChange', (event, message) => {
	for(var i = 0; i < databaseListeners.length;i++){
		if(message.key == databaseListeners[i].key){
			databaseListeners[i].callback(message.dataValue);
		}
	}
});

var zIndexCounter = 0;
var isDraggingLayout = false;
var layoutManagerIsActive = false;
var xLayoutDragBias = 0;
var yLayoutDragBias = 0;
var isResizingLayout = false;
var layoutDragTarget;

$(".Core_Theme-CoreWidget").on("mousedown",function(event){
	if(layoutManagerIsActive){
		zIndexCounter++;
		isDraggingLayout = true;
		layoutDragTarget = event.currentTarget;
		xLayoutDragBias = event.offsetX;
		yLayoutDragBias = event.offsetY;
		$(layoutDragTarget).css("cursor","move");
		$(layoutDragTarget).css("z-index",zIndexCounter);
	}
});

$("body").on("mousemove",function(event){
	if(layoutManagerIsActive && isDraggingLayout && !isResizingLayout){
		$(layoutDragTarget).css("left",event.clientX - xLayoutDragBias);
		$(layoutDragTarget).css("top",event.clientY - yLayoutDragBias);
	}else if(layoutManagerIsActive && isResizingLayout){
		var newWidth = event.clientX - $(layoutDragTarget).position().left;
		var newHeight = event.clientY - $(layoutDragTarget).position().top;
		$(layoutDragTarget).css("width",newWidth);
		$(layoutDragTarget).css("height",newHeight);
	}
});

$("body").on("mouseup",function(event){
	if(layoutManagerIsActive && isDraggingLayout && !isResizingLayout){
		var newXPos = event.clientX - xLayoutDragBias;
		var newYPos = event.clientY - yLayoutDragBias;
		isDraggingLayout = false;
		isResizingLayout = false;
		$(layoutDragTarget).css("cursor","default");
	}
});