const express = require("express");
const cdn = require("./api/cdn");
var cors = require("cors");

const server = express();

//midlewares

server.use(cors());

//static files
server.use(express.static("uploads/"));

//routes
server.use("/cdn", cdn);

server.listen(3000);
console.log("listening on 3000");
