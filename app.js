const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const rounds = 10;
const bodyParser = require('body-parser')
const app = express();
const port = process.env.PORT || 3000;
const conn = require('./conn.js')
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'session-key',
    resave: true,
    saveUninitialized: true
  }));


app.get('/',(req,res)=>{
    res.render("home.ejs")
})
app.get('/register',(req,res)=>{
    res.render("register.ejs",{register:"",userAlreadyRegistered: false, mobAlreadyRegistered: false})
})
app.post('/register',async (req,res)=>{
    const { fname,lname, email, password } = req.body;
    let mob_num = req.body.mob_num
    // console.log(fname,lname,mob_num,email,password)
    const username = fname + " " + lname
    // console.log(username)
    const hash = await bcrypt.hash(password, rounds);
    const sql = 'INSERT INTO registration (name,mob_num, email, password) VALUES (?, ?, ?, ?)';
    conn.query(`select email,mob_num from registration`,(e,r)=>{
        mob_num = mob_num.substring(1)
        const isEmailRegistered = r.some((row) => row.email === email);
        const isMobRegistered = r.some((row) => row.mob_num == mob_num);
        if (isEmailRegistered) {
          res.render('register.ejs', { register:"",userAlreadyRegistered: true, mobAlreadyRegistered: false });
        }
        else if(isMobRegistered){
          res.render('register.ejs', { register:"",userAlreadyRegistered: false, mobAlreadyRegistered: true });
        }
        else{
            conn.query(sql, [username,mob_num, email, hash], (err, result) => {
                if (err) throw err;
                console.log('User registered:', result);
                res.render("register.ejs",{register:"Registration Successfull", userAlreadyRegistered: false, mobAlreadyRegistered: false})
              });
        }
      })

})

app.get('/login',(req,res)=>{
    res.render("login.ejs",{error:""})
})
app.post('/login',(req,res)=>{
   const {email,password} = req.body
   const sql = `SELECT * from registration WHERE email=?`
   conn.query(sql,[email],async (e,r)=>{
    if(e){
        console.log(e)
    }
    else{
        name = r[0].name.split(' ')[0]
        const passwordMatch = await bcrypt.compare(password, r[0].password);
        if(passwordMatch){
            if(r[0].attempt>0){
               if(r[0].status=="active"){
                if(r[0].role=="user"){
                    res.render("user.ejs",{message:"",user_id:r[0].user_id,username:name, fullname:r[0].name, mobile:r[0].mob_num, email:r[0].email})
                   }
                   else{
                    res.render("admin.ejs",{username:name,user_id:r[0].user_id})
                   }
               }
               else{
                res.render("login.ejs",{error:"Your account is not active yet"})
               }
            }
            else{
                res.render("login.ejs",{error:"Your account is frozen"})
            }
        }
        else{
            if(r[0].attempt>0){
                const sql = `UPDATE registration SET attempt = attempt - 1 WHERE email = ?`
            conn.query(sql,[r[0].email],(e,re)=>{
                if(e)
                {
                    console.log(e)
                }
                else{
                    console.log(r[0].attempt)

                    res.render("login.ejs",{error:"Incorrect Password. Remaining attempt = "+ r[0].attempt})
                }
            })
            }
            else{
                res.render("login.ejs",{error:"0 Attempts Remaining. Contact Customer Care"})
            }
        }
    }
   })
  
})
app.get("/personal",(req,res)=>{
    const userId = req.query.user_id;
    const uname = req.query.name
    console.log(userId)
    console.log(uname)
    const sqlq = `select * from registration where user_id=?`
   conn.query(sqlq,[userId],(e,r)=>{
    if(e){
     console.log(e)
    }else{
           const sql = `select * from covidpos where mob_num=?`
   conn.query(sql,[r[0].mob_num],(e,result)=>{
       if(e){
           console.log(e)
       }
       else{
       if(result.length>0){
        res.render("userpersonal.ejs",{record:"",username:uname,email:result[0].email,address:result[0].address,mobile:result[0].mob_num,location:result[0].location, symptoms:result[0].symptoms, age:result[0].age})
       }
       else{
        res.render("userpersonal.ejs",{record:"No data found",username:uname,email:"",address:"",mobile:"",location:"", symptoms:"", age:""})
       }
       }
   })
    }
   })
})
app.get("/send",(req,res)=>{
    const userId = req.query.user_id;
    const uname = req.query.name
    res.render("send.ejs",{userId:userId,username:uname,message:"",error:""})
})
app.get("/terms",(req,res)=>{
    res.render("terms.ejs")
})
app.post("/covpos",(req,res)=>{
    const {name,mobile,email,address,location,age,symptoms} = req.body
    const sql = 'INSERT INTO covidpos(name,mob_num, email, address, age,location, symptoms) VALUES (?, ?, ?, ?,?,?,?)';
    conn.query(sql,[name,mobile,email,address,age,location,symptoms],(e,r)=>{
        if(e){
            console.log(e)
        }else{
            res.render("user.ejs",{message:"",user_id:"",username:"", fullname:"", mobile:"", email:""})
        }
    })
})
app.post("/sendUserDetails",(req,res)=>{
    const {userId,name,uemail,mob_num,remail} = req.body
    console.log(userId,name,uemail,mob_num,remail)
    const sql = `select * from registration where email = ?`
    conn.query(sql,[remail],(e,r)=>{
        if(r.length==0){
            const message = `The admin having id = ${userId} tried to send your details`
            const sql2 = `insert into useralert(email,message) VALUES (?, ?)`
            conn.query(sql2,[uemail,message],(e,r)=>{
                if(e){
                    console.log(e)
                }else{
                    console.log("Data Inserted")
                    const sql2 = `select * from registration where user_id = ?`
    conn.query(sql2,[userId],(e,result)=>{
console.log(result)
        res.render("send.ejs",{message:"",error:"Suspicious Activity Found",username:"",userId:""})
    })
                  
                }
            })
        }
        else{
            res.send("DATA INSERTED SUCCESSFULLY")
        }
    })
})
app.get("/umessage",(req,res)=>{
    const user_id = req.query.user_id;
    const name = req.query.name
    console.log(name)
    const sql = "select * from registration where user_id = ?"
    conn.query(sql,[user_id],(e,r)=>{
        if(e){
            throw e
        }
        else{
            const sql2 = 'select * from useralert where email = ?'
            conn.query(sql2,[r[0].email],(e,result)=>{
                if(result.length==0){
                    res.render("message.ejs",{message:"No messages Yet",user_id:user_id,username:name})
                }
                else{
                    res.render("message.ejs",{message:result[0].message,user_id:user_id,username:name})
                }
            })
        }
    })
})
app.get("/deleteRecord", (req, res) => {
    const mobile = req.query.mobile;
  
    const deleteSql = "DELETE FROM covidpos WHERE mob_num = ?";
  
    conn.query(deleteSql, [mobile], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.render("user.ejs",{message:"",user_id:"",username:"", fullname:"", mobile:"", email:""})
      }
    });
  });
  app.get('/activateuser',(req,res)=>{
    const {user_id,name} = req.query
    const sql = 'SELECT * FROM registration WHERE status = "deactive" AND role = "user"';
    conn.query(sql, (err, result) => {
        console.log(result)
        if (err) throw err;
        else if(result.length==0){
            res.render('activateuser.ejs', { users: result, message: 'No Data found',user_id:user_id,username:name, active:"" });
        }
        else{
            res.render("activateuser.ejs",{ users: result, message: '',user_id:user_id,username:name, active:""})
        }
      });
  })
  app.get('/deactivateuser',(req,res)=>{
    const {user_id,name} = req.query
    const sql = 'SELECT * FROM registration WHERE status = "active" AND role = "user"';
    conn.query(sql, (err, result) => {
        if (err) throw err;
        else if(result.length==0){
            res.render('deactivateuser.ejs', { users: result, message: 'No Data found',user_id:user_id,username:name,deactive:"" });
        }
        else{
            res.render("deactivateuser.ejs",{ users: result, message: '',user_id:user_id,username:name, deactive:""})
        }
      });
  })
  app.get('/activate',(req,res)=>{
    const {admin_id,user_id,name} = req.query
    const sql = 'UPDATE registration SET status = ? WHERE user_id = ?'
    const values = ['active',user_id];
    conn.query(sql, values, (e,r) => {
        if(e){
            console.log(e)
        }else{
    const sql2 = 'SELECT * FROM registration WHERE status = "deactive" AND role = "user"';

            conn.query(sql2, (err, result) => {
                if (err) throw err;
                else if(result.length==0){
                    res.render("activateuser.ejs",{users:result,message:"Data not found",user_id:user_id,username:name,active:"Activated Successfully"})
                }
                else{
                    res.render("activateuser.ejs",{users:result,message:"",user_id:user_id,username:name,active:"Activated Successfully"})
                }
              });
        }
    })
  })
  app.get('/deactivate',(req,res)=>{
    const {admin_id,user_id,name} = req.query
    const sql = 'UPDATE registration SET status = ? WHERE user_id = ?'
    const values = ['deactive',user_id];
    conn.query(sql, values, (e,r) => {
        if(e){
            console.log(e)
        }else{
    const sql2 = 'SELECT * FROM registration WHERE status = "active" AND role = "user"';

            conn.query(sql2, (err, result) => {
                if (err) throw err;
                else if(result.length==0){
                    res.render("deactivateuser.ejs",{users:result,message:"Data not found",user_id:user_id,username:name,deactive:"User Deactivated Successfully"})
                }
                else{
                    res.render("deactivateuser.ejs",{users:result,message:"",user_id:user_id,username:name,deactive:"User Deactivated Successfully"})
                }
              });
        }
    })
  })
  app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      } else {
        res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.header('Expires', '0');
        res.header('Pragma', 'no-cache');
        
        res.redirect('/login');
      }
    });
  });
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  