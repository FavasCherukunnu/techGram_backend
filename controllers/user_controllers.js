const express = require('express');
const modelUserRegistration = require('../models/user/user.registration.model');
const fs = require('fs')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const SECRET_KEY = 'techGram123';


const userRegistration = ()=>{};


const userLogin = (req,res)=>{
    const {email,password} = req.body;
}

module.exports =  {userRegistration,userLogin,SECRET_KEY}
