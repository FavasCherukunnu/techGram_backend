const mongoose = require('mongoose');



const userRegistration = new mongoose.Schema(
    {
        fullName: {type:String,required:true},
        address: {type:String,required:true},
        phoneNo: {type:String,required:true},
        email: {type:String,required:true},
        fatherName: {type:String,required:true},
        motherName: {type:String,required:true},
        district: {type:String,required:true},
        taluk: {type:String,required:true},
        panchayath: {type:String,required:true},
        wardNo: {type:String,required:true},
        pinCode: {type:String,required:true},
        dob: { type:Date,required:false },
        adharNo: {type:String,required:true},
        password:{type:String,required:true},
        dateTimeNow: { type:Date,required:true },
        image: {
            data:Buffer,
            contentType:String,
            size:String
        },
        isApproved:{type:Boolean,required:true},
    },
    {collection:'registration'}
)

const modelUserRegistration = mongoose.model('registration',userRegistration)

module.exports = modelUserRegistration; 