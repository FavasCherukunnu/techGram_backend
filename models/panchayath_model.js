const mongoose = require('mongoose')


const panchayath = new mongoose.Schema(
    {
        title:{type:String,required:true},
        district:{type:String,required:true},
        block:{type:String,required:true},
        panchayath:{type:String,required:true},
    },
    {collection:'panchayath'}
)

const modelPanchayath = mongoose.model('panchayath',panchayath)

module.exports = modelPanchayath;