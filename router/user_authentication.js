const express = require('express');
const { userRegistration } = require('../controllers/user_controllers');
const multer = require('multer')
const modelUserRegistration = require('../models/user/user.registration.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { auth } = require('../controllers/middlewares');
const fs = require('fs')
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





authenticationRouter.post('/register',upload.single('image'),async(req, res) => {
    var dat = JSON.parse(req.body.data1)
    const file = req.file;
    delete dat.dataTimeNow
    dat.dob = new Date(`${dat.dob.year}-${dat.dob.month}-${dat.dob.day}`);
    dat.dateTimeNow = new Date();

    // console.log(dat);
    console.log(file);

    dat.image = ''
    dat.password = await bcrypt.hash(dat.password,10);      //encrypting password
    try {
        const user = await modelUserRegistration.create({
            ...dat, image: {
                data: fs.readFileSync(`${__dirname}/../uploads/${file.fieldname}`),
                contentType: file.mimetype,
                size:`${file.size}`
            }
        });
        console.log('image saved');

        let user1 = {...user._doc}
        delete user1.image;
        delete user1.password;

        const token = jwt.sign({email:user.email,id:user._id},SECRET_KEY);
        res.status(201).json({user:user1,token:token,message:'ok'});         //201 created record

    } catch (err) {
        console.log(err);
        if(err.code === 11000){
            return res.status(409).json({message:'already registered'})
        }
        res.status(500).json({message:'something went wrong'})
    }

});
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