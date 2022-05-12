import { executeService, compareTwoDatesEquals, compareTwoDatesLessEquals, getZeroTimeDate } from "./Utility";
import moment from "moment";
const copyFileSync = require('fs-copy-file-sync');
import fs from "fs";
import { Console } from "console";
let ENTRY = "538888bd2d345c0200e223c5";
let EXIT = "538888bd2d345c0200e223ca";

global.console.singleLog = function (log) {
    // console.log(log);
}

export const syncAllData = async (connectdb, config) => {
    console.singleLog("syncAllData called >>>>>");
    let record_break_time = config.record_break_time;
    let record_batch_size = config.record_batch_size;
    if (!record_break_time) {
        record_break_time = 180;
    }
    if (!record_batch_size) {
        record_batch_size = 20;
    }
    if (config && config.token) {
        let lastUpdateInfoData = await getLastRunServerInfo(config);
        copyFileSync(config.punchSource, config.punchDestination);
        lastUpdateInfoData = lastUpdateInfoData.result && JSON.parse(lastUpdateInfoData.result) || {};
        let lastUpdateInfo = lastUpdateInfoData;
        // let lastUpdateInfo = lastUpdateInfoData && lastUpdateInfoData.response && lastUpdateInfoData.response.result || "void 0"
        console.singleLog("Last update information recieved from server: " + JSON.stringify(lastUpdateInfoData));
        if (lastUpdateInfo && Object.keys(lastUpdateInfo).length > 0) {
            let currentDate = new Date();
            let data = lastUpdateInfo;
            let lastUpdateDateStr = data.date || null;
            let lastRunDateStr = data.last_run || null;
            let lastUpdateDate = null;
            let lastRunDate = null;
            let lastUpdateDateNext = null;
            if (lastUpdateDateStr == null) {
                lastUpdateDate = getZeroTimeDate(new Date());
                lastUpdateDateNext = getZeroTimeDate(new Date());
                lastUpdateDateNext.setDate(lastUpdateDate.getDate() + 1)
            } else {
                lastUpdateDate = getZeroTimeDate(new Date(lastUpdateDateStr));
                lastUpdateDateNext = getZeroTimeDate(new Date(lastUpdateDateStr));
                lastUpdateDateNext.setDate(lastUpdateDate.getDate() + 1)
            }
            if (!lastRunDateStr) {
                lastRunDate = null;
            } else {
                lastRunDate = new Date(lastRunDateStr);
            }
            let markComplete = true;
            let cardList = await getAllCard(connectdb);
            // console.singleLog("cardList>>>>>>" + JSON.stringify(cardList))
            console.singleLog("cardList length===>>>>>>" + cardList.length)
            console.singleLog("lastUpdateDate>>>>>>" + JSON.stringify(lastUpdateDate))
            console.singleLog("currentDate>>>>>>" + JSON.stringify(currentDate))
            if (cardList && cardList.length > 0) {
                while (compareTwoDatesLessEquals(lastUpdateDate, currentDate)) {
                    // let punchObservationDateStr=lastUpdateDate.getFullYear() + "-" + (lastUpdateDate.getMonth() + 1) + "-" + lastUpdateDate.getDate();
                    let punchObservationDateStr = lastUpdateDate;
                    let punchObservationDateNext = lastUpdateDateNext;
                    if (compareTwoDatesEquals(lastUpdateDate, currentDate)) {
                        markComplete = false;
                    }
                    await readAndUpdatePunchDataOfAllCardsOnServer(cardList, connectdb, punchObservationDateStr, markComplete, punchObservationDateNext, record_break_time, record_batch_size, lastRunDate, config);
                    lastUpdateDate.setUTCDate(lastUpdateDate.getUTCDate() + 1)
                    lastUpdateDateNext.setUTCDate(lastUpdateDateNext.getUTCDate() + 1)

                }
            }


        } else {
            console.singleLog("---------------------------------------------");
            console.singleLog("No last update info found...");
            console.singleLog("---------------------------------------------");
        }
    } else {
        console.singleLog("---------------------------------------------");
        console.singleLog("No token info found...");
        console.singleLog("---------------------------------------------");
    }
}

let copyFileToDestination = async (source, destination) => {
    fs.renameSync(source, destination, function (err) {
        if (err) {
            console.singleLog(err);
        } else {
            console.singleLog("move file")
        }
    });
}



let readAndUpdatePunchDataOfAllCardsOnServer = async (cardList, connectdb, lastUpdatedOn, markComplete, punchObservationDateNext, record_break_time, record_batch_size, lastRunDate, config) => {
    if (!connectdb) {
        throw new Error("Data instance not found");
    }
    let cardCount = cardList && cardList.length > 0 && cardList.length || 0;
    console.singleLog("cardList >> << ============ count =============== [" + cardCount + "]");
    let counter = 0;
    let updates = {};
    let allAttendanceUpdates = [];
    let recordBreakTime = Number(record_break_time);
    let recordBatchSize = Number(record_batch_size);
    for (let c2 = 0; c2 < cardList.length; c2++) {
        counter++;
        let employeeData = cardList[c2];
        let employeePunchDetailsObject = {};
        let employeeId = employeeData.EMPNAME;
        let applanePunchNumber = employeeData.PAYCODE;
        employeePunchDetailsObject["applanePunchNumber"] = applanePunchNumber;
        employeePunchDetailsObject["name"] = employeeId;
        let inOutDate = (moment(lastUpdatedOn).format("YYYY-MM-DD"));
        // console.log("inOutDateinOutDateinOutDateinOutDateinOutDateinOutDateinOutDate " + inOutDate)
        let query = `SELECT * FROM MachineRawPunch where PAYCODE='${applanePunchNumber}' AND OFFICEPUNCH>=#${lastUpdatedOn.toLocaleDateString('en-IN')} 00:00:00 AM# AND OFFICEPUNCH<=#${lastUpdatedOn.toLocaleDateString('en-IN')} 11:59:59 PM# ORDER BY OFFICEPUNCH ASC`;
        // let query = "SELECT IODate, IOTime, IOStatus, IOGateName FROM IOData where CardNo=" + applanePunchNumber +" And DATE(IODate) = '"+dateFilter+"'";
        let punchDateResultSet = await connectdb.ExecuteQuery(query);
        console.log("Result ----------------------------------------------------------------------- \n")
        // console.log("punchDateResultSet>>>>>"+JSON.stringify(punchDateResultSet))
        let record = [];
        if (punchDateResultSet && punchDateResultSet.length > 0) {
            let inDateTime = punchDateResultSet[0].OFFICEPUNCH;
            let outDateTime = punchDateResultSet[punchDateResultSet.length - 1].OFFICEPUNCH;
            let inDate = (moment(inDateTime).format("YYYY-MM-DD"));
            let inTime = (moment(inDateTime).format('HH:mm:ss'));
            let outDate = (moment(outDateTime).format("YYYY-MM-DD"));
            let outTime = (moment(outDateTime).format("HH:mm:ss"));
            let actualTime = (moment.utc(moment(outDateTime).diff(moment(inDateTime)))).format("HH:mm:ss");
            record.push({
                inDate,
                outDate,
                inTime,
                outTime,
                actualTime,
                payCode: punchDateResultSet[0].PAYCODE,
            });
        }


        if (record.length > 0) {
            employeePunchDetailsObject.punch_data = record;
        } else {
            employeePunchDetailsObject = null;
        }
        console.log("employeePunchDetailsObject", employeePunchDetailsObject)
        if (employeePunchDetailsObject != null) {
            allAttendanceUpdates.push(employeePunchDetailsObject);
            console.log("allattup >> " + allAttendanceUpdates + " " + allAttendanceUpdates.length + " > " + recordBatchSize)
            if (allAttendanceUpdates && allAttendanceUpdates.length == recordBatchSize) {
                updates.alldata = allAttendanceUpdates;
                // console.singleLog("punch data updates" + JSON.stringify(allAttendanceUpdates));
                console.log("punch data updates length>>>>>" + allAttendanceUpdates.length);
                await updatePunchData(config, updates)
                allAttendanceUpdates = [];
                recordBreakTime = recordBreakTime * 1000;
                console.singleLog("recordBreakTime >> >> " + recordBreakTime);
                // Thread.sleep(recordBreakTime * 1000);
                // let myVar = setTimeout(()=>{
                //      console.singleLog("break taken")
                //  }, recordBreakTime);
            }
        }
        console.log("counter >> " + counter);
        console.log("cardList.size() >> " + cardList.length);
        if (counter == cardList.length) {
            let punchDateHistoryUpdates = {};
            punchDateHistoryUpdates.location = { _id: config.branch_id };
            punchDateHistoryUpdates.date = inOutDate;
            console.singleLog("punch date history updates >> " + JSON.stringify(punchDateHistoryUpdates));
            // console.singleLog("punch data updates" + JSON.stringify(allAttendanceUpdates));
            console.log("punch data updates length>>>>>" + allAttendanceUpdates.length);
            await updatePunchDateHistory(config, { updates: punchDateHistoryUpdates });
            console.log("allattup >> " + allAttendanceUpdates + "  " + recordBatchSize)
            if (allAttendanceUpdates && allAttendanceUpdates.length > 0 && allAttendanceUpdates.length <= recordBatchSize) {
                console.log("****************** Inside update Punch if ***********************")
                updates.alldata = allAttendanceUpdates;
                await updatePunchData(config, updates)
                allAttendanceUpdates = [];
                console.singleLog("successfully updated>>>>>")
                console.singleLog("Sleep for " + config.sleepinminutes)

            }

        }
    }
};

let getAllCard = async (connectdb) => {

    //let cardResultSet1 = await connectdb.ExecuteQuery(`"select * from HolderData where GetCardFlag=1    where PAYCODE IN ('24', '8', '15', '19', '21')"`);
    let cardResultSet = await connectdb.ExecuteQuery("select PAYCODE, EMPNAME from TblEmployee");
    console.log("cardResultSet >>>>> " + JSON.stringify(cardResultSet));
    return cardResultSet

};

let getLastRunServerInfo = async (config) => {
    let service = {
        // hostname: "192.168.100.92",
        // port: "5000",
        host: config.serverurl,
        path: "/escape/getlastupdateinfo",
        method: "POST"
    }
    let params = {
        id: config.serverlastread,
        paramValue: { filter: { location_id: { _id: config.branch_id } } },
        "token": config.token
    }
    let options = {
        skipQS: true,
        headers: {
            "Content-Type": "application/json"
        }
    }
    let lastUpdateInfoData = await executeService({ service, params, options });
    return lastUpdateInfoData

};

let updatePunchDateHistory = async (config, updata) => {
    // console.log("========updatePunchDateHistory " , updata)
    let service = {
        // hostname: "192.168.100.92",
        // port: "5000",
        host: config.serverurl,
        path: "/escape/setlastpunchdate",
        method: "POST"
    }
    let params = {
        id: config.serveruploadpunchhistory,
        paramValue: updata,
        "token": config.token
    }
    let options = {
        skipQS: true,
        headers: {
            "Content-Type": "application/json"
        }
    }
    let lastUpdateInfoData = await executeService({ service, params, options });
    return lastUpdateInfoData

};

let updatePunchData = async (config, updata) => {
    console.log("======================= sending request =================")
    let service = {
        // hostname: "192.168.100.92",
        // port: "5000",
        host: config.serverurl,
        path: "/escape/markpunchingdata",
        method: "POST"
    }
    let params = {
        id: config.serverpunchupload,
        paramValue: updata,
        "token": config.token
    }
    let options = {
        skipQS: true,
        headers: {
            "Content-Type": "application/json"
        }
    }
    console.log("UPDATEPUNCHDATA~~~~~~~~~~~~~~~~~>>>>>>> ")
    let lastUpdateInfoData = await executeService({ service, params, options });
    return lastUpdateInfoData;
};

