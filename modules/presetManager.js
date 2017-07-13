var ipc;
var colors = require('colors');
var mkdirp = require('mkdirp');
const path = require('path');
var jsonfile = require('jsonfile');
var fs = require("fs");

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
	error: 'red',
});

var browserWindow;
var presetFile;
var presetsObject = {};
var moduleConsoleMessagePrefix = "[" + "PRESET MANAGER".warn + "] ";

//this makes the JSON file a little more readable
jsonfile.spaces = 4


module.exports.init = function(clientIPC,filePath,createdWindow){
	ipc = clientIPC;
	presetFile = filePath;
	browserWindow = createdWindow;
	readPresetsFromFileSync();
	ipc.on("getPresetWithKey",function(event,key){
		var newValue = getPresetWithKey(key);
		if(newValue == undefined){
			newValue = null
		}else{
			newValue = newValue;
		}
		event.returnValue = newValue;
	});
	ipc.on("setPresetWithKey",function(event,data){
		setPresetWithKey(data.key,data.value,function(){
			event.sender.send("presetDidWrite");
		});
		browserWindow.webContents.send('presetsFileDidChange',
		{
			"key" : data.key,
			"value" : data.value
		});
	});
}

module.exports.getPresets = function(){
	return getPresets();
}

module.exports.getPresetWithKey = function(key){
	return getPresetWithKey(key);
}

module.exports.setPresets = function(newPresets,callback){
	setPresets(newPresets,callback);
}

module.exports.setPresetWithKey = function(key,value){
	setPresetWithKey(key,value);
}

function setPresets(newPresets,callback){
	console.log(moduleConsoleMessagePrefix + "Writing new presets file...".input);
  	jsonfile.writeFile(presetFile,newPresets, function(err, obj) {
		if(err){
			console.log(moduleConsoleMessagePrefix + "Error:\n" + err.toString().error);
			callback(err);
			return;
		}
		console.log(moduleConsoleMessagePrefix + "Preset write... Successful!".info);
		if(callback != undefined){
			callback();
		}
	});
}

function readPresetsFromFile(callback){
	jsonfile.readFile(presetFile, function(err, obj) {
		if(err){
			console.log(moduleConsoleMessagePrefix + "Error:\n" + err.toString().error);
			return;
		}
		presetsObject = obj;
  		console.log(moduleConsoleMessagePrefix + "Presets read... Listing below\n".info + JSON.stringify(obj).input);
  		if(callback != undefined){
  			callback();
  		}
	});
}

function readPresetsFromFileSync(){
	presetsObject = jsonfile.readFileSync(presetFile)
  	console.log(moduleConsoleMessagePrefix + "Presets read... Listing below\n".info + JSON.stringify(presetsObject).input);
}

function setPresetWithKey(key,value,callback){
	for(var i = 0;i < presetsObject.presets.length;i++){
		if(presetsObject.presets[i].key == key){
			presetsObject.presets[i].value = value;
			setPresets(presetsObject,callback);
			console.log(moduleConsoleMessagePrefix + "Writing preset with key '" + key + "' with value '" + JSON.stringify(value) + "' ".info);
			return;
		}
	}
	//if we get to this point, we know the value doesn't exist yet... so we need to append it.
	presetsObject.presets.splice(presetsObject.presets.length,0,{"key" : key,"value" : value});
	setPresets(presetsObject,callback);
	console.log(moduleConsoleMessagePrefix + "Writing NEW preset with key '" + key + "' with value '" + JSON.stringify(value) + "' ".info);
}

function getPresetWithKey(key){
	for(var i = 0;i < presetsObject.presets.length;i++){
		if(presetsObject.presets[i].key == key){
			console.log(moduleConsoleMessagePrefix + "Read preset with key '" + key + "' with value '" + JSON.stringify(presetsObject.presets[i].value) + "' ".info);
			return presetsObject.presets[i];
		}
	}
}