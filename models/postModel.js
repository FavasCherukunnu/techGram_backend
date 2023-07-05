const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        description:{type:String,required:true},
        type:{type:String},
        images:[{type:mongoose.SchemaTypes.ObjectId,ref:'image'}],
        wardOId:{type:String,required:true},
        panchayathOId:{type:String,required:true},
        owner:{type:mongoose.SchemaTypes.ObjectId,ref:'registration',required:true}
    },
    {collection:'post',timestamps:true}
)

const modelPost = mongoose.model('post',postSchema);

module.exports = modelPost;