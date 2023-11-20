(1) Open Google Chrome or Mozila Firefox. Google Chrome would be preferred.
(2) Download node js framework from https://nodejs.org/en/.Download the xampp server from https://www.apachefriends.org/download.html.
(3) Install both of them. Set the environment variable. In such cases, the path would get set automatically.
(4) Open xampp and start the xampp server. Click on start for Apache and MySql. Then click on admin from mySql. This will open phpmyadmin (database).
(5) Download the zip file of the code. Consequently, open the visual studio code and open the folder consiting the code.
(6) Once the code is opened you have to make sure the files are in correct folder before begin. The file app.js, conn.js, package-lock.json, package.json should be in root file. Else other files should be in the views folder.
(7) In the phpmyadmin, import the mysql file.
(8) First of all before starting the code execution we have to install the dependencies. Open terminal in the visual studio code and type "npm i". It will install the node_modules folder.
(9) Type "nodemon app.js". It will get connected to database
(10) Open google chrome and paste this url "http://localhost:3000/"
