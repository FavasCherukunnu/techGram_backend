const multer = require('multer')
const modelUserRegistration = require('../models/user/user.registration.model');
const bcrypt = require('bcrypt');
const path = require('path')

const storageProfiles = multer.diskStorage(
    {
        destination: (req, file, cb) => {
            cb(null, 'uploads/profile')
        },
        filename: async (req, file, cd) => {

            var dat = JSON.parse(req.body.data1)
            // const file = req.file;
            delete dat.dataTimeNow
            dat.dob = new Date(`${dat.dob.year}-${dat.dob.month}-${dat.dob.day}`);
            // dat.dateTimeNow = new Date();

            // console.log(dat);

            dat.image = ''
            dat.password = await bcrypt.hash(dat.password, 10);      //encrypting password

            try{
                const user = await modelUserRegistration.create({
                    ...dat,
                });
                req.userId = user._id;
                cd(null, `${user._id}-${Date.now()}-${file.originalname}`)  
            }catch(err){
                let err1 = new Error(err)
                if (err.code === 11000) {
                    err1.code =11000
                }
                cd(err1)
            }

            // const token = jwt.sign({ email: user.email, id: user._id }, SECRET_KEY);
            // res.status(201).json({ user: user1, token: token, message: 'ok' });        //201 created record


        }

    }
)
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const uploadToFolde1 = multer({ storage: storageProfiles, fileFilter });
const uploadToFolder = uploadToFolde1.single('image');
module.exports = { uploadToFolder };