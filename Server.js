import http from "http";
import express from "express";
import { getCLAs } from "./Utility";
import PureMethod from "./PureFunction";
import SqlConnect from "./SqlConnect";
import AccessConnect from "./ConnectAccess";
import {Config} from './Config'
let context = Config;
context = getCLAs(context);
let dbConnection;
if(context && context.dbName=="SQL"){
    dbConnection=new SqlConnect(context);
}else{
    dbConnection=new AccessConnect(context);
}
PureMethod.runPunchClient(dbConnection,context);
// let server = http.Server(app);
// server.listen(PORT, () => console.log(`>> ManazeServer is now running on http://localhost:${PORT}`))


