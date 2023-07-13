const mongoose = require('mongoose')


const wardInstitutes = new mongoose.Schema(
    {
        owner:{
            type:mongoose.SchemaTypes.ObjectId,
            ref:'registration',
            required:true,         //user model name
        },
        title:{type:String,required:true},
        catogery:{type:String,required:true},
        description:{type:String,required:true},
        email:{type:String,required:true},
        phoneNo:{type:String,required:true},
        wardOId:{type:String,required:true},
        panchayathOId:{type:String,required:true},
    },
    { collection: 'wardInstitutes',timestamps:true}
)

const modelwardInstitutes = mongoose.model('wardInstitutes', wardInstitutes)

module.exports = modelwardInstitutes;