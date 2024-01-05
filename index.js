import express from "express";
import {dirname} from "path";
import {fileURLToPath} from "url";
import bodyParser  from "body-parser";
import pg from "pg";
import { Script } from "vm";


const db = new pg.Client ({
    user: "postgres",
    host: "localhost",
    database: "To-Do App",
    password:"Krishna@5147#",
    port: 5432
})

db.connect();

const app = express();
const port = 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

var ip = "";
var newUserDB = []; 
// Using API instead of this. ---- const date = new Date();const month = ["01","02","03","04","05","06","07","08","09","10","11","12"];let months = month[date.getMonth()];
var dateviaAPI = "";var datetimeviaAPI="";var tempviaAPI="";var percpviaAPI="";var iconviaAPI=""; var iconAltTxtviaAPI = "";var weatherAPIerr ="";
//weather API credentials
const API_URL_Weather = 'http://api.weatherstack.com/current';
//const weatherKey = JSON.parse(fs.readFileSync("secrets.txt", 'utf8')).weatherKey;
// local authentication variable
var datadumpAuth = [];   var emailAuth = ""; var passAuth = "";

function requestListener(req, res, next) {
    {
    let forwarded = req.headers['x-forwarded-for']
    ip = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress;
    }
    next()
  }

  app.use(requestListener);  


function authUser (ip1, ip2){
   emailAuth = ip1 ;
   passAuth = ip2 ;
   console.log(emailAuth,passAuth)
   return [emailAuth, passAuth];
}

 //Load home page
 app.get("/", (req,res)=>{
  var fName = "";
    try{
// logging out on hitting the elements that land on home page
            fName = undefined;
           emailAuth = undefined;
           passAuth = undefined;
           console.log(fName+" "+emailAuth+" "+passAuth + "y");
// Getting data from API 
    const data = {
        localTime: datetimeviaAPI, 
        temperature: tempviaAPI, 
        humidity: percpviaAPI, 
        icons: iconviaAPI, 
        weather: iconAltTxtviaAPI,
        firstname: fName
    };
        res.render("index.ejs", data); 
       }
    catch (error){
          console.log(emailAuth + "x");
           res.render("index.ejs", {err: weatherAPIerr});
       }
});


// Task reporistory page -- All unregistered tasks are visible here
app.get("/taskrepository", async(req,res)=>{
  console.log(emailAuth);
    // task creating variables
    var checkedTasks=[];var num=""; var numArr = [];var title = [];var currDate = [];var currTime = [];var taskDesc = [];var _subTask = [];var subTask = [];var taskSubT = [];var len = []; var fName = "";  var _subtaskID = []; var subtaskID = [];
    let result = await db.query("SELECT * from tasks");
    console.log(result.rows.length);
    if (result.rows.length != 0){
    console.log("repo") ;
    let result2 = [] ;
    
    let _userID = await db.query(`SELECT * from users WHERE email_id = '${emailAuth}' AND password = '${passAuth}'` ) ; 
        console.log(_userID.rows) ;

   if (_userID.rows != "") {
       result2 = await db.query(`SELECT * from connections JOIN tasks ON connections._task = tasks.id JOIN sub_tasks ON connections._subtask = sub_tasks.id WHERE tasks.user_id = ${_userID.rows[0].id}`);    
       
       fName = _userID.rows[0].firstname ;
    }
  else  {
     result2 = await db.query(`SELECT * from connections JOIN tasks ON connections._task = tasks.id JOIN sub_tasks ON connections._subtask = sub_tasks.id WHERE tasks.user_id IS NULL`);
     fName = undefined;
    }
    console.log(result2.rows) ;

    result2.rows.forEach(element => { 
       
        
        var Index = numArr.findIndex(elem => elem === element.task_id)
        if(Index === -1){
        numArr.push(element.task_id); 
        title.push(element.task);
        currDate.push((element.today).getDate() + "-" + (element.today).getMonth()+1 +"-"+ (element.today).getFullYear()) ;
        currTime.push(element.now) ; 
        taskDesc.push(element.description);
        taskSubT.push(element.sub_title);
        }
    });
    num = numArr.length;
    console.log(num)

    //subTask = [];
    
    numArr.forEach(element => {
        _subTask = [] ; 
        _subtaskID = [] ; 
        for (var i = 0 ; i < result2.rows.length ; i++) {
        if (result2.rows[i].task_id === element){   
        _subTask.push(result2.rows[i].sub_tasks)
        _subtaskID.push(result2.rows[i].id);
        }     
    }
    subTask.push(_subTask)
    subtaskID.push(_subtaskID)
    len.push(_subTask.length);
    });
    
console .log(subtaskID);
    /*   

 if (result2.rows.length != 0){

        result2.rows.forEach(element =>{

           // if (element.subTaskEntry[5] === "" & element.reg_user === false){
             //   checkedTasks.push(element.subTaskEntry);
               console.log(element);
            //}
        });
         
   //console.log(checkedTasks["storedData"]);
    }
    else{
        checkedTasks = ["","","","",""];
        console.log("error")
    }
  */ 

    const data={
        dir : __dirname,
        clickcount: num,
        taskIDArr : numArr,
        titleArr: title,
        currDateArr: currDate,
        currTimeArr: currTime, 
        taskDescArr: taskDesc,
        taskSubArr: taskSubT,
        subTaskArr: subTask,
        subTaskCount: len,
        subTaskIDArr : subtaskID,
        url: req.url,
        todopg: true,
        today: dateviaAPI,
        inputfromDB: checkedTasks,
        firstname : fName,
        loginInfo: ""
    }
    res.render("taskrepository.ejs", (data)); 
}
else {
        console.log("Add first task");
        res.render("addtask.ejs");
    }
  
});

// Loads form for new task creation
app.get("/addTask", async(req,res)=>{
    var fName = "" ; 
    console.log(emailAuth , passAuth);
    try{
    let _fName = await db.query(`SELECT firstname from users WHERE email_id = '${emailAuth}' AND password = '${passAuth}'` ) ;
    fName = _fName.rows[0].firstname ;
    }
    catch (err){
        console.log(err);
    fName = undefined ;
    }
    console.log(fName);
     res.render("addTask.ejs",{firstname : fName});
 });

// Adds new task to the task repository
app.post("/submit", async(req,res)=>{
    var fName = "" ;
    var symbol = "" ;  
    var sub_T = [] ;
    const d = new Date() ;
    const date = d.getDate() +"-"+ d.getMonth()+1 +"-"+ d.getFullYear() ;
    const time = d.getHours() +":"+ d.getMinutes() +":"+ d.getSeconds() ;
    let userID = [] ;
    try{
    let _userID = await db.query(`SELECT id,firstname from users WHERE email_id = '${emailAuth}' AND password = '${passAuth}'` ) ;
      userID = _userID.rows[0].id ;
      symbol = '='
     fName = _userID.rows[0].firstname ;
    }
    catch (err){
     userID = null;
     symbol = 'IS'
     fName = undefined ;
    }
    
    const newtask = ({
        task : req.body["taskTitle"],
        desc: (req.body["taskDesc"]),
        subtitle: (req.body["taskSub"]),
        today : date,
        now : time,
        user_id :  userID
    });
    console.log(symbol);
    await db.query(`INSERT INTO tasks (task, description, sub_title, today, now, user_id) VALUES ('${newtask.task}', '${newtask.desc}', '${newtask.subtitle}', '${newtask.today}', '${newtask.now}', ${newtask.user_id})`);
    var taskID = await db.query(`SELECT id FROM tasks WHERE task = '${newtask.task}' AND now = '${newtask.now}'  AND  user_id ${symbol} ${newtask.user_id}`)
    console.log(taskID.rows);
    var iD = (taskID.rows.pop().id);
    var _subTask = (req.body["subtaskbox"]) ; 
    for (var i = 0; i< _subTask.length ; i++){
        if (_subTask[i] != ""){
        sub_T.push(_subTask[i])
       }
    } 
    const subtasks = ({        
        sub_tasks: sub_T,
        isSelected: false,
        task_id: iD
    });
   
    for (var i = 0; i< sub_T.length; i++){
        await db.query(`INSERT INTO sub_tasks (sub_tasks, is_selected,task_id) VALUES ('${subtasks.sub_tasks[i]}', '${subtasks.isSelected}','${subtasks.task_id}')`); 
    }   
   
    var subtask_id = await db.query(`SELECT id FROM sub_tasks WHERE task_id = '${subtasks.task_id}'`);
   
    for (var i = 0; i< subtask_id.rows.length ; i++){
        await db.query(`INSERT INTO connections(_task, _subtask) VALUES ('${iD}','${subtask_id.rows[i].id}')`); 
    }
    res.render("addTask.ejs", {msg: "Task created successfully.", firstname: fName});
});

// Code to add new user to the database
app.post("/", async(req,res)=>{

   try {
   const newuser = ({
        ip: ip,
        fName: req.body.fName,
        lName: req.body.lName,
        email: req.body.emailaddr,
        password: req.body.password,
        mobilenum: req.body.mobile
    })
    emailAuth = req.body.emailaddr;
    passAuth = req.body.password;
    await db.query(`INSERT INTO users (ip, firstname, lastname, mobile_number, email_id, password) VALUES ('${newuser.ip}','${newuser.fName}','${newuser.lName}', ${newuser.mobilenum} ,'${newuser.email}','${newuser.password}')`);
    res.render("profilepage.ejs", newuser)
}
    catch (err) {
        var opMsg = "User already exists in the database!"
        console.log(err.status);
        res.render("index.ejs",{opMsg})
    }
});

// Takes to login page
app.get("/login",(req,res)=>{
    res.render("login.ejs")
});


// Authenticates user login inputs against database and takes to user profile page.
app.post("/login",async (req,res)=>{
    
    var result = await db.query(`SELECT * FROM users WHERE email_id= '${req.body.emailAuth}' AND password = '${req.body.passAuth}'`);
    
    if (result.rows != "") {
        console.log(result.rows[0].firstname)
    const data = ({
        firstname : result.rows[0].firstname,
        lastname : result.rows[0].lastname,
        emailAddress : result.rows[0].email_id,
        password : result.rows[0].password,
        mobileNumber : result.rows[0].mobile_number
    })
    emailAuth = req.body.emailAuth;
    passAuth = req.body.passAuth;

    res.render("profilepage.ejs", (data))
}
    else{
        var opErr = "Incorrect username or password. Try again!"
    console.log(opErr)
    res.render("login.ejs", {userexists: opErr})
    }
});

// Logout redirects to home page
app.get("/logout",(req,res)=>{
    res.redirect("/")
});

app.get("/delete/:id", async(req,res)=>{
    console.log(req.params.id);
    if (req.params.id.split(',').length > 1) {
        var len = await db.query(`SELECT * FROM connections WHERE _task = ${req.params.id.split(',')[0]}`) ; 
        console.log(len.rows);
        if (len.rows.length > 1){
      await db.query(`DELETE FROM connections WHERE _subtask = ${req.params.id.split(',')[1]}`) ;
      await db.query(`DELETE FROM sub_tasks WHERE id = ${req.params.id.split(',')[1]}`) ;
      res.redirect("/taskrepository")
    }
    else{
        res.redirect("/taskrepository");
    } 
    }
    else{
        await db.query(`DELETE FROM CONNECTIONS WHERE _task = ${req.params.id.split(',')[0]}`) ;
      await db.query(`DELETE FROM sub_tasks WHERE task_id = ${req.params.id.split(',')[0]}`) ; 
      await db.query(`DELETE FROM tasks WHERE id = ${req.params.id.split(',')[0]}`) ; 
      res.redirect("/taskrepository");
    }
})

app.post("/update", async(req,res)=>{
    console.log(req.body.headerID)
if (req.body.dummyVal.split(',').length > 1) {
    await db.query(`UPDATE sub_tasks SET sub_tasks = '${req.body.editVal}' WHERE task_id = ${req.body.dummyVal.split(',')[0]} AND id = ${req.body.dummyVal.split(',')[1]}`) ;
}
else{
     await db.query(`UPDATE tasks SET ${req.body.headerID} = '${req.body.editVal}'  WHERE id = ${req.body.dummyVal.split(',')[0]}`) ;
}
 res.redirect("/taskrepository");
})

// selects local port to run server 
app.listen(port, ()=> {
    console.log(`Server is running at ${port}`);
});
