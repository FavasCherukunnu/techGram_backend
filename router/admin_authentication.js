var express = require('express');
const modelAdminRegistration = require('../models/admin/admin.registration.model');
const adminAuthentication = express.Router();
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../controllers/user_controllers');
const { auth, authAdmin } = require('../controllers/middlewares');

adminAuthentication.post('/login',async(req,res)=>{

    const {userName,password} = req.body;
    console.log(req.body);
    try {
        const admin = await modelAdminRegistration.findOne(
            {
                userName:userName,
                password:password
            }
        )
        if(!admin){
            return res.status(404).json({message:'admin not found'})
        }
        const token = jwt.sign({userName:admin.userName,id:admin._id},SECRET_KEY,{expiresIn:'24h'})
        res.set('x-auth-token',token).status(200).json({message:'ok',admin:{userName:admin.userName,id:admin._id}})
    }catch(err){
        console.log(err);
        res.status(500).json({message:'something went wrong'})
    }

});

adminAuthentication.post('/createPanchayath',authAdmin,(req,res)=>{


    res.status(200).json({message:'ok'})
})











module.exports =  adminAuthentication;