const mongoose = require('mongoose')


const wardGramSabha = new mongoose.Schema(
    {
        chairman: { type: String,required:true},
        convener:{type:String,required:true},
        coOrdinator:{type:String,required:true},
        wardOId:{ type: String,required:true},
        panchayathOId:{type:String,required:true},
        description:{type:Array,required:true},
        date:{type:Date,required:true},
        owner:{
            type:mongoose.SchemaTypes.ObjectId,
            ref:'registration',
            required:true,         //user model name
        },
        // images:[{type:mongoose.SchemaTypes.ObjectId,ref:'image'}],

        // createdAt: { type: Date, default: () => Date.now(), immutable: true },
        // updatedAt: { type: Date, require: true, default: () => Date.now() }
    },
    { collection: 'wardGramSabha',timestamps:true}
)

const modelwardGramSabha = mongoose.model('wardGramSabha', wardGramSabha)

module.exports = modelwardGramSabha;