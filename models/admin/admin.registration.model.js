const mongoose = require('mongoose')


const adminRegistration = new mongoose.Schema(
    {
        userName:{type:String,required:true,unique:true},
        password:{type:String,required:true},
    },
    {collection:'admin_registration'}
)

const modelAdminRegistration = mongoose.model('admin_registration',adminRegistration);
module.exports = modelAdminRegistration;