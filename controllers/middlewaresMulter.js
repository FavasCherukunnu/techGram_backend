const multer = require('multer')
const modelUserRegistration = require('../models/user/user.registration.model');
const bcrypt = require('bcrypt');
const path = require('path')

const storageProfiles = multer.diskStorage(
    {
        destination: (req, file, cb) => {
            cb(null, 'uploads')
        },
        filename: (req, file, cb) => {

            const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
            if (allowedFileTypes.includes(file.mimetype)) {
                const extension = file.mimetype.substring(file.mimetype.indexOf('/') + 1)
                cb(null, `${Date.now()}-${file.originalname}.${extension}`)
            } else {
                let err1 = new Error('err')
                err1.msg = `unSupported format ${file.mimetype}`
                cb(err1);
            }
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