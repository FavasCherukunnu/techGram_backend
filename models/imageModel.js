const mongoose = require('mongoose')


const image = new mongoose.Schema(
    {

        data: {type:Buffer,require:true},
        contentType: {type:String,require:true},
        size: {type:String,require:true},
    },
    { collection: 'image', timestamps: true }
)

const modelImage = mongoose.model('image', image)

module.exports = modelImage;