import {syncAllData} from "./PunchClientMethod";

const  runPunchClient=async (db,config)=>{
   console.log("runPunchClient called>>>>>");
   return syncPunchData(db,config)

}
const  syncPunchData=async (db,config)=>{
    // console.log("runPunchClient called>>>>>");
   let  sleepinminutes=config.sleepinminutes || 60;
    sleepinminutes=sleepinminutes*1000*60;
     console.log("sleepinminutes>>>>"+sleepinminutes)
    return syncAllData(db,config).catch(e=>{
        console.log("Error is 14 >>>>>"+e.stack)
    }).then(()=>{
        setInterval(function() {
             return syncAllData(db,config).catch(e=>{
                 console.log("Error is 17>>>>>"+e.stack)
             })
         }, sleepinminutes);
    })



}

const PureMethod={
    runPunchClient
}


export default PureMethod;