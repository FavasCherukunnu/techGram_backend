const mongoose = require('mongoose')


const wardComplaint = new mongoose.Schema(
    {
        title: { type: String,required:true},
        wardNo:{type:Number,required:true},
        wardOId:{ type: String,required:true},
        panchayathOId:{type:String,required:true},
        description:{type:String,required:true},
        isSolved:{type:String,required:true,default:false},
        owner:{
            type:mongoose.SchemaTypes.ObjectId,
            ref:'registration',
            required:true,         //user model name
        },
        images:[{type:mongoose.SchemaTypes.ObjectId,ref:'image'}],

        // createdAt: { type: Date, default: () => Date.now(), immutable: true },
        // updatedAt: { type: Date, require: true, default: () => Date.now() }
    },
    { collection: 'wardComplaint',timestamps:true}
)

const modelwardComplaint = mongoose.model('wardComplaint', wardComplaint)

module.exports = modelwardComplaint;