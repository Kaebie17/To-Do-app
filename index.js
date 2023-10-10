import express from "express";
import path, {dirname} from "path";
import { fileURLToPath } from "url";
import * as fs from 'node:fs';
import { readFile } from 'node:fs';
import bodyParser from "body-parser";
import { existsSync } from 'node:fs';
import { count } from "console";
import axios from "axios";
import PushNotifications from "@pusher/push-notifications-server";
import { isUtf8 } from "buffer";
import mongoose from "mongoose";
import http from "http";

mongoose.connect("mongodb://127.0.0.1:27017/TaskDB");

const taskSchema = new mongoose.Schema({
    _id:Number,
    ip: String,
    titleArr : Array,
    currDateArr:Array,
    currTimeArr: Array,
    taskDescArr: Array,
    taskSubArr: Array,
    subTaskArr: Array,
    subTaskCount: Number,
    url: String,
    today: Date,
    firstname : String,
    loginInfo: Array
})

const subTaskSchema = new mongoose.Schema({
    _id: Number,
    subTaskEntry : Array
})

const Task = mongoose.model("Task", taskSchema);
const Sub_Task = mongoose.model("Sub_Task", subTaskSchema);

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
var ip = "";
var idCount = 0; var idforSubTask = 0;
var newUserDB = []; 
// Using API instead of this. ---- const date = new Date();const month = ["01","02","03","04","05","06","07","08","09","10","11","12"];let months = month[date.getMonth()];
var dateviaAPI = "";var datetimeviaAPI="";var tempviaAPI="";var percpviaAPI="";var iconviaAPI=""; var iconAltTxtviaAPI = "";var weatherAPIerr ="";

// variables used in progress retreival
var fpop = [];var filterArr = [];
//readfile variable
var datadump = [];
//weather API credentials
const API_URL_Weather = 'http://api.weatherstack.com/current';
//const weatherKey = JSON.parse(fs.readFileSync("secrets.txt", 'utf8')).weatherKey;
// local authentication variable
var datadumpAuth = []; var fName = ""; var authErr = "";  var loginDB = [];var emailAuth = []; var passAuth = [];

//Push notification API code --- PUSHER
/*let pushNotifications = new PushNotifications({
    instanceId: JSON.parse(fs.readFileSync("secrets.txt", 'utf8')).pusherId,
    secretKey: JSON.parse(fs.readFileSync("secrets.txt", 'utf8')).pusherKey
  });

  pushNotifications.publishToInterests(['hello'], {
    apns: {
      aps: {
        alert: 'Hello!'
      }
    },
    fcm: {
      notification: {
        title: 'Hello',
        body: 'Hello, world!'
      }
    },
    web: {
        notification: {
          title: "Hello",
          body: "Hello, world!",
        },
    }
  }).then((publishResponse) => {
    console.log('Just published:', publishResponse.publishId);
  }).catch((error) => {
    console.log('Error:', error);
  });*/


app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

function requestListener(req, res, next) {
    {
    let forwarded = req.headers['x-forwarded-for']
    ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
    }
    next()
  }

  app.use(requestListener);  

// Weather API calling muddleware function
async function weatherAPI (req,res,next){
    try{ 
        const result = await axios.get(API_URL_Weather,{params:{access_key : weatherKey, query : 'Jammu'}})
        const response = {localTime: (result.data.location.localtime), temperature: JSON.stringify(result.data.current.temperature), humidity: JSON.stringify(result.data.current.humidity), icons: (result.data.current.weather_icons)[0], weather: JSON.stringify(result.data.current.weather_descriptions)};
         dateviaAPI = (JSON.stringify(response.localTime).split(" ",2)[0]).replace('"',"");
         datetimeviaAPI = (response.localTime);
         tempviaAPI = response.temperature;
         percpviaAPI = response.humidity
         iconviaAPI = response.icons; 
         iconAltTxtviaAPI = response.weather; 
        }catch (error){
         weatherAPIerr = {err: error.message}   
    }
    next()
}

//local auth middleware
function localAuthentication (req,res,next) { 
    if (existsSync(__dirname + '/regUser.txt')=== false){
        console.log ("User not found");
    }
    else{
        if (fs.readFileSync("regUser.txt", 'utf8')!= ""){       
            datadumpAuth = (JSON.parse(fs.readFileSync("regUser.txt", 'utf8')));
          //  console.log(datadumpAuth);
            if (req.body["emailAuth"] !== undefined & req.body["passAuth"] !== undefined){
                    
            emailAuth=(req.body["emailAuth"]);
            passAuth=(req.body["passAuth"]);
        }
          ///  console.log(emailAuth+"fff");
            for (var i=0; i< datadumpAuth.length; i++){
                if (emailAuth === datadumpAuth[i].emailAddress & passAuth === datadumpAuth[i].password){
                    loginDB = (datadumpAuth[i]);
                    fName = datadumpAuth[i].firstname;
                    console.log(fName+"0");
            }
            }
    }
    else{
        console.log ("User not found");
    }
    }
    next()
    }

app.use(weatherAPI);

// Register user
app.post("/", (req,res)=>{
    console.log(newUserDB[0]);
    const newUser={
         firstname: req.body["fName"],
         lastname: req.body["lName"],
         emailAddress: req.body["emailaddr"],
         password: req.body["password"],
         mobileNumber: req.body["mobile"]
     }
     if (newUserDB[0] === undefined){
        newUserDB.push(newUser);
        console.log("added new");
     }
     else{
     for (var i=0; i<newUserDB.length; i++){
        if(newUserDB[i].emailAddress !== req.body["emailaddr"] & newUserDB[i].mobileNumber !== req.body["mobile"] ) {
            newUserDB.push(newUser);
            console.log("added next");
        }
        else{
            var errmsg = "User already exists."; 
            console.log("add fail");  
        }
    }
    }
     const data = {
        regUser: newUser,
        userexists: errmsg 
     }
     fs.writeFile("regUser.txt",JSON.stringify(newUserDB,null,2), 'utf8', (err) => {
         if (err) throw err;
         }); 
         console.log(req.url);
     res.render("profilepage.ejs",data)
 });

 //Home page
app.get("/", (req,res)=>{
    try{
        if (existsSync(__dirname + '/tempTaskDB.txt')=== false){
            console.log('The path is created.');
           fs.writeFile("tempTaskDB.txt", "",'utf8', (err) => {
               if (err) throw err;
           }); 
           }
           fName = undefined;
           emailAuth = undefined;
           passAuth = undefined;
    const data = {
        localTime: datetimeviaAPI, 
        temperature: tempviaAPI, 
        humidity: percpviaAPI, 
        icons: iconviaAPI, 
        weather: iconAltTxtviaAPI,
        firstname: fName
    };
        res.render("index.ejs", data); 
       }catch (error){
   //        console.log(weatherAPIerr);
           res.render("index.ejs", {err: weatherAPIerr});
       }
});

// Load login page
app.get("/login", (req,res)=>{
    console.log(emailAuth);
    console.log(passAuth);
    res.render("login.ejs");
});

app.use(localAuthentication);

// Authorize login attempt
app.post("/login", (req,res)=>{

    if (datadumpAuth != ""){
        console.log(fName+"~~");
        if (fName !== undefined){
// task creating variables
var checkedTasks=[];var num=""; var numArr = [];var title = [];var currDate = [];var currTime = [];var taskDesc = [];var subTask = [];var taskSubT = [];var len = "";

    if (fs.readFileSync("tempTaskDB.txt", 'utf8')!= ""){
        console.log("repo")
        var datadump = JSON.parse(fs.readFileSync("tempTaskDB.txt", 'utf8')); 
        if (fs.readFileSync("tempprogDB.txt", 'utf8') != ""){
            JSON.parse(fs.readFileSync("tempprogDB.txt", 'utf8'))["storedData"].forEach(element =>{
                if (element[5] === emailAuth){
                    checkedTasks.push(element);
                }

            });
    
        }
        else{
            checkedTasks = ["","","","",""];
            console.log("error")
        }
      
    (datadump.newTask).forEach(element => {  
        if (element.loginInfo.emailAddress === emailAuth & element.loginInfo.password === passAuth){
        numArr.push(element);
        num = numArr.length;
        title.push(element.titleArr);
        currDate.push(element.currDateArr);
        currTime.push(element.currTimeArr) ; 
        taskDesc.push(element.taskDescArr);
        taskSubT.push(element.taskSubArr);
        subTask.push(element.subTaskArr);
        len = element.subTaskCount;
        }
        console.log(passAuth);
        console.log(element.loginInfo.password);
    });
    
    const data={
            dir : __dirname,
            clickcount: num,
            titleArr: title,
            currDateArr: currDate,
            currTimeArr: currTime, 
            taskDescArr: taskDesc,
            taskSubArr: taskSubT,
            subTaskArr: subTask,
            subTaskCount: len,
            url: req.url,
            todopg: true,
            today: dateviaAPI,
            inputfromDB: checkedTasks,
            firstname : fName,
            loginInfo: loginDB
        }
      //  console.log(data);
    
            res.render("usertaskrepository.ejs", data);
    }
    else {
        console.log("Empty file");
        console.log(fs.readFileSync("tempTaskDB.txt", 'utf8'))
        res.render("addtask.ejs");
    }
}
else{
    console.log("visited");
    res.render("login.ejs", {authErr: "Incorrect username or password"});

}
    }
else{
res.render("login.ejs",{authErr: "User not found"});
}
});

app.get("/profile", (req,res) => {
    res.render("profilepage.ejs", {regUser: loginDB, firstname: fName})
});

app.get("/logout",(req,res)=>{
    fName = undefined;
    emailAuth = undefined;
    passAuth = undefined;
    const data = {
        firstname:fName,
        localTime: datetimeviaAPI, 
        temperature: tempviaAPI, 
        humidity: percpviaAPI, 
        icons: iconviaAPI, 
        weather: iconAltTxtviaAPI
    } 
    res.render("index.ejs", data)
});

// Retrieving stored state of tasks - task progress state,subtask checkbox state and subtask label state
app.post("/checkbox-form", (req,res) => {
   // console.log(fs.readFileSync("tempprogDB.txt", 'utf8') === ""||JSON.parse(fs.readFileSync("tempprogDB.txt", 'utf8'))["storedData"] == "")
   
    filterArr.push([(req.body["inputonLoad"][0])[0],(req.body["inputonLoad"][0])[1],(req.body["inputonLoad"][0])[4],(req.body["inputonLoad"][0])[2],(req.body["inputonLoad"][0])[3],((req.body["inputonLoad"][0])[5])]); 
    console.log("filterArr: "+ filterArr);
     Sub_Task.find() 
     .then ( (sub_task) => {  
        console.log(sub_task);
       if(sub_task == ""){
         console.log("initialize");
        const sub_Task = new Sub_Task ({
            _id: idforSubTask,
            subTaskEntry : [(req.body["inputonLoad"][0])[0],(req.body["inputonLoad"][0])[1],(req.body["inputonLoad"][0])[4],(req.body["inputonLoad"][0])[2],(req.body["inputonLoad"][0])[3],((req.body["inputonLoad"][0])[5])]
        })
        sub_Task.save();
        idforSubTask++;
        
       // fpop = fpop.filter((e) => {
       //     return e != null;
       // });

        const data = {
            storedData: Sub_Task.subTaskEntry
    } 
    res.render("taskrepository.ejs", data);   
    }

  else {

    var count = 0 ;  
    var counter = 0;

        sub_task.forEach(element => {
   
            console.log("element: "+ element);
 // -----------Loop ------1 
 
  
// -----------Loop ------2 
 
 if ((element)[0] === (filterArr[filterArr.length-1])[0] & 
       (element)[1] === (filterArr[filterArr.length-1])[1] &
       (element)[5] === (filterArr[filterArr.length-1])[5] &
        (element)[2] !== (filterArr[filterArr.length-1])[2]) {
       
            console.log("loop2")
           
    var index = sub_task.filter((item )=> {(element[0] === item[0] & element[1] === item[1] & element[5] === item[5] & element[2] === item[2])});
        Sub_Task.deleteOne({_id : index});
        const sub_Task = new Sub_Task ({
            _id: idforSubTask,
            subTaskEntry : [(req.body["inputonLoad"][0])[0],(req.body["inputonLoad"][0])[1],(req.body["inputonLoad"][0])[4],(req.body["inputonLoad"][0])[2],(req.body["inputonLoad"][0])[3],((req.body["inputonLoad"][0])[5])]
        })
        sub_Task.save();
        idforSubTask++;
   //     console.log(datadump);
    }

// -----------Loop ------3 

else{
        console.log("loop3")
        const sub_Task = new Sub_Task ({
            _id: idforSubTask,
            subTaskEntry : [(req.body["inputonLoad"][0])[0],(req.body["inputonLoad"][0])[1],(req.body["inputonLoad"][0])[4],(req.body["inputonLoad"][0])[2],(req.body["inputonLoad"][0])[3],((req.body["inputonLoad"][0])[5])]
        })        
        sub_Task.save();
        idforSubTask++;
}       
});

// fpop.push((printable));
//console.log("fpop: " + printable)

//fpop = fpop.filter((e) => {
 //   return e != null;
//});

const data = {
    storedData: Sub_Task.subTaskEntry
} 

res.render("taskrepository.ejs", data);
}
})
.catch ((err)=> {
    console.log(err);
});
});

// Task reporistory page -- All unregistered tasks are visible here
app.get("/taskrepository", (req,res)=>{
    // task creating variables
    var checkedTasks=[];var num=""; var numArr = [];var title = [];var currDate = [];var currTime = [];var taskDesc = [];var subTask = [];var taskSubT = [];var len = "";
    Task.find()
    .then ((task)=> {
    if (task != ""){
    console.log("repo")
    
    Sub_Task.find()
    .then ((sub_task)=>{
    if (sub_task != ""){

        sub_task.forEach(element =>{
            
            if (element.subTaskEntry[5] === null){
                checkedTasks.push(element.subTaskEntry);
                //console.log(element);
            }
        });
         
   //console.log(checkedTasks["storedData"]);
    }
    else{
        checkedTasks = ["","","","",""];
        console.log("error")
    }
  
   if (fName === ""){
    fName = undefined;
   }
 task.forEach(element => { 
    if (element.loginInfo.emailAddress ===  undefined & emailAuth ===  undefined & element.loginInfo.password ===  undefined & passAuth ===  undefined ){
    numArr.push(element);
    num = numArr.length;
    title.push(element.titleArr);
    currDate.push(element.currDateArr);
    currTime.push(element.currTimeArr) ; 
    taskDesc.push(element.taskDescArr);
    taskSubT.push(element.taskSubArr);
    subTask.push(element.subTaskArr);
    len = element.subTaskCount;
    }
});

//console.log(req.body["emailAuth"]);
    const data={
        dir : __dirname,
        clickcount: num,
        titleArr: title,
        currDateArr: currDate,
        currTimeArr: currTime, 
        taskDescArr: taskDesc,
        taskSubArr: taskSubT,
        subTaskArr: subTask,
        subTaskCount: len,
        url: req.url,
        todopg: true,
        today: dateviaAPI,
        inputfromDB: checkedTasks,
        firstname : fName,
        loginInfo: loginDB
    }
 //   console.log(data);
    res.render("taskrepository.ejs", (data));
})
.catch ((err)=>{
 console.log(err);
});}
else {
        console.log(err);
        res.render("addtask.ejs");
    }
});
});

// task repository for registered user
app.get("/usertaskrepository", (req,res)=>{
  // task creating variables
  var checkedTasks=[];var num=""; var numArr = [];var title = [];var currDate = [];var currTime = [];var taskDesc = [];var subTask = [];var taskSubT = [];var len = "";

    if (fs.readFileSync("tempTaskDB.txt", 'utf8')!= ""){
        console.log("repo")
        var datadump = JSON.parse(fs.readFileSync("tempTaskDB.txt", 'utf8')); 
        if (fs.readFileSync("tempprogDB.txt", 'utf8') != ""){
             JSON.parse(fs.readFileSync("tempprogDB.txt", 'utf8'))["storedData"].forEach(element =>{
                if (element[5] === emailAuth){
                    checkedTasks.push(element);
                }
                
            });
        }
        else{
            checkedTasks = ["","","","",""];
            console.log("error")
        }
       if (fName === ""){
        fName = undefined;
       }
    (datadump.newTask).forEach(element => {  
        if (element.loginInfo.emailAddress === emailAuth & element.loginInfo.password === passAuth){
        numArr.push(element);
        num = numArr.length;
        title.push(element.titleArr);
        currDate.push(element.currDateArr);
        currTime.push(element.currTimeArr) ; 
        taskDesc.push(element.taskDescArr);
        taskSubT.push(element.taskSubArr);
        subTask.push(element.subTaskArr);
        len = element.subTaskCount;
        }
        console.log(passAuth);
    });
    
    const data={
            dir : __dirname,
            clickcount: num,
            titleArr: title,
            currDateArr: currDate,
            currTimeArr: currTime, 
            taskDescArr: taskDesc,
            taskSubArr: taskSubT,
            subTaskArr: subTask,
            subTaskCount: len,
            url: req.url,
            todopg: true,
            today: dateviaAPI,
            inputfromDB: checkedTasks,
            firstname : fName,
            loginInfo: loginDB
        }
      //  console.log(data);
    res.render("usertaskrepository.ejs", (data));
    }
    else {
        console.log("Empty file");
        console.log(fs.readFileSync("tempTaskDB.txt", 'utf8'))
        res.render("addtask.ejs");
    }
});

// Tasks set for current date should be visible here
app.get("/today", (req,res)=>{
// task creating variables
var checkedTasks=[];var num=""; var numArr = [];var title = [];var currDate = [];var currTime = [];var taskDesc = [];var subTask = [];var taskSubT = [];var len = "";

    if (fs.readFileSync("tempTaskDB.txt", 'utf8')!= ""){
        console.log("repo")
        var datadump = JSON.parse(fs.readFileSync("tempTaskDB.txt", 'utf8')); 
        if (fs.readFileSync("tempprogDB.txt", 'utf8') != ""){
            JSON.parse(fs.readFileSync("tempprogDB.txt", 'utf8'))["storedData"].forEach(element =>{
                if (element[5] === emailAuth){
                    checkedTasks.push(element);
                }

            });
    
        }
        else{
            checkedTasks = ["","","","",""];
            console.log("error")
        }
        if (fName === ""){
            fName = undefined;
           }
        (datadump.newTask).forEach(element => {  
            if (element.loginInfo.emailAddress === emailAuth & element.loginInfo.password === passAuth){
            numArr.push(element);
            num = numArr.length;
            title.push(element.titleArr);
            currDate.push(element.currDateArr);
            currTime.push(element.currTimeArr) ; 
            taskDesc.push(element.taskDescArr);
            taskSubT.push(element.taskSubArr);
            subTask.push(element.subTaskArr);
            len = element.subTaskCount;
            }
            console.log(passAuth);
        });
        
        const data={
                dir : __dirname,
                clickcount: num,
                titleArr: title,
                currDateArr: currDate,
                currTimeArr: currTime, 
                taskDescArr: taskDesc,
                taskSubArr: taskSubT,
                subTaskArr: subTask,
                subTaskCount: len,
                url: req.url,
                todopg: true,
                today: dateviaAPI,
                inputfromDB: checkedTasks,
                firstname : fName,
                loginInfo: loginDB
            }
    
        res.render("submit.ejs", (data));
        }
        else {
            console.log("Empty file");
            console.log(fs.readFileSync("tempTaskDB.txt", 'utf8'))
            res.render("addtask.ejs");
        }
});

// Loads form for new task creation
app.get("/addTask", (req,res)=>{
     res.render("addTask.ejs",{firstname : fName});
 });

// Adds new task to the task repository
app.post("/submit", (req,res)=>{
    
    const newTask = new Task({
        _id: idCount, 
        ip : ip,
        titleArr : req.body["taskTitle"],
        currDateArr:(req.body["taskDate"]),
        currTimeArr: (req.body["taskTime"]),
        taskDescArr: (req.body["taskDesc"]),
        taskSubArr: (req.body["taskSub"]),
        subTaskArr: (req.body["subtaskbox"]),
        subTaskCount: req.body["subtaskbox"].length,
        url: req.url,
        today: dateviaAPI,
        firstname : fName,
        loginInfo: loginDB
    });
    newTask.save();
    idCount++;
    res.render("addTask.ejs", {msg: "Task created successfully.", firstname: fName});
});

app.get("/editTask/:id", (req,res) => {
    console.log(req.params.id);
    
        var datadump = [];
        var checkedTasks = [];
      if (fs.readFileSync("tempTaskDB.txt", 'utf8') != ""){   
        datadump = JSON.parse(fs.readFileSync("tempTaskDB.txt", 'utf8'))["newTask"];

        if (datadump[parseInt(req.params.id)].loginInfo == "") {
        datadump.splice(parseInt(req.params.id),1) ;
        //console.log(datadump);
        fs.writeFile("tempTaskDB.txt","",'utf8', (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
        const data={
            newTask: datadump
          }
        fs.writeFile("tempTaskDB.txt",JSON.stringify(data,null,2),'utf8', (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });

    if (fs.readFileSync("tempprogDB.txt", 'utf8') != ""){
        checkedTasks = JSON.parse(fs.readFileSync("tempprogDB.txt", 'utf8'))["storedData"]; 
        var revisedTasks = JSON.parse(fs.readFileSync("tempprogDB.txt", 'utf8'))["storedData"]; 
        console.log(revisedTasks.length);
       for (var i=0; i< revisedTasks.length; i++){ 
       var taskID =  checkedTasks.findIndex(element => element[5] === null & element[0] === parseInt(req.params.id) )
       if (taskID !== -1){
       checkedTasks.splice(taskID,1);
        }
       } 
      checkedTasks.forEach(element => {
       if (element[0] > parseInt(req.params.id)){
        element[0] = parseInt(element[0])-1;
        var myStr = element[1].substring((element[1]).length,(element[1]).length-1);
        element[1] = `checkbox-${element[0]}-${myStr}`;
        console.log(element[1]);
        }
        
    });

        fs.writeFile("tempprogDB.txt","",'utf8', (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
        const data={
            storedData: checkedTasks
          }
          
        fs.writeFile("tempprogDB.txt",JSON.stringify(data,null,2),'utf8', (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    }
}

else{
    var count = 0
    datadump.forEach(element => {
      if  (element.loginInfo.emailAddress === emailAuth & element.loginInfo.password === passAuth & parseInt(req.params.id)===count) {
       datadump.splice (datadump.findIndex(item => item === element),1);
       console.log(element)
      }
      count++
    });
    fs.writeFile("tempTaskDB.txt","",'utf8', (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
    const data={
        newTask: datadump
      }
    fs.writeFile("tempTaskDB.txt",JSON.stringify(data,null,2),'utf8', (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });

    if (fs.readFileSync("tempprogDB.txt", 'utf8') != ""){
        checkedTasks = JSON.parse(fs.readFileSync("tempprogDB.txt", 'utf8'))["storedData"]; 
        var revisedTasks = JSON.parse(fs.readFileSync("tempprogDB.txt", 'utf8'))["storedData"]; 
       for (var i=0; i< revisedTasks.length; i++){
       var taskID =  checkedTasks.findIndex(element => element[5] === emailAuth & parseInt(element[0]) === parseInt(req.params.id) )
       if (taskID !== -1){
       checkedTasks.splice(taskID,1);
        }
       } 
      checkedTasks.forEach(element => {
       if (element[0] > parseInt(req.params.id)){
        element[0] = parseInt(element[0])-1;
        var myStr = element[1].substring((element[1]).length,(element[1]).length-1);
        element[1] = `checkbox-${element[0]}-${myStr}`;
        console.log(element[1]);
        }
        
    });

        fs.writeFile("tempprogDB.txt","",'utf8', (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
        const data={
            storedData: checkedTasks
          }
          
        fs.writeFile("tempprogDB.txt",JSON.stringify(data,null,2),'utf8', (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    }
}

}
    if (fName === undefined){
        res.redirect("/taskrepository");    
        }
    else{
        res.redirect("/usertaskrepository");
    }
});

app.post("/updateTask", (req,res) => {
    
    var taskCn = [];
    var datadump = [];
   
  if (fs.readFileSync("tempTaskDB.txt", 'utf8') != ""){   
    datadump = JSON.parse(fs.readFileSync("tempTaskDB.txt", 'utf8'))["newTask"];

      var indexedArr =  datadump.filter(element => element.titleArr+element.taskSubArr+element.taskDescArr+element.currDateArr+element.currTimeArr+element.subTaskArr  === req.body.id & element.loginInfo == "");
      if (indexedArr.length === 1){
            var index =  datadump.findIndex(element => element.titleArr+element.taskSubArr+element.taskDescArr+element.currDateArr+element.currTimeArr+element.subTaskArr  === req.body.id & element.loginInfo == "");
            console.log(index);
            if (req.body.taskTitle) {datadump[index].titleArr = req.body.taskTitle}
            if (req.body.taskDate) {datadump[index].currDateArr = req.body.taskDate}
            if (req.body.taskTime) {datadump[index].currTimeArr = req.body.taskTime}
            if (req.body.taskDescArr) {datadump[index].taskDescArr = req.body.taskDescArr}
            if (req.body.taskSub) {datadump[index].taskSubArr = req.body.taskSub}
            for (var i=0; i<10; i++){
                if((req.body.subTask)[i] !== (datadump[index].subTaskArr)[i]) {
                    (datadump[index].subTaskArr)[i] = (req.body.subTask)[i]
                     taskCn.push(i); 
                }
            }
          
            fs.writeFile("tempTaskDB.txt","",'utf8', (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });
            const data={
                newTask: datadump
              }
            fs.writeFile("tempTaskDB.txt",JSON.stringify(data,null,2),'utf8', (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });
            
            if (fs.readFileSync("tempprogDB.txt", 'utf8') != ""){
               var checkedTasks = JSON.parse(fs.readFileSync("tempprogDB.txt", 'utf8'))["storedData"]; 
                var revisedTasks = JSON.parse(fs.readFileSync("tempprogDB.txt", 'utf8'))["storedData"]; 
               for (var i=0; i< revisedTasks.length; i++){ 
                    for (var j =0; j < taskCn.length; j++){
               var taskID =  checkedTasks.findIndex(element => element[5] === null & (element[0]) === req.body.taskNum & element[1] === `checkbox-${req.body.taskNum}-${taskCn[j]}`)
            
               if (taskID !== -1){
               checkedTasks.splice(taskID,1);
                }
            }
            }
            fs.writeFile("tempprogDB.txt","",'utf8', (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });
            const data={
                storedData: checkedTasks
              }
              
            fs.writeFile("tempprogDB.txt",JSON.stringify(data,null,2),'utf8', (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });
        }

            res.redirect("/taskrepository");
        }
        else{
            var indexedArr =  datadump.filter(element => element.titleArr+element.taskSubArr+element.taskDescArr+element.currDateArr+element.currTimeArr+element.subTaskArr  === req.body.id & element.loginInfo.emailAddress == emailAuth);
      if (indexedArr.length === 1){
            var index =  datadump.findIndex(element => element.titleArr+element.taskSubArr+element.taskDescArr+element.currDateArr+element.currTimeArr+element.subTaskArr  === req.body.id & element.loginInfo.emailAddress == emailAuth);
            console.log(index);
            if (req.body.taskTitle) {datadump[index].titleArr = req.body.taskTitle}
            if (req.body.taskDate) {datadump[index].currDateArr = req.body.taskDate}
            if (req.body.taskTime) {datadump[index].currTimeArr = req.body.taskTime}
            if (req.body.taskDescArr) {datadump[index].taskDescArr = req.body.taskDescArr}
            if (req.body.taskSub) {datadump[index].taskSubArr = req.body.taskSub}
            for (var i=0; i<10; i++){
                if((req.body.subTask)[i] !== (datadump[index].subTaskArr)[i]) {
                    (datadump[index].subTaskArr)[i] = (req.body.subTask)[i] ;
                    taskCn.push(i); 
                }
            }
           
            fs.writeFile("tempTaskDB.txt","",'utf8', (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });
            const data={
                newTask: datadump
              }
            fs.writeFile("tempTaskDB.txt",JSON.stringify(data,null,2),'utf8', (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });

            if (fs.readFileSync("tempprogDB.txt", 'utf8') != ""){
                var checkedTasks = JSON.parse(fs.readFileSync("tempprogDB.txt", 'utf8'))["storedData"]; 
                 var revisedTasks = JSON.parse(fs.readFileSync("tempprogDB.txt", 'utf8'))["storedData"]; 
                for (var i=0; i< revisedTasks.length; i++){ 
                     for (var j =0; j < taskCn.length; j++){
                var taskID =  checkedTasks.findIndex(element => element[5] === emailAuth & (element[0]) === req.body.taskNum & element[1] === `checkbox-${req.body.taskNum}-${taskCn[j]}`)
             
                if (taskID !== -1){
                checkedTasks.splice(taskID,1);
                 }
             }
             }
             fs.writeFile("tempprogDB.txt","",'utf8', (err) => {
                 if (err) throw err;
                 console.log('The file has been saved!');
             });
             const data={
                 storedData: checkedTasks
               }
               
             fs.writeFile("tempprogDB.txt",JSON.stringify(data,null,2),'utf8', (err) => {
                 if (err) throw err;
                 console.log('The file has been saved!');
             });
         }

            res.redirect("/usertaskrepository");
        }
        }
      /*   datadump.splice(parseInt(req.params.id),1) ;
    //console.log(datadump);
    fs.writeFile("tempTaskDB.txt","",'utf8', (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
    const data={
        newTask: datadump
      }
    fs.writeFile("tempTaskDB.txt",JSON.stringify(data,null,2),'utf8', (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });*/
   // res.redirect("/taskrepository");
}
});

// selects local port to run server 
app.listen(port, ()=> {
    console.log(`Server is running at ${port}`);
});
