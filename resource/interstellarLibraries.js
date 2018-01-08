/* Copyright (C) 2017 Interstellar Team - All Rights Reserved
 * Please refer to the Interstellar license in regards to
 * how you may/may not use, modify, and/or distribute this code.
 *
 * You should have received a copy of our license with
 * this file. If not, please email isaac@spaceCampUtah.org,
 * or visit interstellar's website
 *
 * Created by Isaac Ostler, to be used
 * to change education forever!  Your imagination is the limit!
 */


 var InterstellarFramework = function(){

 	var coreWidgets = [];
 	var isClearingDatabase = false;

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
			"key" : "foo.foo", //preset value that will be in the presets folder
			"callback" : function(){} //callback function to be called when this value is changed
		}
		*/


		this.onPresetValueChange = function(valueName,callback){
	  	//console.log("[INTERSTELLAR] presetListener created, watching value " + valueName + " (run callback upon change)");
	  	presetListeners.push({
	  		"key" : valueName,
	  		"callback" : callback
	  	});
	  	var presetValue = this.getPresetValue(valueName);
	  	if(presetValue == null){
	  		callback(null);
	  	}else{
	  		callback(presetValue.value);
	  	}
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

	this.onDatabaseValueChange = function(valueName,callback){
	  	//console.log("[INTERSTELLAR] databaseListener created, watching value " + valueName + " (run callback upon change)");
	  	databaseListeners.push({
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
		if(isClearingDatabase){
			//do NOT allow the client to set database values
			//during a reset
			return;
		}
		var databaseValue = {
			"key" : valueKey,
			"dataValue" : newData
		};
		var ipcRenderer = require('electron').ipcRenderer;
		ipcRenderer.send("setDatabaseValue",databaseValue);
	}

	/*
	Function Name : clearDatabase()
	Parameters : none
	Returns : void
	Purpose : Sets all database values to null, orders reload of the page as well
	*/
	this.clearDatabase = function(){
		isClearingDatabase = true;
		var ipcRenderer = require('electron').ipcRenderer;
		ipcRenderer.send("clearDatabase");
	}

	this.getAdminPassword = function(callbackPassed){
		//returns the admin password through a callback
		var ipcRenderer = require('electron').ipcRenderer;
		ipcRenderer.send("getAdminPassword");
		let callback = callbackPassed;
		ipcRenderer.once("recieveAdminPassword",function(event, password){
			callback(password);
		})
	}

	this.getFileNamesInFolder = function(folder,screen,callback){
		var ipcRenderer = require('electron').ipcRenderer;
		ipcRenderer.send("getFileNamesInFolder",{"path" : folder,"screen" : screen});
		ipcRenderer.once("recieveFileNamesInFolder",function(event,fileNames){
			callback(fileNames)
		})
	}

	//PREVIOUSLY CALLED interstellarSay, Depreciated in Alpha 1.2.0
	this.say = function(string){
		var ipcRenderer = require('electron').ipcRenderer;
		ipcRenderer.send("say",string);
	}

	this.closeCoreWindow = function(windowID,event){
		$("#" + windowID).stop();
		$("#" + windowID).slideUp();
	}

	this.openCoreWindow = function(windowID,event){
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

	//depreciated in 1.2.0
	/*
	function runServerFunction(passedFunction){
		var stringifiedFunction = String(passedFunction);
		var ipcRenderer = require('electron').ipcRenderer;
		var argumentObjects = [];
		
	    for (i = 1; i < arguments.length; i++) {
	        argumentObjects.parse(argumentObjects.length,0,arguments[i]);
	    }
		ipcRenderer.send("runServerFunction",stringifiedFunction,argumentObjects);
	}*/

	/*
	Function Name : getStation()
	Parameters : none
	Returns : (String) the current station loaded
	Purpose : Returns the station (string) that has been loaded by interstellar
	*/


	this.getStation = function(){
		var remote = require('electron').remote;
		return remote.getGlobal('sharedObj').stationLoaded; 
	}

	this.clearDatabaseListners = function(){
		console.log("[CLEARING LISTENERS]".info + " " + databaseListeners);
		databaseListeners = [];
	}
	/*
		DEPRECIATED!  Use deepCopyArray() instead
		Function Name : IFDeepCopyArray()
		*/

	/*
	Function Name : deepCopyArray()
	Parameters : array
	Returns : (array) a deep copied array (no matter what the contents of the orginial array)
	Purpose : Javascript copies arrays much like pointers, which can be annoying at times.  
			  .slice() works with primitives, but not objects and prototypes.  IFDeepCopyArray
			  will create a TRUE deep copy.
	Credit : http://stackoverflow.com/a/23536726/3781277
	*/

	this.deepCopyArray = function(o) {
		var output, v, key;
		output = Array.isArray(o) ? [] : {};
		for (key in o) {
			v = o[key];
			output[key] = (typeof v === "object") ? this.deepCopyArray(v) : v;
		}
		return output;
	}

	/*
	Function Name : setCurrentScreen()
	Parameters : screenName
	Returns : void
	Purpose : FOR BRIDGE STATION USE ONLY!  Sets the current screen to the screen specified
	*/

	this.setCurrentScreen = function(screenName){
		location.href = "/card?card=" + screenName;
		/*
			var ipcRenderer = require('electron').ipcRenderer;
			ipcRenderer.send("setCurrentScreen",screenName);
		*/
	}

	/*
	Function Name : setCurrentScreen()
	Parameters : nothing
	Returns : string
	Purpose : FOR BRIDGE STATION USE ONLY!  Gets the current screen to the screen the user is on
	*/

	this.getCurrentScreen = function(screenName){
		var windowSrc = window.location.href;
		var currentScreen = windowSrc.split("card=");
		return currentScreen[1];
	}

	/*
	Function Name : getDatabaseValue()
	Parameters : (String) key of database value
	Returns : (Var) value of the database value under the specified key on the mongo database
	Purpose : Returns the value of the specified key on the mongo database
	*/

	this.getDatabaseValue = function(key){
		var ipcRenderer = require('electron').ipcRenderer;
		return ipcRenderer.sendSync("getDatabaseValue",key);
	}

	this.setPresetValue = function(key,value,callback){
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
	this.getPresetValue = function(key){
		var ipcRenderer = require('electron').ipcRenderer;
		return ipcRenderer.sendSync("getPresetWithKey",key);
	}

	this.playSoundEffect = function(soundEffect){
		var audio = new Audio('/soundEffects?soundEffect=' + soundEffect);
		audio.play();
	}
	this.playErrorNoise = function(){
		var audio = new Audio('/randomError?variance=' + Math.random());
		audio.play();
	}
	this.playRandomBeep = function(){
		var audio = new Audio('/randomBeep?id=' + Math.random());
		audio.play();
	}

	/*

		Name: addCoreWidget();
		Purpose: Creates a CoreWidget class and keeps track of it, for
				 resets and who knows what else
		Takes: String - Widget Name
			   Custom Class - Code for the widget
		Returns - The GUID of the widget
		*/

		this.addCoreWidget = function(name, widgetClass){
			var widget = new CoreWidget(name,widgetClass);
			coreWidgets.splice(coreWidgets.length,0,
			{
				"name" : name,
				"widgetClass" : widget
			});
			return widget.getWidgetID();
		}

		//colors crap

		this.rotateHue = function(rgb, degree) {
		    var hsl = rgbToHSL(rgb);
		    hsl.h += degree;
		    if (hsl.h > 360) {
		        hsl.h -= 360;
		    }
		    else if (hsl.h < 0) {
		        hsl.h += 360;
		    }
		    return hslToRGB(hsl);
		}

		// exepcts a string and returns an object
		function rgbToHSL(rgb) {
		    // strip the leading # if it's there
		    rgb = rgb.replace(/^\s*#|\s*$/g, '');

		    // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
		    if(rgb.length == 3){
		        rgb = rgb.replace(/(.)/g, '$1$1');
		    }

		    var r = parseInt(rgb.substr(0, 2), 16) / 255,
		        g = parseInt(rgb.substr(2, 2), 16) / 255,
		        b = parseInt(rgb.substr(4, 2), 16) / 255,
		        cMax = Math.max(r, g, b),
		        cMin = Math.min(r, g, b),
		        delta = cMax - cMin,
		        l = (cMax + cMin) / 2,
		        h = 0,
		        s = 0;

		    if (delta == 0) {
		        h = 0;
		    }
		    else if (cMax == r) {
		        h = 60 * (((g - b) / delta) % 6);
		    }
		    else if (cMax == g) {
		        h = 60 * (((b - r) / delta) + 2);
		    }
		    else {
		        h = 60 * (((r - g) / delta) + 4);
		    }

		    if (delta == 0) {
		        s = 0;
		    }
		    else {
		        s = (delta/(1-Math.abs(2*l - 1)))
		    }

		    return {
		        h: h,
		        s: s,
		        l: l
		    }
		}

		// expects an object and returns a string
		function hslToRGB(hsl) {
		    var h = hsl.h,
		        s = hsl.s,
		        l = hsl.l,
		        c = (1 - Math.abs(2*l - 1)) * s,
		        x = c * ( 1 - Math.abs((h / 60 ) % 2 - 1 )),
		        m = l - c/ 2,
		        r, g, b;

		    if (h < 60) {
		        r = c;
		        g = x;
		        b = 0;
		    }
		    else if (h < 120) {
		        r = x;
		        g = c;
		        b = 0;
		    }
		    else if (h < 180) {
		        r = 0;
		        g = c;
		        b = x;
		    }
		    else if (h < 240) {
		        r = 0;
		        g = x;
		        b = c;
		    }
		    else if (h < 300) {
		        r = x;
		        g = 0;
		        b = c;
		    }
		    else {
		        r = c;
		        g = 0;
		        b = x;
		    }

		    r = normalize_rgb_value(r, m);
		    g = normalize_rgb_value(g, m);
		    b = normalize_rgb_value(b, m);

		    return rgbToHex(r,g,b);
		}

		function normalize_rgb_value(color, m) {
		    color = Math.floor((color + m) * 255);
		    if (color < 0) {
		        color = 0;
		    }
		    return color;
		}

		function rgbToHex(r, g, b) {
		    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
		}


		function resizeCoreWidget(widgetName,event){
			for(var i = 0;i < coreWidgets.length;i++){
				if(coreWidgets[i].name == widgetName){
					coreWidgets[i].widgetClass.getWidgetCode().onResize(event);
					return;
				}
			}
		}

		function afterResizeCoreWidget(widgetName,event){
			for(var i = 0;i < coreWidgets.length;i++){
				if(coreWidgets[i].name == widgetName){
					coreWidgets[i].widgetClass.getWidgetCode().afterResize(event);
					return;
				}
			}
		}

		var zIndexCounter = 100;

		this.setCoreWidgetMovement = function(state){
			$(".coreWidgetMoveContainer").off();
			$(".coreWidget-topResize").off();
			$(".coreWidget-bottomResize").off();
			$(".coreWidget-leftResize").off();
			$(".coreWidget-topRightCornerResize").off();
			$(".coreWidget-bottomRightCornerResize").off();
			$(".coreWidget-bottomLeftCornerResize").off();
			$(".coreWidget-topLeftCornerResize").off();
			if(state){
				$(".coreWidgetMoveContainer").css("display","block");
				$(".coreWidget-topResize").css("display","block");
				$(".coreWidget-bottomResize").css("display","block");
				$(".coreWidget-leftResize").css("display","block");
				$(".coreWidget-topRightCornerResize").css("display","block");
				$(".coreWidget-bottomRightCornerResize").css("display","block");
				$(".coreWidget-bottomLeftCornerResize").css("display","block");
				$(".coreWidget-topLeftCornerResize").css("display","block");
				$(".coreWidgetMoveContainer").mousedown(function(event){
					zIndexCounter++;
					var offsetX = event.offsetX;
					var offsetY = event.offsetY;
					var element = $(event.target).parent();
					element.css("z-index",zIndexCounter);
					$(document.body).append("<div class='coreLayoutManagerMouseCatcher'></div>")
					$(".coreLayoutManagerMouseCatcher").mousemove(function(event){
						element.css("top",(event.clientY - offsetY) + "px");
						element.css("left",(event.clientX - offsetX) + "px");
					});
					$(".coreLayoutManagerMouseCatcher").mouseup(function(event){
						$(".coreLayoutManagerMouseCatcher").off();
						$(".coreLayoutManagerMouseCatcher").remove();
					});
				});
				$(".coreWidget-topResize").mousedown(function(event){
					zIndexCounter++;
					var element = $(event.target).parent();
					var initalY = element.position().top;
					var initalHeight = element.height();
					var widgetName = element.attr("widgetName");
					element.css("z-index",zIndexCounter);
					$(document.body).append("<div class='coreLayoutManagerMouseCatcher'></div>")
					$(".coreLayoutManagerMouseCatcher").mousemove(function(event){
						if(initalY + initalHeight < (event.clientY - 3)){
							return;
						}
						element.css("top",event.clientY + "px");
						var heightDifference = initalHeight + (initalY - event.clientY);
						element.css("height",heightDifference + "px");
						resizeCoreWidget(widgetName);
					});
					$(".coreLayoutManagerMouseCatcher").mouseup(function(event){
						$(".coreLayoutManagerMouseCatcher").off();
						$(".coreLayoutManagerMouseCatcher").remove();
						afterResizeCoreWidget(widgetName);
					});
				});
				$(".coreWidget-leftResize").mousedown(function(event){
					zIndexCounter++;
					var element = $(event.target).parent();
					var initalX = element.position().left;
					var initalWidth = element.width();
					var widgetName = element.attr("widgetName");
					element.css("z-index",zIndexCounter);
					$(document.body).append("<div class='coreLayoutManagerMouseCatcher'></div>")
					$(".coreLayoutManagerMouseCatcher").mousemove(function(event){
						if(initalX + initalWidth < (event.clientX - 3)){
							return;
						}
						element.css("left",event.clientX + "px");
						var widthDifference = initalWidth + (initalX - event.clientX);
						element.css("width",widthDifference + "px");
						resizeCoreWidget(widgetName);
					});
					$(".coreLayoutManagerMouseCatcher").mouseup(function(event){
						$(".coreLayoutManagerMouseCatcher").off();
						$(".coreLayoutManagerMouseCatcher").remove();
						afterResizeCoreWidget(widgetName);
					});
				});
				$(".coreWidget-rightResize").mousedown(function(event){
					zIndexCounter++;
					var element = $(event.target).parent();
					var widgetName = element.attr("widgetName");
					element.css("z-index",zIndexCounter);
					var xPos = element.position().left;
					$(document.body).append("<div class='coreLayoutManagerMouseCatcher'></div>")
					$(".coreLayoutManagerMouseCatcher").mousemove(function(event){
						if(xPos > (event.clientX - 3)){
							return;
						}
						element.css("width",(event.clientX - xPos)+ "px");
						resizeCoreWidget(widgetName);
					});
					$(".coreLayoutManagerMouseCatcher").mouseup(function(event){
						$(".coreLayoutManagerMouseCatcher").off();
						$(".coreLayoutManagerMouseCatcher").remove();
						afterResizeCoreWidget(widgetName);
					});
				});
				$(".coreWidget-bottomResize").mousedown(function(event){
					zIndexCounter++;
					var element = $(event.target).parent();
					var widgetName = element.attr("widgetName");
					element.css("z-index",zIndexCounter);
					var yPos = element.position().top;
					$(document.body).append("<div class='coreLayoutManagerMouseCatcher'></div>")
					$(".coreLayoutManagerMouseCatcher").mousemove(function(event){
						if(yPos > (event.clientY - 3)){
							return;
						}
						element.css("height",(event.clientY - yPos)+ "px");
						resizeCoreWidget(widgetName);
					});
					$(".coreLayoutManagerMouseCatcher").mouseup(function(event){
						$(".coreLayoutManagerMouseCatcher").off();
						$(".coreLayoutManagerMouseCatcher").remove();
						afterResizeCoreWidget(widgetName);
					});
				});
				$(".coreWidget-topRightCornerResize").mousedown(function(event){
					zIndexCounter++;
					var element = $(event.target).parent();
					var widgetName = element.attr("widgetName");
					element.css("z-index",zIndexCounter);
					var xPos = element.position().left;
					var initalY = element.position().top;
					var initalHeight = element.height();
					$(document.body).append("<div class='coreLayoutManagerMouseCatcher'></div>")
					$(".coreLayoutManagerMouseCatcher").mousemove(function(event){
						if(xPos > (event.clientX - 3)){
							return;
						}
						element.css("width",(event.clientX - xPos) + "px");
						resizeCoreWidget(widgetName);
						if(initalY + initalHeight < (event.clientY - 3)){
							return;
						}
						element.css("top",event.clientY + "px");
						var heightDifference = initalHeight + (initalY - event.clientY);
						element.css("height",heightDifference + "px");
						
					});
					$(".coreLayoutManagerMouseCatcher").mouseup(function(event){
						$(".coreLayoutManagerMouseCatcher").off();
						$(".coreLayoutManagerMouseCatcher").remove();
						afterResizeCoreWidget(widgetName);
					});
				});
				$(".coreWidget-bottomLeftCornerResize").mousedown(function(event){
					zIndexCounter++;
					var element = $(event.target).parent();
					var widgetName = element.attr("widgetName");
					element.css("z-index",zIndexCounter);
					var yPos = element.position().top;
					var initialX = element.position().left;
					var initalWidth = element.width();
					$(document.body).append("<div class='coreLayoutManagerMouseCatcher'></div>")
					$(".coreLayoutManagerMouseCatcher").mousemove(function(event){
						if(initialX + initalWidth < (event.clientX - 3)){
							return;
						}
						element.css("left",event.clientX + "px");
						var widthDifference = initalWidth + (initialX - event.clientX);
						element.css("width",widthDifference + "px");

						if(yPos > (event.clientY - 3)){
							resizeCoreWidget(widgetName);
							return;
						}
						element.css("height",(event.clientY - yPos)+ "px");
						resizeCoreWidget(widgetName);
					});


					$(".coreLayoutManagerMouseCatcher").mouseup(function(event){
						$(".coreLayoutManagerMouseCatcher").off();
						$(".coreLayoutManagerMouseCatcher").remove();
						afterResizeCoreWidget(widgetName);
					});
				});
				$(".coreWidget-bottomRightCornerResize").mousedown(function(event){
					zIndexCounter++;
					var element = $(event.target).parent();
					var widgetName = element.attr("widgetName");
					element.css("z-index",zIndexCounter);
					var yPos = element.position().top;
					var xPos = element.position().left;
					$(document.body).append("<div class='coreLayoutManagerMouseCatcher'></div>")
					$(".coreLayoutManagerMouseCatcher").mousemove(function(event){
						if(xPos > (event.clientX - 3)){
							return;
						}						
						element.css("width",(event.clientX - xPos) + "px");
						if(yPos > (event.clientY - 3)){
							resizeCoreWidget(widgetName);
							return;
						}
						element.css("height",(event.clientY - yPos)+ "px");
						resizeCoreWidget(widgetName);
					});
					$(".coreLayoutManagerMouseCatcher").mouseup(function(event){
						$(".coreLayoutManagerMouseCatcher").off();
						$(".coreLayoutManagerMouseCatcher").remove();
						afterResizeCoreWidget(widgetName);
					});
				});
				$(".coreWidget-topLeftCornerResize").mousedown(function(event){
					var element = $(event.target).parent();
					zIndexCounter++;
					element.css("z-index",zIndexCounter);
					var widgetName = element.attr("widgetName");
					var xPos = element.position().left;
					var initialY = element.position().top;
					var initialHeight = element.height();
					var initialWidth = element.width();
					$(document.body).append("<div class='coreLayoutManagerMouseCatcher'></div>")
					$(".coreLayoutManagerMouseCatcher").mousemove(function(event){
						if(xPos + initialWidth < (event.clientX - 3)){
							return;
						}
						element.css("left",event.clientX + "px");
						element.css("width",((xPos - event.clientX) + initialWidth) + "px");
						if(initialY + initialHeight < (event.clientY - 3)){
							resizeCoreWidget(widgetName);
							return;
						}
						element.css("top",event.clientY + "px");
						var heightDifference = initialHeight + (initialY - event.clientY);
						element.css("height",heightDifference + "px");
						resizeCoreWidget(widgetName);
					});
					$(".coreLayoutManagerMouseCatcher").mouseup(function(event){
						$(".coreLayoutManagerMouseCatcher").off();
						$(".coreLayoutManagerMouseCatcher").remove();
						afterResizeCoreWidget(widgetName);
					});
				});
			}else{
				$(".coreWidgetMoveContainer").css("display","none");
				$(".coreWidget-topResize").css("display","none");
				$(".coreWidget-bottomResize").css("display","none");
				$(".coreWidget-leftResize").css("display","none");
				$(".coreWidget-topRightCornerResize").css("display","none");
				$(".coreWidget-bottomRightCornerResize").css("display","none");
				$(".coreWidget-bottomLeftCornerResize").css("display","none");
				$(".coreWidget-topLeftCornerResize").css("display","none");
			}
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
		require('electron').ipcRenderer.on('databaseValueDidReset', (event, message) => {
			location.reload();
		});
	}


/*
	The core widget class

	Name: CoreWidget,
	Purpose: To control the code of a core widget,
	Takes: String - Name of class
		   Custom Class - The code for the widget
	
	Public Methods:
	
	Setter - WidgetName

		Name: setWidgetName(),
		Purpose: Set the value of WidgetName,
		Takes: String - Name of the widget,
		Returns: void

	Getter - WidgetName

		Name: getWidgetName(),
		Purpose: Get the value of WidgetName,
		Takes: nothing,
		Returns: void

	Setter - WidgetCode

		Name: setWidgetCode(),
		Purpose: Set the code of the widget
		Takes: Custom Class - The actual code for the widget, defined as a class (not yet instantiated)
		Returns: void

	Getter - WidgetCode

		Name: getWidgetCode(),
		Purpose: Get the code of the widget
		Takes: nothing
		Returns: Custom Class - The actual !!instantiated!! class for the widget

	Getter - WidgetID

		Name: getWidgetID(),
		Purpose: returns the unique widget GUID
		Takes: nothing,
		Returns: String - The unique GUID for this widget
*/

var CoreWidget = function(widgetName,WidgetCode){
	var widgetName = widgetName;
	var instantiatedCode = new WidgetCode();
	var widgetID = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);

	this.setWidgetName = function(newName){
		widgetName = newName;
	}

	this.getWidgetName = function(){
		return widgetName;
	}

	this.setWidgetCode = function(WidgetCode){
		console.warn("Warning!  'setWidgetCode' may leak database, preset, and event listeners!");
		instantiatedCode = new WidgetCode();
	}

	this.getWidgetCode = function(){
		return instantiatedCode;
	}

	this.getWidgetID = function(){
		return widgetID;
	}
}

var Interstellar = new InterstellarFramework();

function playRandomBeep(){
	console.warn("WARNING: 'playRandomBeep' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.playRandomBeep' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	var audio = new Audio('/randomBeep?id=' + Math.random());
	audio.play();
}

//for support back when Interstellar Libraries used
//globally defined functions.  These practices were
//depreciated in Alpha 1.2.0, and will be removed in
//Beta 1.0.0 (?)

function onDatabaseValueChange(key,callback){
	console.warn("WARNING: 'onDatabaseValueChange' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.onDatabaseValueChange' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	Interstellar.onDatabaseValueChange(key,callback);
}
function getDatabaseValue(value){
	console.warn("WARNING: 'getDatabaseValue' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.getDatabaseValue' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	return Interstellar.getDatabaseValue(value);
}
function setDatabaseValue(key,value){
	console.warn("WARNING: 'setDatabaseValue' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.setDatabaseValue' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	Interstellar.setDatabaseValue(key,value);
}
function onPresetValueChange(key,callback){
	console.warn("WARNING: 'onPresetValueChange' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.onPresetValueChange' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	Interstellar.onPresetValueChange(key,callback);
}
function getPresetValue(key){
	console.warn("WARNING: 'getPresetValue' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.getPresetValue' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	return Interstellar.getPresetValue(key);	
}
function getAdminPassword(callback){
	console.warn("WARNING: 'getAdminPassword' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.getAdminPassword' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	Interstellar.getAdminPassword(callback);	
}
function getFileNamesInFolder(folder,screen,callback){
	console.warn("WARNING: 'getFileNamesInFolder' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.getFileNamesInFolder' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	Interstellar.getFileNamesInFolder(folder,screen,callback);	
}
function interstellarSay(string){
	console.warn("WARNING: 'interstellarSay' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.say' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	Interstellar.say(string);	
}
function closeCoreWindow(windowID,event){
	console.warn("WARNING: 'closeCoreWindow' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.closeCoreWindow' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	Interstellar.closeCoreWindow(windowID,event);	
}
function openCoreWindow(windowID,event){
	console.warn("WARNING: 'openCoreWindow' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.openCoreWindow' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	Interstellar.openCoreWindow(windowID,event);	
}
function getStation(){
	console.warn("WARNING: 'getStation' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.getStation' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	return Interstellar.getStation();	
}
function clearDatabaseListners(){
	console.warn("WARNING: 'clearDatabaseListners' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.clearDatabaseListners' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	return Interstellar.clearDatabaseListners();
}
function setCurrentScreen(screenName){
	console.warn("WARNING: 'setCurrentScreen' has been depreciated in Interstellar Alpha 1.2.0!  Use 'Interstellar.setCurrentScreen' to access the globablly defined instance, or define your own with 'new InterstellarFramework()'");
	return Interstellar.setCurrentScreen(screenName);
}