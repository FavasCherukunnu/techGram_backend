const mongoose = require('mongoose')


const wardProject = new mongoose.Schema(
    {
        title: { type: String,required:true},
        wardNo:{type:Number,required:true},
        wardOId:{ type: String,required:true},
        panchayathOId:{type:String,required:true},
        startDate:{type:Date,required:true},
        endDate:{type:Date},
        fundPassed:{type:String,required:true},
        description:{type:String,required:true},
        owner:{
            type:mongoose.SchemaTypes.ObjectId,
            ref:'registration',
            required:true,         //user model name
        },
        images:[{type:mongoose.SchemaTypes.ObjectId,ref:'image'}],

        // createdAt: { type: Date, default: () => Date.now(), immutable: true },
        // updatedAt: { type: Date, require: true, default: () => Date.now() }
    },
    { collection: 'wardProject',timestamps:true}
)

const modelWardProject = mongoose.model('wardProject', wardProject)

module.exports = modelWardProject;