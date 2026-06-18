import express from "express"
import app from "./src/app.js"
import db from "./config/Databse.js"
import cache from "./config/cache.js"
import cors from "cors"
import morgan from "morgan";
import cookieParser from "cookie-parser";
import http from "http";
import {connectToSocket} from "./src/sokets/soketsio.js";
import dotenv from "dotenv";

dotenv.config();

const httpServer = http.createServer(app);
db()

const port = 3030;
connectToSocket(httpServer);// called the socket connection function and passed the http server to it
httpServer.listen(port,()=>{
    console.log(`Server is listening to the port${port}`)

});