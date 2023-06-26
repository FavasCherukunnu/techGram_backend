const mongoose = require('mongoose')


const ward = new mongoose.Schema(
    {
        title: { type: String,},
        wardNo:{type:Number,required:true},
        panchayathOId:{type:String,required:true},
        id:{type:String,required:true,unique:true},
        member:{
            type:mongoose.SchemaTypes.ObjectId,
            ref:'registration'          //user model name
        }
        // createdAt: { type: Date, default: () => Date.now(), immutable: true },
        // updatedAt: { type: Date, require: true, default: () => Date.now() }
    },
    { collection: 'ward',timestamps:true}
)

const modelWard = mongoose.model('ward', ward)

module.exports = modelWard;