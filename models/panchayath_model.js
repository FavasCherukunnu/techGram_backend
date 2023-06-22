const mongoose = require('mongoose')


const panchayath = new mongoose.Schema(
    {
        title: { type: String, required: true },
        district: { type: String, required: true },
        districtId: { type: Number, required: true },
        block: { type: String, required: true },
        blockId: { type: Number, required: true },
        panchayath: { type: String, required: true },
        panchayathId: { type: Number, required: true },
        id: { type: String, require: true, unique: true },
        president:{
            type:mongoose.SchemaTypes.ObjectId,
            ref:'registration'          //user model name
        }
        // createdAt: { type: Date, default: () => Date.now(), immutable: true },
        // updatedAt: { type: Date, require: true, default: () => Date.now() }
    },
    { collection: 'panchayath',timestamps:true}
)

const modelPanchayath = mongoose.model('panchayath', panchayath)

module.exports = modelPanchayath;