const express = require("express");
const cdn = require("./api/cdn");
const cors = require("cors");
const compression = require("compression");
require("dotenv").config();

const server = express();

//midlewares
server.use(compression());
server.use(cors()); //cors enable only dev

server.use(express.json({ limit: "50mb", extended: true })); //body parser

server.use(express.static("uploads/")); //static files

//routes
server.use("/cdn", cdn);

server.listen(3000);
console.log("listening on 3000");
