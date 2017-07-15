var fs = require("fs");
var express = require('express');
var jsonfile = require('jsonfile');
var interstellarApp = express();
var http = require('http').Server(express);
const electron = require('electron');
var colors = require('colors');
var mkdirp = require('mkdirp');
const path = require('path');

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


var loadingScreen;
var portNumber = 3075;
var serverAddress = "localhost";
var serverPort = 3000;

if(process.argv.length > 2){
	portNumber = process.argv[2];
}
if(process.argv.length > 3){
	serverAddress = process.argv[3];
}
if(process.argv.length > 4){
	serverPort = process.argv[4];
}
if(process.argv.length > 5){
	if(process.argv[5] == "developer_mode"){
		developer_mode = true;
		console.log(mainProcessMessage + "Developer Mode Active".error);
	}
}
var interstellarFolder = path.normalize( __dirname + "/../interstellarSupport/");

var mainProcessMessage = "[" + "INTERSTELLAR CLIENT".prompt + "] ";
console.log(mainProcessMessage + "Checking for required folders...".prompt);

if (!fs.existsSync(interstellarFolder)){
	console.log(mainProcessMessage + "The interstellar folder does not exist... ".warn + "Creating it now...".info);
	fs.mkdirSync(interstellarFolder);
}else{
	console.log(mainProcessMessage + "Found the interstellar folder...".info.bold);
}
if (!fs.existsSync(interstellarFolder + "/userPrefs")){
	console.log(mainProcessMessage + "The userPrefs folder does not exist... ".warn + "Creating it now...".info);
	fs.mkdirSync(interstellarFolder + "/userPrefs");
}else{
	console.log(mainProcessMessage + "Found the userPrefs folder...".info.bold);
}


var cardFolderLocation = path.normalize(interstellarFolder + "/port" + portNumber + "/cards");//"Library/Application Support/interstellar/cards";
var screenFolderLocation = path.normalize(interstellarFolder + "/port" + portNumber + "/screens");//"Library/Application Support/interstellar/screens";
var downloadFolderLocation = path.normalize(interstellarFolder + "/port" + portNumber + "/download");//"Library/Application Support/interstellar/downloadFolderLocation";
var presetsFileLocation = path.normalize(interstellarFolder + "/userPrefs/presets.json");
var startupPrefsFileLocation = path.normalize(interstellarFolder + "/userPrefs/startupPrefs.json");

if (!fs.existsSync(presetsFileLocation)) {
	console.log(mainProcessMessage + "The presets file does not exist... ".warn + "Creating it now...".info);
	var defaultPresetObject = {"presets" : []}
	jsonfile.writeFileSync(presetsFileLocation, defaultPresetObject);
}
if (!fs.existsSync(startupPrefsFileLocation)) {
	console.log(mainProcessMessage + "The startupPrefs file does not exist... ".warn + "Creating it now...".info);
	var defaultPresetObject = {"messageToJames":"JAMES!  DO !!!! NOT !!!! EDIT THIS FILE!  UNEXPECTED EDITS CAN CORRUPT YOUR BUILD!  SERIOUSLY!  Please stop looking through my code.","localPort":3000,"serverAddress":"localhost","serverPort":3000,"savedStation":"","launchOnTimer":true,"launchTimer":15,"fullScreen":true,"cacheCards":false,"dateInstalled":"","password":"","instantLoad":false}
	jsonfile.writeFileSync(startupPrefsFileLocation, defaultPresetObject);
}
initRequiredFolders();

var downloadsFolderDoesExist = false;
var screensFolderDoesExist = false;
var isCoreStation = false;
var cardsFolderDoesExist = false;
var interstellarAppServer = undefined;
var autoLaunchTime = 15000;
var doAutoLaunch = true;
var instantLaunch = false;

function initRequiredFolders(){
	if (!fs.existsSync(cardFolderLocation)){
		console.log(mainProcessMessage + "Creating cards folder...".warn);
		mkdirp.sync(cardFolderLocation);
	}else{
		console.log(mainProcessMessage + "Cards folder found...".info.bold);
	}
	if (!fs.existsSync(downloadFolderLocation)){
		console.log(mainProcessMessage + "Creating downloads folder...".warn);
		mkdirp.sync(downloadFolderLocation);
	}else{
		console.log(mainProcessMessage + "Downloads folder found...".info.bold);
	}
	if (!fs.existsSync(screenFolderLocation)){
		console.log(mainProcessMessage + "Creating screens folder...".warn);
		mkdirp.sync(screenFolderLocation);
	}else{
		console.log(mainProcessMessage + "Screens folder found...".info.bold);
	}
	initApp();
}

function initApp(){
	interstellarApp.set("view engine","ejs");

	var openBrowsers = [];
//start of modules
var cardManager = require('./cardManager');
var stationManager = require('./modules/stationManager');
var serverFunctionManager = require('./modules/serverFunctionManager');
var presetManager = require('./modules/presetManager');
//end of modules
var menu;
var menuHasBeenDownloaded = false;
var stationHasBeenDownloaded = false;
var developer_mode = false;

var stationScreens = [];

var stationBrowser;

require('events').EventEmitter.prototype._maxListeners = 0;

const {app, BrowserWindow} = electron;

var currentScreen = "UNKNOWN SCREEN";
var station = "UKNOWN STATION";
var cards = [];
var cardLocations = [];
var allStations;
var dateInstalledByLog;

const computerBeepFolder = __dirname + '/public/computerBeeps';

//const container1GUILocation = '/public/LCARS-background-3.png';
const container1GUILocation = '/public/box1.png';
const container2GUILocation = '/public/box2.png';
const container3GUILocation = '/public/box3.png';
const container4GUILocation = '/public/box4.png';


const background1Location = "/public/background1.png";
const background2Location = "/public/background2.png";

var computerBeeps = [];

var ipc = require('electron').ipcMain;
var io = require('socket.io-client')

var downloadedCards = 0;
var userPrefs = {};

app.on('ready',function(){
	jsonfile.readFile(startupPrefsFileLocation, function(err, obj) {
		if(err){
			console.error(err);
			return;
		}
		autoLaunchTime = obj.launchTimer;
		doAutoLaunch = obj.launchOnTimer;
		instantLaunch = obj.instantLoad;
		console.log(mainProcessMessage + "instant launch set to true, this station will instantly launch".info);
		if(doAutoLaunch){
			obj.instantLoad = false;
			jsonfile.writeFile(startupPrefsFileLocation, obj, function (err) {
				if(err){
					console.log(mainProcessMessage + err.toString().error);
				}else{
					console.log(mainProcessMessage + "reset instant launch to false for next execution".info);
				}
			});
		}
		serverAddress = obj.serverAddress;
		serverPort = obj.serverPort;
		if(serverAddress == ""){
			serverAddress = "localhost";
			serverPort = 3000;
			obj.serverAddress = "localhost";
			obj.serverPort = 3000;
			jsonfile.writeFile(startupPrefsFileLocation, obj, function (err) {
				if(err){
					console.log(mainProcessMessage + err.toString().error);
				}else{
					console.log(mainProcessMessage + "server presets saved to default values".info);
				}
			});
		}
		dateInstalledByLog = obj.dateInstalled;
		if(obj.dateInstalled == ""){
			jsonfile.readFile(startupPrefsFileLocation, function(err, obj) {
				var dateObj = new Date();
				var formatedDate = "";
				formatedDate += dateObj.getSeconds() + "" + (dateObj.getMinutes() + dateObj.getSeconds()) + "" + (dateObj.getHours() + dateObj.getSeconds()) + "" + (dateObj.getDay() + dateObj.getSeconds()) + "|" + dateObj;
				obj.dateInstalled = formatedDate;
				dateInstalledByLog = formatedDate;
				jsonfile.writeFile(startupPrefsFileLocation, obj, function (err) {
					if(err){
						console.log(mainProcessMessage + err.toString().error);
					}else{
						console.log(mainProcessMessage + "date installed logged".info);
						if(obj.password == ""){
							console.log(mainProcessMessage + "PASSWORD HAS NEVER BEEN SET!".error.bold);
							console.log(mainProcessMessage + "Setting to default password".error.bold);
							setAdminPassword("password");
						}
					}
				});
			});
		}else{
			if(obj.password == ""){
				console.log(mainProcessMessage + "PASSWORD HAS NEVER BEEN SET!".error.bold);
				setAdminPassword("password");
			}
		}
		fs.readdir(computerBeepFolder, (err, files) => {

			if(err){
				console.log(mainProcessMessage + "ERROR FINDING COMPUTER BEEP NOISES: ".error + err.toString().error)
			}else{
				if(files.length > 0){
					files.forEach(file => {
						if(file == ".DS_Store"){
							return;
						}
						console.log(mainProcessMessage + "[" + "INDEXED".info + "] " + file + " found in '" + computerBeepFolder + "'");
						computerBeeps.splice(computerBeeps.length, 0, file);
					});
				}else{
					console.log(mainProcessMessage + "NO COMPUTER BEEPS WERE FOUND IN '".error + computerBeepFolder.input + "'".error);
				}
			}
		})
		console.log(mainProcessMessage + "Connecting to server at address '" + serverAddress + ":" + serverPort + "'");
		var socketConnectionAddress = "http://" + serverAddress + ":" + serverPort;
		var socket = io.connect(socketConnectionAddress,{
			'reconnection': true
		});
		//init the card manager (See function init in card manager)
		cardManager.init(cardFolderLocation,screenFolderLocation,downloadFolderLocation);
		//create a new browserWindow, with the width of 400, height of 400, transparent background and no frame (loading screen)
		openLoadingWindow(function(window){
			openBrowsers.push(window);
		});
		//connect to the interstellar server
		// Add a connect listener
		socket.on('connect', function(connectedSocket) {
			console.log(mainProcessMessage + 'Connected to server!'.info);
			//we have connected to the server
			//load the grabStations html page, to allow the user to choose which station they want to launch
			var mainWindow;
			if(openBrowsers.length == 0){
				mainWindow = openLoadingWindow();
			}else{
				mainWindow = openBrowsers[0];
			}
			mainWindow.loadURL('file://' + __dirname + "/public/grabStations.html");
		});

		socket.on('disconnect',function(data){
			if(interstellarAppServer != undefined){
				interstellarAppServer.close();
				interstellarAppServer = undefined;
			}
			menuHasBeenDownloaded = false;
			stationHasBeenDownloaded = false;
			console.log(mainProcessMessage + 'Disconnected from server!'.toUpperCase().error.bold);
			if(isCoreStation){
				openLoadingWindow(function(window){
					for(var i = 0;i < openBrowsers.length;i++){
						openBrowsers[i].close();
					}
					openBrowsers = [];
					openBrowsers.push(window);
				});
			}else{
				openStationOfflineView(function(window){
					for(var i = 0;i < openBrowsers.length;i++){
						openBrowsers[i].close();
					}
					openBrowsers = [];
					openBrowsers.push(window);
				});
			}
			removeAllEmitterLoadingListeners(socket);
			jsonfile.readFile(startupPrefsFileLocation, function(err, obj) {
				obj.instantLoad = true;
				jsonfile.writeFile(startupPrefsFileLocation, obj, function (err) {
					if(err){
						console.log(mainProcessMessage + err.toString().error);
					}else{
						console.log(mainProcessMessage + "Will instantly launch (no station select screen) upon reload...".info.bold);
					}
				});
			});
			socket.on("connect",function(){
				console.log(mainProcessMessage + "CONNECTED TO SERVER".info.bold);
				console.log(mainProcessMessage + "relaunching application....".info);
				restartInterstellarApp();
			})
		});

		//when we recieve the cards (this should be sent automatically, after the server detects a connection)
		socket.on('recieveCards',function(data){
			//set the cardManager's cards to the data
			cardManager.setCards(data);
			//set our cards to the cards recieved from the server
			cards = data;
			//cycle through each card and ask the server to send the actual card files
			for(var i = 0; i < data.length;i++){
				socket.emit('getCardFiles',data[i]);
			}
		});
		//when we recieve the actual card files, (data is a buffer stream of the zipped files)
		socket.on("recieveMenu",function(data){
			console.log(mainProcessMessage + "Menu recieved... downloading...");
			cardManager.downloadCard(data,function(menuPath){
				menuHasBeenDownloaded = true;
				console.log(mainProcessMessage + "Menu recieved and downloaded!".info);
				initScreens(socket);
				startStation();
			})
		});

		socket.on('recieveCardFiles',function(data){
			//tell the cardManager to download the card, passing it the buffer stream and a callback function
			cardManager.downloadCard(data,function(path){
				//after the server has finished downloading that card
				//remember which cards are stored where on the file system (store this in a JSON object called cardLocations)
				cardLocations.push({"name" : data.cardName,"path" : path});
				//launch the station
				//
				// IMPORTANT!  The station will automatically launch after the first card is recieved, and will not
				// wait for the other cards to finish loading (they should within milliseconds, however)
				//
				// THIS HAS BEEN CHANGED IN 1.1.4!  THE STATION WILL NO LONGER LAUNCH UNLESS IT'S BEEN COMPLETLY DOWNLOADED!
				//
				console.log(mainProcessMessage + "LAUNCHING " + station.toString().toUpperCase());
				//create a server listening on port specified port
				interstellarAppServer = interstellarApp.listen(portNumber, function () {
					//server started
					console.log(mainProcessMessage + station + "Started!  Listening on port " + portNumber);
					//load the actual page

					//init the station manager, passing ipc (see function init in station manager) and the window

					console.log(allStations);
					for(var i = 0;i < allStations.length; i++){
						var message;
						if(allStations[i].stationInfo.name == station){
							if(allStations[i].stationType == "station"){
								//bridge station
								message = "Entering Bridge Station Mode";
								console.log(mainProcessMessage + message.info);
								console.log(mainProcessMessage + "Cards are " + cards);
								currentScreen = cards[0];
								message = "Current screen set to: " + currentScreen;
								console.log(mainProcessMessage + message.blue);
								socket.emit("getMenu");
							}else{
								message = "Entering Core Station Mode";
								console.log(mainProcessMessage + message.info);
								//core station
								fs.readFile(__dirname + "/coreViewTemplate.html", {encoding: 'utf-8'}, function(err,data){

									if (!err){
										var prefixAndSuffixOfHTMLFile = data.split("~*~")
										var newHTML = prefixAndSuffixOfHTMLFile[0];
										console.log(mainProcessMessage + "cards are:\n" + cards);
										for(var i = 0;i < cards.length;i++){
											var cardPath = "";
											for(var j = 0; j < cardLocations.length;j++){
												if(cardLocations[j].name = cards[i]){
													cardPath = cardLocations[j].name;
												}
											}
											console.log(mainProcessMessage + cardPath);
											newHTML += "<% include " + cardFolderLocation + "/" + cardPath + "/cards/" + cardPath + "/client.ejs %>";
										}
										newHTML += prefixAndSuffixOfHTMLFile[1];
										fs.writeFile(screenFolderLocation + "/coreView.ejs", newHTML, function(err) {
											if(err) {
												return console.log(err.err);
											}
											console.log(mainProcessMessage + "coreView.ejs generated...");
											stationBrowser = new BrowserWindow({
												width: 800,
												height: 480,
												kiosk: false,
												backgroundColor: 'black'
											});
											isCoreStation = true;
											closeAllWindows();
											openBrowsers.push(stationBrowser);
											stationBrowser.setFullScreen(true);
											presetManager.init(ipc,presetsFileLocation,stationBrowser);
											stationManager.init(ipc,stationBrowser, socket,changeStationScreen,getAdminPassword);
											stationBrowser.loadURL("http://localhost:" + portNumber + "/core");
										}); 
									}else{
										console.log(mainProcessMessage + "[" + "ERROR".error + "] " + err.err);
									}
								});
							}
							break;
						}
					}
				});
			})
		})
				//if a card ever requests a resource from it's folder
				interstellarApp.get("/resource", function(req, res){
					//first find which card it is
					for(var i = 0; i < cardLocations.length;i++){
						//if the card name is the same as the one in the cardLocations JSON object
						if(req.query.screen){
							var screen =  req.query.screen.replace(" ", "\ ");
							console.log(mainProcessMessage + "LOADING RESOURCE " + req.query.screen + "/" + req.query.path.toString());
							res.sendFile(cardFolderLocation + "/" + screen + "/cards/" + screen + "/" + req.query.path);
						}else{
							if(cardLocations[i].name = currentScreen){
								var screen =  currentScreen.replace(" ", "\ ");
								//we know this is the right card, lets console.log what we are loading
								console.log(mainProcessMessage + "LOADING RESOURCE " + currentScreen + "/" + req.query.path.toString());
								res.sendFile(cardFolderLocation + "/" + screen + "/cards/" + screen + "/" + req.query.path);
							}
						}
					}
				});
				interstellarApp.get("/soundEffects",function(req,res){
					console.log(mainProcessMessage + "Playing sound effect '" + req.query.soundEffect + "'");
					res.sendFile(__dirname + "/public/soundEffects/" + req.query.soundEffect);
				});
				interstellarApp.get("/InterstellarLibraries",function(req,res){
					res.sendFile(__dirname + "/interstellarLibraries.js");
				})
				interstellarApp.get("/InterstellarUI",function(req,res){
					res.sendFile(__dirname + "/interstellarUI.js");
				})
				interstellarApp.get("/arrow",function(req,res){
					res.sendFile(__dirname + "/public/arrow.png");
				})
				interstellarApp.get("/ship",function(req,res){
					console.log(mainProcessMessage + "Requesting file '" + req.query.file.toString().input + "'");
					res.sendFile(__dirname + "/public/ship/" + req.query.file);
				});
				interstellarApp.get("/container1",function(req,res){
					console.log(mainProcessMessage + "Loading container1 GUI...");
					res.sendFile(__dirname + container1GUILocation);
				})
				interstellarApp.get("/container2",function(req,res){
					console.log(mainProcessMessage + "Loading container2 GUI...");
					res.sendFile(__dirname + container2GUILocation);
				})
				interstellarApp.get("/container3",function(req,res){
					console.log(mainProcessMessage + "Loading container3 GUI...");
					res.sendFile(__dirname + container3GUILocation);
				})
				interstellarApp.get("/container4",function(req,res){
					console.log(mainProcessMessage + "Loading container4 GUI...");
					res.sendFile(__dirname + container4GUILocation);
				})
				interstellarApp.get("/background1",function(req,res){
					console.log(mainProcessMessage + "Loading background1...");
					res.sendFile(__dirname + background1Location);
				})
				interstellarApp.get("/background2",function(req,res){
					console.log(mainProcessMessage + "Loading background2...");
					res.sendFile(__dirname + background2Location);
				})
				interstellarApp.get("/jquery",function(req,res){
					console.log(mainProcessMessage + "loading jquery");
					res.sendFile(__dirname + "/node_modules/jquery/dist/jquery.min.js");
				})
				interstellarApp.get("/stationThemes", function(req, res){
					res.sendFile(__dirname + "/stationThemes.css");
				});
				interstellarApp.get("/randomBeep", function(req, res){
					var randomNumber = Math.random() * (computerBeeps.length - 1);
					randomNumber = Math.round(randomNumber);
					console.log(mainProcessMessage + "Playing beep '" + computerBeeps[randomNumber] + "' (index " + randomNumber + ")")
					res.sendFile(computerBeepFolder + "/" + computerBeeps[randomNumber]);
				});
				interstellarApp.get("/core", function(req, res){
					var path = screenFolderLocation + "/coreView.ejs";
					var escapedPath = path.replace(/(\s)/, "\\ ");
					console.log(mainProcessMessage + "sending coreView.ejs at path '" + escapedPath.input + "'")
					res.render(escapedPath);
				});
				interstellarApp.get("/stationScreen", function(req, res){
					for(var i = 0; i < cards.length;i++){
						if(cards[i] == currentScreen){
							res.send(stationScreens[i]);
						}
					}
				});
				interstellarApp.get("/coreThemes", function(req, res){
					res.sendFile(__dirname + "/coreThemes.css");
				});
				interstellarApp.get("/threeJS", function(req, res){
					res.sendFile(__dirname + "/modules/three.min.js");
				});

				interstellarApp.get("/card", function(req, res){
					for(var i = 0; i < cards.length;i++){
						console.log(mainProcessMessage + cards[i] + " is found at index " + i + " of " + (cards.length-1) + " possible indexes");
						if(cards[i] == req.query.card){
							if(req.query.card != "menu"){
								currentScreen = cards[i];
								var consoleMessage = "'" + cards[i] + "' screen";
								var path = screenFolderLocation + "/" + cards[i] + ".ejs";
								console.log(mainProcessMessage + station + " changed screens to " + consoleMessage.bold + "\nat path '" + path + "'");
								res.render(path);
							}else{
								console.log(mainProcessMessage + "rendering menu....".blue);
								res.render(screenFolderLocation + "/client.ejs",{"screens" : cards});
							}
							return;
						}
					}
					console.log(mainProcessMessage + req.query.card + " NOT FOUND".error);
				});
				socket.on('stationsSent',function(stations){
					allStations = stations;
					stationServerSelectWindow = new BrowserWindow({
						width: 450,
						height: 200,
						frame: true
					});
					stationServerSelectWindow.setResizable(false);
					stationServerSelectWindow.loadURL('file://' + __dirname + "/stationServerSelect.html");
					closeAllWindows();
					openBrowsers.push(stationServerSelectWindow);
					stationServerSelectWindow.webContents.send('stationList',stations);

					ipc.on('autoStartTimer',function(event,data){
						if(instantLaunch){
							event.sender.send("autoLaunchTimeRecieved",0);
						}else if(doAutoLaunch){
							event.sender.send("autoLaunchTimeRecieved",autoLaunchTime);
						}else{
							event.sender.send("autoLaunchTimeRecieved",null);
						}
					})
					ipc.on("getFileNamesInFolder",function(event,data){
						var path = cardFolderLocation + "/" + data.screen + "/cards/" + data.screen + "/" + data.path;
						fs.readdir(path, function(err, items) {
							for (var i=0; i<items.length; i++) {
								event.sender.send("recieveFileNamesInFolder",items);
							}
						});
					});
					ipc.on('setAdminPassword', function(event, data){
						setAdminPassword(data,function(){
							event.sender.send("adminPasswordDidWrite");
						});
					});
					ipc.on('getAdminPassword', function(event, data){
						getAdminPassword(function(passwordFound){
							event.sender.send("recieveAdminPassword",passwordFound);
						});
					});
					ipc.on('grabStations', function(event, data){
						event.sender.send('stationsSent', stations);
						jsonfile.readFile(startupPrefsFileLocation, function(err, obj) {
							if(err){
								console.log(err.toString().error);
							}else{
								event.sender.send('savedStartupStation',obj.savedStation);
								event.sender.send('savedServerAddress',obj.serverAddress);
								event.sender.send('savedServerPort',obj.serverPort);
							}
						});
					});
					ipc.on("stationPresetDidChange",function(event,data){
						console.log(mainProcessMessage + "Preset station did change, '" + data + "'");
						jsonfile.readFile(startupPrefsFileLocation, function(err, obj) {
							obj.savedStation = data;
							jsonfile.writeFile(startupPrefsFileLocation, obj, function (err) {
								if(err){
									console.log(mainProcessMessage + err.toString().error);
								}else{
									console.log(mainProcessMessage + "write to userPrefs.json successful".info);
								}
							});
						});
					});
				});
				ipc.on('loginStation', function(event, data){
		   	//log that we launched the station
		   	station = data;
		   	stationManager.setStation(data);
		   	console.log(mainProcessMessage + data + " launched.....");
		    //make a new browser window for the loading screen
		    loadingScreen = new BrowserWindow({
		    	width: 400,
		    	height: 400,
		    	frame: false,
		    	transparent: true
		    });
			//load the loading screen on the browser window
			loadingScreen.loadURL('file://' + __dirname + "/public/loadingStation.html");
		    //close the stationServerSelectWindow, so the user doesn't try to load another station
		    closeAllWindows();
		    openBrowsers.push(loadingScreen);
		   	//now we need to ask the server what screens we have, and download those all now
		   	socket.emit('getCards',data);
		   });

				function closeAllWindows(){
					for(var i = 0;i < openBrowsers.length;i++){
						openBrowsers[i].close();
					}
					openBrowsers = [];
				}

				function changeCurrentScreen(screen){

				}
				function changeStationScreen(screenName){
					
				}


				function initScreens(socket){
					fs.readFile(__dirname + "/StationViewTemplate.html", {encoding: 'utf-8'}, function(err,data){
						for(var j = 0; j < cards.length;j++){
							if (!err){
								var prefixAndSuffixOfHTMLFile = data.split("~*~");
								var newHTML = prefixAndSuffixOfHTMLFile[0];

								newHTML += "<% var screens = [";
								for(var i = 0; i < cards.length;i++){
									newHTML += "\"" + cards[i] + "\"";
									if(i != cards.length - 1){
										newHTML += ",";
									}
								}
								newHTML += "] %>";
							//newHTML += "<% card %>";
							var path =  cardFolderLocation + "/" + cards[j] + "/cards/" + cards[j] + "/client.ejs";
							newHTML += "<% include " + cardFolderLocation + "/menu/cards/menu/client.ejs %>";
							newHTML += "<% include " + path + " %>";

							newHTML += prefixAndSuffixOfHTMLFile[1];
							stationScreens[j] = newHTML;
							console.log(mainProcessMessage + cards[j] + " Screen Generated");

							fs.writeFile(screenFolderLocation + "/" + cards[j] + ".ejs", newHTML, function(err) {
								downloadedCards++;
								if(err) {
									return console.log(err.err);
								}
								console.log(mainProcessMessage + "Card Generated!".info);
								removeAllEmitterLoadingListeners(socket);
								console.log(mainProcessMessage + downloadedCards + "/" + cards.length + " cards downloaded...");
								if(downloadedCards == cards.length){
									//create a new browser window
									stationBrowser = new BrowserWindow({
										width: 800,
										height: 480,
										kiosk: false,
										backgroundColor: '#2e2c29'
									});
									isCoreStation = false;
									stationManager.init(ipc,stationBrowser, socket,changeStationScreen);
									serverFunctionManager.init(ipc,stationBrowser,socket,io,colors,changeStationScreen,station);
									var cardPaths = cardManager.getCardPaths();
									console.log(mainProcessMessage + "loading server scripts...");
									for(var i = 0; i < cardPaths.length;i++){
										serverFunctionManager.takeServerScriptsInFolder(cardFolderLocation + "/" + cardPaths[i] + "/cards/" + cardPaths[i] + "/serverScripts/");
									}
									//serverFunctionManager.takeServerScriptsInFolder(__dirname + "/screens");
									//set the browser to full screen
									stationBrowser.setFullScreen(true);

									//close the loading screen, since we are done with it.
									closeAllWindows();
									openBrowsers.push(stationBrowser);
									var consoleMessage = "LOADING " + cards[0] + " SCREEN!".bold;
									console.log(mainProcessMessage + consoleMessage.bold);
									stationHasBeenDownloaded = true;
									startStation();
								}
							});
						}
					}
				});
				}

				function startStation(){
					if(menuHasBeenDownloaded == true && stationHasBeenDownloaded == true){
						stationBrowser.loadURL("http://localhost:" + portNumber + "/card?card=" + cards[0]);
						console.log(mainProcessMessage + "LOADING FIRST CARD NOW".bold);
					}else{
						if(menuHasBeenDownloaded == true){
							console.log(mainProcessMessage + "Waiting to download station cards before launching...".blue);
						}else{
							console.log(mainProcessMessage + "Waiting to download menu before launching...".blue);
						}
					}	
				}

				ipc.on("setServerAddress",function(event,newAddress){
					jsonfile.readFile(startupPrefsFileLocation, function(err, obj) {
						obj.serverAddress = newAddress;
						jsonfile.writeFile(startupPrefsFileLocation, obj, function (err) {
							if(err){
								console.log(mainProcessMessage + err.toString().error);
							}else{
								event.sender.send("serverAddressDidSet");
								console.log(mainProcessMessage + "Server Address Successfully Set To " + newAddress);
							}
						});
					});
				});
				ipc.on("setServerPort",function(event,newPort){
					jsonfile.readFile(startupPrefsFileLocation, function(err, obj) {
						obj.serverPort = newPort;
						jsonfile.writeFile(startupPrefsFileLocation, obj, function (err) {
							if(err){
								console.log(mainProcessMessage + err.toString().error);
							}else{
								event.sender.send("serverPortDidSet");
								console.log(mainProcessMessage + "Server Port Successfully Set To " + newPort);
							}
						});
					});
				});

				ipc.on("resetApplication",function(event){
					restartInterstellarApp();
				});

				function openLoadingWindow(callback){
					var mainWindow = new BrowserWindow({
						width: 400,
						height: 400,
						frame: false,
						transparent: true
					});
				//remove the menu
				mainWindow.setMenu(null);
				//don't allow the user to resize
				mainWindow.setResizable(false);
				//load the actual loading screen html
				mainWindow.loadURL('file://' + __dirname + "/public/findingServer.html");
				callback(mainWindow);
			}
			function openStationOfflineView(callback){
				var mainWindow = new BrowserWindow({
				});
				//load the screen that tells the user not to touch anything
				mainWindow.setFullScreen(true);

				mainWindow.loadURL('file://' + __dirname + "/public/stationOfflineView.html");
				callback(mainWindow);
			}

			function removeAllEmitterLoadingListeners(socket){
				socket.removeListener('grabStations');
				socket.removeListener('recieveCardFiles');
				socket.removeListener('recieveCards');
				socket.removeListener('stationsSent');
				socket.removeListener('connect');
			}

			function restartInterstellarApp(){
				console.log(mainProcessMessage + "Command given to restart application at ".bold + new Date());
				var exec = require('child_process').exec
			exec(process.argv.join(' ')) // execute the command that was used to run the app
			app.quit() // quit the current app
		}

		function setAdminPassword(password,callback){
			var formatedPassword = encrpt(password,dateInstalledByLog);
			jsonfile.readFile(startupPrefsFileLocation, function(err, obj) {
				obj.password = formatedPassword;
				jsonfile.writeFile(startupPrefsFileLocation, obj, function (err) {
					if(err){
						console.log(mainProcessMessage + err.toString().error);
					}else{
						console.log(mainProcessMessage + "successful wrote admin password".info);
						if(callback != undefined){
							callback();
						}
					}
				});
			});
		}

		function getAdminPassword(callback){
			jsonfile.readFile(startupPrefsFileLocation, function(err, obj) {
				callback(decrypt(obj.password,obj.dateInstalled))
			});
		}

		function encrpt(message,key){
			var cypherMessage = "";
			var keyIndex = 0;
			for(var i = 0;i < message.length;i++){
				if(keyIndex == key.length - 1){
					keyIndex = -1;
				}
				keyIndex++;
				cypherMessage += String.fromCharCode(modifyToBounds(message[i].charCodeAt(0) + key[keyIndex].charCodeAt(0),32,300,1));
			}
			return cypherMessage;
		}

		function decrypt(message,key){
			var cypherMessage = "";
			var keyIndex = 0;
			for(var i = 0;i < message.length;i++){
				if(keyIndex == key.length - 1){
					keyIndex = -1;
				}
				keyIndex++;
				cypherMessage += String.fromCharCode(modifyToBounds(message[i].charCodeAt(0) - key[keyIndex].charCodeAt(0),32,300,1));
			}
			return cypherMessage;
		}

			function modifyToBounds(number,min,max,exemption){ //bounds number to the specified min and max, but not by capping, by looping.
				if(arguments.length > 3){
					if(number == exemption){
						return number;
					}
				}
				if(number >= min && number <= max){
					return number;
				}else if(number < min){
					var placesOff = Math.abs(min - number);
					return modifyToBounds(max - placesOff,min,max);
				}else{
					var placesOff = number - max;
					return modifyToBounds(min + placesOff,min,max);
				}
			}
		});
});
}
