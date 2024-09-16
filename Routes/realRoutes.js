const express = require('express')
const router = express.Router()
const {user,listing} = require('./../Model/model')
const multer = require('multer')
const path = require('path')
const jwt = require('jsonwebtoken')
const z = require("zod")
const axios = require('axios')
const AWS = require('aws-sdk')
const fs = require('fs')

setInterval(()=>{
    axios.post("https://real-estate-backend-xi8h.onrender.com/login")
},14*60*1000)


const r2 = new AWS.S3({
    endpoint: process.env.R2_ENDPOINT, 
    accessKeyId: process.env.R2_ACCESS_KEY_ID,   
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY, 
    region: 'auto',  
    signatureVersion: 'v4'
});

const bucketName = 'real-estate';  

const listsc = z.object({
    title:z.string(),
    address:z.string(),
    rent:z.string(),
    appartmentType:z.string(),
    furnishing:z.string(),
    price:z.number().int().positive(),
    deposit:z.number().int().positive(),
    builtup:z.number().int().positive(),
    preferance:z.string(),
    availability:z.number().int().positive(),
    image:z.string()
})

const usersc = z.object({
    uname:z.string(),
    email:z.string().email(),
    phone:z.number(),
    password:z.string().min(6,{message:"Must be 6 characters or more"})
})

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"images/")
    }
    ,
    filename:function(req,file,cb)
    {
        cb(null,Date.now()+path.extname(file.originalname))
    }
})

const upload = multer({storage:storage})

async function auth(req,res,next)
{
    try{
    let val = req.headers.authorization
    let parse = await jwt.verify(val,"password")
    const User = await user.findOne({email:parse.email})
    if(User)
    {
        req.email = parse.email
        req.uname = User.uname

        next()
    }
        
    else throw Error("Invalid jwt")
    }
    catch(e)
    {
        res.json({login:true})
    }
}

router.post("/addlisting",auth,upload.single('image'),async (req,res)=>{

    try{
    const file = fs.readFileSync(req.file.path)
    console.log(req.file)
    const params = {
        Bucket:bucketName,
        Key:req.file.filename,
        Body:file,
        ContentType:req.file.mimetype
    }
    const data =await r2.putObject(params).promise()
    console.log(data)
}
catch(e){
    console.log(e)
}
    let value = new listing({
        email:req.email,
        title:req.body.title,
        address:req.body.address,
        rent:req.body["rent/sell"],
        appartmentType:req.body.bhk,
        furnishing:req.body.furnishing,
        price:req.body.rent,
        deposit:req.body.deposit,
        builtup:req.body.builtup,
        preferance:req.body.preference,
        availability:req.body.availability,
        image:"https://pub-a05f01d899644d6e97982812b4e8927b.r2.dev/"+req.file.filename
    })
    await value.save()
    res.json({status:"done"})
})

.post("/newuser",async (req,res)=>{
    
    let value = new user({uname:req.body.uname,
        email:req.body.email,
        phone:req.body.phone,
        password:req.body.password
    })
   await value.save()
   let us = await jwt.sign({uname:req.body.uname,email:req.body.email},"password")
   res.json(us)
})

.get("/validuser",auth,async(req,res)=>{
    let val = await user.findOne({email:req.email})
    //onsole.log(req.body.uname)
    res.json({uname:val.uname})
})

.get("/alllistings", async (req,res)=>{
    const page = req.query.page || 1
    let val = await listing.find({}).skip((page-1)*10).limit(10)
    let noof = await listing.countDocuments()
    total=Math.ceil(noof/10)
    res.json({data:val,total_pages:total})
})

.delete("/deletelistings/:id",auth,async (req,res)=>{
    
    await listing.findOneAndDelete({email:req.email,listingid:req.params.id})
    let va = await listing.find({email:req.email})
    res.json(va)
})

.patch("/editlistings",auth,upload.single("image"),async (req,res)=>{
    try{
        const file = fs.readFileSync(req.file.path)
        const params = {
            Bucket:bucketName,
            Key:req.file.filename,
            Body:file,
            ContentType:req.file.mimetype
        }
        const p = {
            Bucket:bucketName,
            Key:req.file.file
        }
        const data =await r2.putObject(params).promise()
        
    }
    catch(e){
        console.log(e)
    }
    let val= await listing.findOneAndUpdate({email:req.email,listingid:req.body.listingid},{
            title:req.body.title,
            address:req.body.address,
            rent:req.body["rent/sell"],
            appartmentType:req.body.bhk,
            furnishing:req.body.furnishing,
            price:req.body.rent,
            deposit:req.body.deposit,
            builtup:req.body.builtup,
            preferance:req.body.preference,
            availability:req.body.availability,
            image:"https://pub-a05f01d899644d6e97982812b4e8927b.r2.dev/"+req.file.filename
    })
})

.post("/login",async (req,res)=>{
    let us = await user.findOne({email:req.body.email})
    if(us)
    {
        if(us.password == req.body.password){
            let us1 = await jwt.sign({uname:req.body.uname,email:req.body.email},"password")
            res.json({token:us1,error:false,uname:req.body.uname})
        }
        else{
            res.json({error:"Wrong Password"})
        }
    }
    else{
        res.json({error:"Wrong UserName or Password"})
    }
})

.get("/mylisting",auth,async (req,res)=>{
    let listin = await listing.find({email:req.email})
    res.json(listin)
})
.get("/filterlistings",async (req,res)=>{
    const page = req.query.page || 1
    const query = {}
    if(req.query.rent){
        query.rent=req.query.rent
    }
    if(req.query.maxprice || req.query.minprice){
        query.price={}
        query.price.$lte=req.query.maxprice
        query.price.$gte=req.query.minprice
    }
    if(req.query.appartmentType){
        query.appartmentType={}
        query.appartmentType={$in:req.query.appartmentType}
    }
    if(req.query.availability){
        query.availability={}
        query.availability.$lte=req.query.availability
    }
    if(req.query.furnishing){
        query.furnishing={}
        query.furnishing.$in=req.query.furnishing
    }
    
    let value = await listing.find(query).skip((page-1)*10).limit(10)
    let noof = await listing.countDocuments(query)
    total=Math.ceil(noof/10)
    res.json({data:value,total_pages:total})
})
.get("/list/:id",auth,async (req,res)=>{
    let list = await listing.findOne({email:req.email,listingid:req.params.id})
    res.json(list)
})

module.exports = router;