const mongoose=require('mongoose')
const sequence = require('mongoose-sequence')
const dotenv = require('dotenv') 
dotenv.config()

mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log("Succesfully connected to the database"))


const userSchema = new mongoose.Schema({
    uname:String,
    email:String,
    phone:Number,
    password:String
})

const listingSchema = new mongoose.Schema({
    email:String,
    title:String,
    address:String,
    rent:String,
    appartmentType:String,
    furnishing:String,
    price:Number,
    deposit:Number,
    builtup:Number,
    preferance:String,
    availability:Number,
    image:String
})
listingSchema.plugin(sequence(mongoose),{inc_field: 'listingid'})

const user = mongoose.model("user",userSchema)
const listing = mongoose.model("listings",listingSchema)

module.exports = {user,listing}