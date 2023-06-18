
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('./user_controllers');

const auth = (req, res,next) => {
    let token = req.header('x-auth-token');
    // token = token.split(' ')[1]
    console.log(token);
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




module.exports =  {auth,authAdmin}
