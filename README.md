# Interstellar-Client
The client to the interstellar framework, designed to work on any operating system, with any screen size, with any specs

# Build Instructions
Building the client can be very frustrating.  Electron and native node packages don't always play along very nicely.  Here is what you need to do.

<b>Building</b>

1) npm install
2) npm install electron -g
3) npm install electron-rebuild -g
4) npm install node-pre-gyp -g
5) npm install node-gyp -g
6) ensure you have python 2.x installed
7) ensure you have the .NET framework installed
8) electron-rebuild --version=1.4.13

<b>Launching</b>

1) electron index.js (optional, port number) (optional, server IP address) (optional, server port)
<br /><i><b>Example:</b> 'electron index.js 4050 192.168.1.110 3000'</i>
<br />This will run Interstellar locally, on port 4050, and look for the server at 192.168.1.110:3000
