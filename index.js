const {userSchema,listingSchema} = require("./Model/model")
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
const router = require('./Routes/realRoutes')
const path = require('path')

app.use(express.static("images"));
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())
app.use("/",router)
app.use((error,req,res,next)=>{
    res.send("Internal Error")
})

app.listen(80,()=>{
    console.log("listening to port")
})