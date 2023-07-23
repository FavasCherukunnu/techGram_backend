const mongoose = require('mongoose')


const wardProject = new mongoose.Schema(
    {
        title: { type: String, required: true },
        wardNo: { type: Number, required: true },
        wardOId: { type: String, required: true },
        panchayathOId: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        isPanchayathProject: { type: String, required: true, default: 'false' },
        fundPassed: { type: String, required: true },
        description: { type: String, required: true },
        owner: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'registration',
            required: true,         //user model name
        },
        images: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'image' }],
        rating: [
            {
                owner: {
                    type: mongoose.SchemaTypes.ObjectId,
                    ref: 'registration',
                    required:true,
                },
                rating:{type:Number,required:true},
                reviewText :{type:String,required:true},
                dateOfRating:{type:Date,required:true}
            }
        ]
        // createdAt: { type: Date, default: () => Date.now(), immutable: true },
        // updatedAt: { type: Date, require: true, default: () => Date.now() }
    },
    { collection: 'wardProject', timestamps: true }
)

const modelWardProject = mongoose.model('wardProject', wardProject)

module.exports = modelWardProject;