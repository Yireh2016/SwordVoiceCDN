const express = require("express");
const cdn = require("./controllers/cdn");

const server = express();

//static files
server.use(express.static("uploads"));

//routes
server.use("/cdn", cdn);

server.listen(3000);
console.log("listening");
