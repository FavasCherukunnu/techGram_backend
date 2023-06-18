const express = require('express');
const modelUserRegistration = require('../models/user/user.registration.model');
const fs = require('fs')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const SECRET_KEY = 'techGram123';


const userRegistration = async(req, res) => {
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
        res.status(500).json({message:'something went wrong'})
    }

}


const userLogin = (req,res)=>{
    const {email,password} = req.body;
}

module.exports =  {userRegistration,userLogin,SECRET_KEY}
