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
    user_id:Number,
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

const usertaskSchema = new mongoose.Schema({
    user_id:Number,
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
    user_id: Number,
    reg_user: Boolean,
    subTaskEntry : Array
})

const addUserSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    emailAddress: String,
    password: String,
    mobileNumber: Number,
})

const Task = mongoose.model("Task", taskSchema);
const userTask = mongoose.model("userTask", usertaskSchema);
const Sub_Task = mongoose.model("Sub_Task", subTaskSchema);
const newUser = mongoose.model("newUser", addUserSchema);

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
var ip = "";
var newUserDB = []; 
// Using API instead of this. ---- const date = new Date();const month = ["01","02","03","04","05","06","07","08","09","10","11","12"];let months = month[date.getMonth()];
var dateviaAPI = "";var datetimeviaAPI="";var tempviaAPI="";var percpviaAPI="";var iconviaAPI=""; var iconAltTxtviaAPI = "";var weatherAPIerr ="";
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
async function localAuthentication (req,res,next) { 
    await newUser.find()
    .then ((user)=> {
    
    if (user.length === 0){
        console.log ("User not found");
    }
    else{
            datadumpAuth = user ;
          //      console.log(datadumpAuth);
            if (req.body["emailAuth"] !== undefined & req.body["passAuth"] !== undefined){
            emailAuth=(req.body["emailAuth"]);
            passAuth=(req.body["passAuth"]);
        }
          for (var i=0; i< datadumpAuth.length; i++){
                if (emailAuth === datadumpAuth[i].emailAddress & passAuth === datadumpAuth[i].password){
                    loginDB = (datadumpAuth[i]);
                    fName = datadumpAuth[i].firstname;
             }
            }
    }
    })
    next()
    }

app.use(weatherAPI);

// Register user
app.post("/", (req,res)=>{
    
     newUser.find()
     .then ((user)=>{
        var count = 0;
        var addedUser = [];
       if (user.length === 0){
        console.log("First user")
        const new_user = new newUser({
            firstname: req.body["fName"],
            lastname: req.body["lName"],
            emailAddress: req.body["emailaddr"],
            password: req.body["password"],
            mobileNumber: req.body["mobile"]
        });
        new_user.save();
        addedUser = new_user;
        count++;
     }
     else{

            user.forEach((elem) => {
                if(elem.emailAddress !== req.body["emailaddr"] & elem.mobileNumber !== req.body["mobile"] ) {
                    const new_user = newUser({
                    firstname: req.body["fName"],
                    lastname: req.body["lName"],
                    emailAddress: req.body["emailaddr"],
                    password: req.body["password"],
                    mobileNumber: req.body["mobile"]
            });
            new_user.save();
            console.log("added next");
            addedUser = new_user;
            count++;
        }
        
    });
    }
   
    console.log(count);
    const data = {
        regUser: addedUser,
        userexists: "User already exists.", 
        myCount: count
     }
         console.log(req.url);
     res.render("profilepage.ejs",data)
    })
});


 //Home page
app.get("/", (req,res)=>{

    try{
           fName = undefined;
           emailAuth = undefined;
           passAuth = undefined;
           console.log(fName+" "+emailAuth+" "+passAuth);
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
    fName = undefined;
           emailAuth = undefined;
           passAuth = undefined;
           console.log(fName+" "+emailAuth+" "+passAuth);
    res.render("login.ejs");
});

app.use(localAuthentication);

// Authorize login attempt
app.post("/login", async(req,res)=>{
    if (datadumpAuth != ""){
        if (fName != undefined){
// task creating variables
var checkedTasks=[];

userTask.find()
.then ((task)=> {
if (task != ""){


            res.redirect("/usertaskrepository");

    }
    else {
        console.log("Empty file");
        res.render("addtask.ejs");
    }
})
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
    res.render("profilepage.ejs", {regUser: loginDB, firstname: fName, myCount: 1})
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
   const filterArr = [];    
   var cnt = 0 ;
   var user_bool = "";
   if (fName == undefined){
    user_bool = false;
    filterArr.push([(req.body["inputonLoad"][0])[0],(req.body["inputonLoad"][0])[1],(req.body["inputonLoad"][0])[4],(req.body["inputonLoad"][0])[2],(req.body["inputonLoad"][0])[3],""]);   
}
  else{
    user_bool = true;
    filterArr.push([(req.body["inputonLoad"][0])[0],(req.body["inputonLoad"][0])[1],(req.body["inputonLoad"][0])[4],(req.body["inputonLoad"][0])[2],(req.body["inputonLoad"][0])[3],((req.body["inputonLoad"][0])[5])]); 
  }
    console.log("filterArr: "+ filterArr);
     Sub_Task.find() 
     .then ( async(sub_task) => {  
       console.log(fName);
      console.log(user_bool);
       if(sub_task == ""){
         console.log("initialize");
         const count = await (Sub_Task.countDocuments({}));
        const sub_Task = new Sub_Task ({
            user_id: count ,
            reg_user: user_bool,
            subTaskEntry : ((filterArr[filterArr.length-1]))
        })

        sub_Task.save();
        
        
       // fpop = fpop.filter((e) => {
       //     return e != null;
       // }); 
    }

   if (sub_task != ""){
    sub_task.forEach(async(element) => { 
       cnt++;
    if ((filterArr[filterArr.length-1])[2] != "") {
    const count = await (Sub_Task.countDocuments({}));
    console.log(cnt);
    const sub_Task = new Sub_Task ({
        user_id: count,
        reg_user: user_bool,
        subTaskEntry : ((filterArr[filterArr.length-1]))
    })   

    if  ( cnt === sub_task.length && element.user_id != count ) {
        cnt++;
        sub_Task.save();
    }
}
});
}  

if (sub_task != "")  { 
    
        sub_task.forEach(async(element) => {

 // -----------Loop ------1
// -----------Loop ------2 
 
 if ((element.subTaskEntry)[0] === (filterArr[filterArr.length-1])[0] & 
       (element.subTaskEntry)[1] === (filterArr[filterArr.length-1])[1] &
       (element.subTaskEntry)[5] === (filterArr[filterArr.length-1])[5] &
        (element.subTaskEntry)[2] !== (filterArr[filterArr.length-1])[2]) {
       
            console.log("loop2")
     var myArray = sub_task;    
    var index = myArray.findIndex((item)=>  (item.subTaskEntry[0] === (filterArr[filterArr.length-1])[0] & (item.subTaskEntry)[1] === (filterArr[filterArr.length-1])[1] &  (item.subTaskEntry)[5] === (filterArr[filterArr.length-1])[5] & (item.subTaskEntry)[2] !== (filterArr[filterArr.length-1])[2]));
    console.log(index);    
    Sub_Task.deleteOne({user_id : (sub_task[index]).user_id})
    .then ((elem)=> {
        console.log(elem)
        
    })
   //     console.log(datadump);
    }    
});
}

// fpop.push((printable));
//console.log("fpop: " + printable)

//fpop = fpop.filter((e) => {
 //   return e != null;
//});

const data = {
    storedData: Sub_Task.subTaskEntry
} 

res.render("taskrepository.ejs", data);
})
.catch ((err)=> {
    console.log(err);
});
});

// Task reporistory page -- All unregistered tasks are visible here
app.get("/taskrepository", (req,res)=>{
    console.log(fName);
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

            if (element.subTaskEntry[5] === "" & element.reg_user === false){
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
    if (element.loginInfo == "" ){
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
    res.render("taskrepository.ejs", (data));
})
.catch ((err)=>{
 console.log(err);
});}
else {
        console.log("Add first task");
        res.render("addtask.ejs");
    }
});
});

// task repository for registered user
app.get("/usertaskrepository", (req,res)=>{
  // task creating variables
  var checkedTasks=[];var num=""; var numArr = [];var title = [];var currDate = [];var currTime = [];var taskDesc = [];var subTask = [];var taskSubT = [];var len = "";

     userTask.find()
    .then ((task)=> {
    if (task != ""){
    
    Sub_Task.find()
    .then ((sub_task)=>{
    if (sub_task != ""){

        sub_task.forEach(element =>{
        //    console.log(element.subTaskEntry[5] === emailAuth);
            if (element.subTaskEntry[5] === emailAuth & element.reg_user === true){
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
 task.forEach((element) => { 
    element.loginInfo.forEach(elem => {
        if (elem.emailAddress === emailAuth & elem.password === passAuth){
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
       // console.log(passAuth);
    });
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
    res.render("usertaskrepository.ejs", (data));
    })
    .catch ((err)=>{
        console.log(err);
       });}
       else {
               console.log("Add first task");
               res.render("addtask.ejs");
           }
       });
});

// Tasks set for current date should be visible here
app.get("/today", (req,res)=>{
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
            
            if (element.subTaskEntry[5] === "" & element.reg_user === true){
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
        })
        .catch ((err)=>{
        console.log(err);
       });}
       else {
               console.log("Add first task");
               res.render("addtask.ejs");
           }
       });
});

// Loads form for new task creation
app.get("/addTask", (req,res)=>{
    console.log(fName);
     res.render("addTask.ejs",{firstname : fName});
 });

// Adds new task to the task repository
app.post("/submit", async(req,res)=>{
  console.log(loginDB);
  if (fName == undefined){
    const count = await (Task.countDocuments({}))+100 ;
    const newTask = new Task({
        user_id: count, 
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
        loginInfo: []
    });
    newTask.save();
  }
  else {
    const usercount = await (userTask.countDocuments({}))+100 ;
    const newuserTask = new userTask({
        user_id: usercount, 
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
    newuserTask.save();
  }
   console.log(fName);
    res.render("addTask.ejs", {msg: "Task created successfully.", firstname: fName});
});

app.get("/editTask/:id", async(req,res) => {
    console.log(parseInt(100+parseInt(req.params.id)));
    console.log(fName);

    if (fName === "" || fName == undefined){
     await Task.findOneAndDelete({$and:[{user_id: parseInt(100+parseInt(req.params.id))},{loginInfo:{$eq: []}}]})
    .then ((ack)=> {
        console.log(ack)})
    .catch ((err)=>{
        console.log(err);
    })
    }
    else 
        {
            await userTask.findOneAndDelete({$and:[{user_id: parseInt(100+parseInt(req.params.id))},{loginInfo:{$ne: []}}]})
    .then ((ack)=> {
        console.log(ack)})
    .catch ((err)=>{
        console.log(err);
    })
    }
    
    if (await Task.find({$and:[{user_id:100+parseInt(req.params.id)},{loginInfo:[]}]}) == ""){
        console.log("X")
    for (var i= parseInt(req.params.id); i< await Task.countDocuments({}); i++){
    await Task.findOneAndUpdate({user_id:100+i+1},{user_id:100+i});
    }
    var my_count = await Sub_Task.countDocuments({});
    for (var i = 0; i < my_count; i++){
        console.log(my_count + "____");
        await Sub_Task.findOneAndDelete({$and:[{subTaskEntry : req.params.id} , {reg_user : false}]})
       .then (async(ack) =>{
        my_count = await Sub_Task.countDocuments({});
        if (ack != null){
            if ( ack.reg_user === false){    
            for (var i= ack.user_id; i< await Task.countDocuments({})+await userTask.countDocuments({}); i++){ 
            await Sub_Task.findOneAndUpdate({user_id:i+1},{user_id:i})
            .then ((ack)=> {
                console.log(ack);
            });
           }
        }
    }
    });
    }
           Sub_Task.find()
           .then ((sub_task)=>{
           sub_task.forEach(async (element) => {
               if (element.subTaskEntry[0] > parseInt(req.params.id) & element.reg_user === false){
                var myStr = element.subTaskEntry[1].substring((element.subTaskEntry[1]).length,(element.subTaskEntry[1]).length-1);
                console.log("r"+element.subTaskEntry[0])
           await Sub_Task.updateOne({$and: [{subTaskEntry : element.subTaskEntry[0], reg_user: false}]},{$set: {"subTaskEntry.$[elem]": `${parseInt(element.subTaskEntry[0])-1}`}},{arrayFilters:[{"elem": element.subTaskEntry[0]}]})
            .then (()=>{
               console.log("Re-aligned checkbox sequence and user ID after delete operation")
           })
           .catch((err)=>{
               console.log(err)
           });
   
           await Sub_Task.updateOne({$and: [{subTaskEntry : `${parseInt(element.subTaskEntry[0])-1}`, reg_user: false}]},{$set: {"subTaskEntry.$[elem]": `checkbox-${parseInt(element.subTaskEntry[0])-1}-${myStr}`}},{arrayFilters:[{"elem": element.subTaskEntry[1]}]})
           .then (()=>{
               console.log("Re-aligned checkbox id after delete operation")
           })
           .catch((err)=>{
               console.log(err)
            });
        }
        });
        })
           .catch ((err)=>{
           console.log(err);
           });
       }

    if (await userTask.find({$and:[{user_id:100+parseInt(req.params.id)},{loginInfo:{$ne:[]}}]}) == ""){
        console.log("Y")
    for (var i= parseInt(req.params.id); i< await userTask.countDocuments({}); i++){
    await userTask.findOneAndUpdate({user_id:100+i+1},{user_id:100+i});
    }
    
    for (var i = 0; i < await Sub_Task.countDocuments({}); i++){
        await Sub_Task.findOneAndDelete({$and:[{subTaskEntry : req.params.id} , {reg_user : true}]})
        .then (async(ack) =>{
            if (ack != null && ack.reg_user === true){    
                for (var i= ack.user_id; i< await Task.countDocuments({})+await userTask.countDocuments({}); i++){ 
                await Sub_Task.findOneAndUpdate({user_id:i+1},{user_id:i})
                .then ((ack)=> {
                    console.log(ack);
                });
               }
            }
            })
            }
               Sub_Task.find()
                .then ((sub_task)=>{
                sub_task.forEach(async(element) => {
                    if (element.subTaskEntry[0] > parseInt(req.params.id) & element.reg_user === true){
                    var myStr = element.subTaskEntry[1].substring((element.subTaskEntry[1]).length,(element.subTaskEntry[1]).length-1);
                console.log("s")
                await Sub_Task.updateOne({$and: [{subTaskEntry : element.subTaskEntry[0], reg_user: true}]},{$set: {"subTaskEntry.$[elem]": `${parseInt(element.subTaskEntry[0])-1}`}},{arrayFilters:[{"elem": element.subTaskEntry[0]}]})
                .then (()=>{
                    console.log("Re-aligned checkbox sequence and user ID after delete operation")
                })
                .catch((err)=>{
                    console.log(err)
                });

                await Sub_Task.updateOne({$and: [{subTaskEntry : `${parseInt(element.subTaskEntry[0])-1}`, reg_user: true}]},{$set: {"subTaskEntry.$[elem]": `checkbox-${parseInt(element.subTaskEntry[0])-1}-${myStr}`}},{arrayFilters:[{"elem": element.subTaskEntry[1]}]})
                .then (()=>{
                    console.log("Re-aligned checkbox id after delete operation")
                })
                .catch((err)=>{
                    console.log(err)
                });
                }
                });
                })
            .catch ((err)=>{
            console.log(err);
            });

        }
        
    if (fName === undefined){
        res.redirect("/taskrepository");    
        }
    else{
        res.redirect("/usertaskrepository");
    }
});

app.post("/updateTask", (req,res) => {
    
    if (fName != undefined){
        console.log("User")
    userTask.find({})
    .then(async(task)=>{
    var indexedArr = task.filter(element => element.titleArr+element.taskSubArr+element.taskDescArr+element.currDateArr+element.currTimeArr+element.subTaskArr  === req.body.id);
    if (indexedArr.length === 1){
        var index =  task.findIndex(element => element.titleArr+element.taskSubArr+element.taskDescArr+element.currDateArr+element.currTimeArr+element.subTaskArr  === req.body.id);
        var my_subTaskArr = await userTask.find({user_id : 100+index}, {subTaskArr: 1, _id:0});
       var prev_subTaskArr = my_subTaskArr[index].subTaskArr.filter(e => e != "") ;
       await userTask.updateOne({user_id : 100+index},  {titleArr : req.body.taskTitle, currDateArr : req.body.taskDate, currTimeArr : req.body.taskTime, taskDescArr : req.body.taskDesc, taskSubArr : req.body.taskSub, subTaskArr: req.body.subTask})
        .then (e => {
            console.log(e);
        })
        var update_subTaskArr = req.body.subTask.slice(0,(prev_subTaskArr.length)); 
       if (prev_subTaskArr.toString() != update_subTaskArr.toString()){
       console.log("different")
       await Sub_Task.deleteMany({subTaskEntry : `${index}`})
       .then (e => {
         console.log(e);
       })
     }
    }
    })
    res.redirect("/usertaskrepository");
    }
    else {
        console.log("Guest")
    Task.find({})
    .then(async(task)=>{
    var indexedArr = task.filter(element => element.titleArr+element.taskSubArr+element.taskDescArr+element.currDateArr+element.currTimeArr+element.subTaskArr  === req.body.id);
    if (indexedArr.length === 1){
        var index =  task.findIndex(element => element.titleArr+element.taskSubArr+element.taskDescArr+element.currDateArr+element.currTimeArr+element.subTaskArr  === req.body.id);
        var my_subTaskArr = await Task.find({user_id : 100+index}, {subTaskArr: 1, _id:0});
       var prev_subTaskArr = my_subTaskArr[index].subTaskArr.filter(e => e != "") ;
       await Task.updateOne({user_id : 100+index},  {titleArr : req.body.taskTitle, currDateArr : req.body.taskDate, currTimeArr : req.body.taskTime, taskDescArr : req.body.taskDesc, taskSubArr : req.body.taskSub, subTaskArr: req.body.subTask})
        .then (e => {
            console.log(e);
        })
        var update_subTaskArr = req.body.subTask.slice(0,(prev_subTaskArr.length)); 
       if (prev_subTaskArr.toString() != update_subTaskArr.toString()){
       console.log("different")
       await Sub_Task.deleteMany({subTaskEntry : `${index}`})
       .then (e => {
         console.log(e);
       })
     }
    }
    })
    res.redirect("/taskrepository");
    }
   
});

// selects local port to run server 
app.listen(port, ()=> {
    console.log(`Server is running at ${port}`);
});
