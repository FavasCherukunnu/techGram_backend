const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        description:{type:String,required:true},
        type:{type:String},
        images:[{type:mongoose.SchemaTypes.ObjectId,ref:'image'}],
        wardOId:{type:String,required:true},
        panchayathOId:{type:String,required:true},
        isGallaryPost:{type:Boolean,required:true,default:false},
        owner:{type:mongoose.SchemaTypes.ObjectId,ref:'registration',required:true},
        likes:[{type:mongoose.SchemaTypes.ObjectId,ref:'registration'}],
        isLiked:{type:Boolean,default:false},
        likesCount:{type:Number,default:0}
    },
    {collection:'post',timestamps:true}
)

postSchema.virtual('setLiked').set(
    function(id){
        
        this.likesCount = this.likes.length;
        this.isLiked = this.likes.includes(id);
        this.likes = [];
    }
)

const modelPost = mongoose.model('post',postSchema);

module.exports = modelPost;