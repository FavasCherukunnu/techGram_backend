const express = require('express');
const { userRegistration } = require('../controllers/user_controllers');
const multer = require('multer')
const modelUserRegistration = require('../models/user/user.registration.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { auth } = require('../controllers/middlewares');
const SECRET_KEY = 'techGram123';

const authenticationRouter = express.Router();
//multer- file upload
const storage = multer.diskStorage(
    {
        destination: (req, file, cb) => {
            cb(null, 'uploads')
        },
        filename: (req, file, cd) => {
            cd(null, file.fieldname)
        }

    }
)
const upload = multer({ storage: storage });





authenticationRouter.post('/register',upload.single('image'),userRegistration);
authenticationRouter.post('/login',async (req, res) => {

    const { email, password } = req.body;

    try {
        const user = await modelUserRegistration.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: 'user not found' })
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ message: 'invalid credential' })     //400- bad request
        }

        let user1 = {...user._doc}
        delete user1.image;
        delete user1.password;

        const token = jwt.sign({email:user.email,id:user._id},SECRET_KEY)
        res.status(201).json({user:user1,token:token,message:'ok'})

    }catch (err){
        console.log(err);
        res.status(500).json({message:'something went wrong'})
    }


})
authenticationRouter.get('/getUserInfo',auth,async (req,res)=>{
    const { userId } = req;
    console.log(userId);
    try{
        let user = {...await modelUserRegistration.findById(userId)}._doc;
        delete user.password;
        return res.json({user:user});
    }catch (err){
        console.log(err);
    }
    
})

module.exports = authenticationRouter;