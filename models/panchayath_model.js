const mongoose = require('mongoose')


const panchayath = new mongoose.Schema(
    {
        title: { type: String, required: true },
        district: { type: String, required: true },
        block: { type: String, required: true },
        panchayath: { type: String, required: true },
        id: { type: String, require: true, unique: true },
        createdAt: { type: Date, default: () => Date.now(), immutable: true },
        updatedAt: { type: Date, require: true, default: () => Date.now() }
    },
    { collection: 'panchayath' }
)

const modelPanchayath = mongoose.model('panchayath', panchayath)

module.exports = modelPanchayath;