
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('./user_controllers');
const modelUserRegistration = require('../models/user/user.registration.model');


const auth = (req, res,next) => {
    let token = req.header('u-auth-token');
    // token = token.split(' ')[1]
    if (!token) {
        return res.status(401).json({ auth:false,message: 'No token, authorization denied' });
    }
    try {
        jwt.verify(token, SECRET_KEY, (error, decoded) => {
            if (error) {
                return res.status(401).json({auth:false, message: 'Token is not valid' });
            } else {
                console.log('user is valid');
                req.userId = decoded.id;
                next();
            }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({auth:false,message:'something went wrong'})
    }
}

const filterUser = async(req,res,next)=>{
    try{
        const user = await modelUserRegistration.findById(req.userId);
        if(user.isApproved===false && user.userType==='user' &&user.isPresident===false){
            return res.status(403).json({ message: 'You are not Approved. Please contact your member' })  //403 - user is known but not autherized
        }else{
            next();
        }
    }catch(err){
        res.status(500).json({ message: 'something went wrong' })
    }
}


const authAdmin = (req, res,next) => {
    let token = req.header('x-auth-token');
    if (!token) {
        console.log('no token found. verification failed');
        return res.status(401).json({ auth:false,message: 'No token, authorization denied' });
    }
    try {
        jwt.verify(token, SECRET_KEY, (error, decoded) => {
            if (error) {
                console.log('user is valid');
                return res.status(401).json({auth:false, message: 'Token is not valid' });
            } else {
                req.id = decoded.id;
                next();
            }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({auth:false,message:'something went wrong'})
    }
}


const isApproved = (req,res)=>{

}


module.exports =  {auth,authAdmin,filterUser}
