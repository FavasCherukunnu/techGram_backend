const mongoose = require('mongoose')


const discussionReplay = new mongoose.Schema(
    {
        wardNo:{type:Number,required:true},
        wardOId:{ type: String,required:true},
        panchayathOId:{type:String,required:true},
        description:{type:String,required:true},
        owner:{
            type:mongoose.SchemaTypes.ObjectId,
            ref:'registration',
            required:true,         //user model name
        },
        chatId:{
            type:mongoose.SchemaTypes.ObjectId,
            ref:'post',
            required:true,         //user model name
        },
        // createdAt: { type: Date, default: () => Date.now(), immutable: true },
        // updatedAt: { type: Date, require: true, default: () => Date.now() }
    },
    { collection: 'discussionReplay',timestamps:true}
)

const modeldiscussionReplay = mongoose.model('discussionReplay', discussionReplay)

module.exports = modeldiscussionReplay;