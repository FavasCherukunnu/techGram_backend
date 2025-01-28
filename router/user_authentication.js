const express = require('express');
const { userRegistration } = require('../controllers/user_controllers');
const multer = require('multer')
const modelUserRegistration = require('../models/user/user.registration.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { compress } = require('compress-images/promise');
const { auth, filterUser } = require('../controllers/middlewares');
const fs = require('fs');
const { stringToDate } = require('../staticFiles/functions');
const modelWard = require('../models/ward_model');
const { uploadToFolder } = require('../controllers/middlewaresMulter');
const modelPost = require('../models/postModel');
const modelImage = require('../models/imageModel');
const sharp = require('sharp');
const modelWardProject = require('../models/ward_projectModel');
const modelwardAnnoucement = require('../models/ward_announcementModel');
const modelwardGramSabha = require('../models/ward_GramSasbhaModel');
const modelwardInstitutes = require('../models/ward_Institute');
const modelPanchayath = require('../models/panchayath_model');
const modelwardComplaint = require('../models/modelWardComplaints');
const modeldiscussionReplay = require('../models/discussion_replay_model');
const { default: mongoose } = require('mongoose');
const { title } = require('process');
const SECRET_KEY = 'techGram123';

const authenticationRouter = express.Router();
//multer- file upload
const storage = multer.diskStorage(
    {
        destination: (req, file, cb) => {
            cb(null, 'uploads')
        },
        filename: (req, file, cd) => {
            const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
            if (allowedFileTypes.includes(file.mimetype)) {
                cd(null, file.fieldname);
            } else {
                let err1 = new Error('err')
                err1.msg = `unSupported format ${file.mimetype}`
                cb(err1);
            }
        }

    }
)
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};
const storageMultiple = multer.diskStorage(
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

const upload = multer({ storage: storage });
const uploadMultiple1 = multer({ storage: storageMultiple });
const uploadMultiple = uploadMultiple1.array('images');
authenticationRouter.get('/auth', auth, async (req, res) => {
    const user = await modelUserRegistration.findById(req.userId, { image: 0, password: 0 });
    res.status(200).json({ message: 'ok', user: user })
})



authenticationRouter.post('/dev/register', (req, res) => {


    uploadToFolder(req, res, async (err) => {

        try {
            if (err) {
                throw err;
            }
            let images = req.file;
            var dat = JSON.parse(req.body.data1)
            delete dat.dataTimeNow;
            const imgPath = `${__dirname}/../uploads/${images.filename}`;
            const imgCompressFolder = `${__dirname}/../uploads/compressed/`
            const imgCompressedPath = `${imgCompressFolder}${images.filename}`
            //compressing image
            await compress({
                source: imgPath,
                destination: imgCompressFolder,
                enginesSetup: {
                    jpg: { engine: 'mozjpeg', command: ['-quality', '20'] },
                    png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] },
                }
            });
            //resize
            fs.writeFileSync(imgCompressedPath, await sharp(imgCompressedPath).resize({ width: 100 }).toBuffer())
            const img = await modelImage.create({
                data: fs.readFileSync(imgPath),
                compressedData: fs.readFileSync(imgCompressedPath),
                contentType: images.mimetype,
                size: images.size,
            });

            dat.dob = new Date(`${dat.dob.year}-${dat.dob.month}-${dat.dob.day}`);

            dat.image = ''
            dat.password = await bcrypt.hash(dat.password, 10);

            const user = await modelUserRegistration.create({
                ...dat,
                image1: img._id,
            });
            console.log('image saved');

            let user1 = { ...user._doc }
            delete user1.image;
            delete user1.password;

            const token = jwt.sign({ email: user.email, id: user._id }, SECRET_KEY);
            res.status(201).json({ user: user1, token: token, message: 'ok' });

        } catch (err) {
            console.log(err);
            if (err.code === 11000) {
                return res.status(409).json({ message: 'already registered' })
            }
            return res.status(500).json({ message: 'something went wrong' })
        }

    });

})

authenticationRouter.post('/dev/editUser', auth, async (req, res) => {

    uploadToFolder(req, res, async (err) => {

        try {
            if (err) {
                throw err;
            }
            let images = req.file;
            var dat = JSON.parse(req.body.data1)
            delete dat.dataTimeNow;
            const id = dat._id;
            dat.dob = new Date(`${dat.dob.year}-${dat.dob.month}-${dat.dob.day}`);
            const user = await modelUserRegistration.findById(id);


            const isValid = await bcrypt.compare(dat.password, user.password);
            if (!isValid) {
                return res.status(400).json({ message: 'invalid credential' })     //400- bad request
            }

            if (dat.image !== '' && Object.keys(dat.image).length !== 0) {
                delete dat.password;
                const imgPath = `${__dirname}/../uploads/${images.filename}`;
                const imgCompressFolder = `${__dirname}/../uploads/compressed/`
                const imgCompressedPath = `${imgCompressFolder}${images.filename}`
                //compressing image
                await compress({
                    source: imgPath,
                    destination: imgCompressFolder,
                    enginesSetup: {
                        jpg: { engine: 'mozjpeg', command: ['-quality', '20'] },
                        png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] },
                    }
                });
                //resize
                fs.writeFileSync(imgCompressedPath, await sharp(imgCompressedPath).resize({ width: 100 }).toBuffer())

                const img = await modelImage.findById(user.image1);
                await img.updateOne({
                    data: fs.readFileSync(imgPath),
                    compressedData: fs.readFileSync(imgCompressedPath),
                    contentType: images.mimetype,
                    size: images.size,
                }, { runValidators: true })
                // const img = await modelImage.create({
                //     data: fs.readFileSync(imgPath),
                //     compressedData: fs.readFileSync(imgCompressedPath),
                //     contentType: images.mimetype,
                //     size: images.size,
                // })
                await user.updateOne({
                    ...dat,
                    image1: img._id
                }, { runValidators: true });

            } else {
                delete dat.image;
                delete dat.password;
                await user.updateOne({
                    ...dat
                }, { runValidators: true });
            }
            return res.status(201).json({ message: 'ok' });         //201 created record



        } catch (err) {
            console.log(err);
            if (err.code === 11000) {
                return res.status(409).json({ message: 'already registered' })
            }
            res.status(500).json({ message: 'something went wrong' })
        }
    })

})

authenticationRouter.post('/register', upload.single('image'), async (req, res) => {
    var dat = JSON.parse(req.body.data1)
    const file = req.file;
    delete dat.dataTimeNow
    dat.dob = new Date(`${dat.dob.year}-${dat.dob.month}-${dat.dob.day}`);
    // dat.dateTimeNow = new Date();

    // console.log(dat);

    dat.image = ''
    dat.password = await bcrypt.hash(dat.password, 10);      //encrypting password
    try {
        const user = await modelUserRegistration.create({
            ...dat, image: {
                data: fs.readFileSync(`${__dirname}/../uploads/${file.fieldname}`),
                contentType: file.mimetype,
                size: `${file.size}`
            }
        });
        console.log('image saved');

        let user1 = { ...user._doc }
        delete user1.image;
        delete user1.password;

        const token = jwt.sign({ email: user.email, id: user._id }, SECRET_KEY);
        res.status(201).json({ user: user1, token: token, message: 'ok' });         //201 created record

    } catch (err) {
        console.log(err);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'already registered' })
        }
        res.status(500).json({ message: 'something went wrong' })
    }

});

authenticationRouter.post('/editUser', upload.single('image'), auth, async (req, res) => {
    var dat = JSON.parse(req.body.data1)
    const file = req.file;
    delete dat.dataTimeNow
    dat.dob = new Date(`${dat.dob.year}-${dat.dob.month}-${dat.dob.day}`);
    // dat.dateTimeNow = new Date();
    const id = dat._id;
    console.log(dat);

    try {

        const user = await modelUserRegistration.findById(id);

        const isValid = await bcrypt.compare(dat.password, user.password);
        if (!isValid) {
            return res.status(400).json({ message: 'invalid credential' })     //400- bad request
        }

        if (dat.image !== '' && Object.keys(dat.image).length !== 0) {
            delete dat.password;
            await user.updateOne({
                ...dat, image: {
                    data: fs.readFileSync(`${__dirname}/../uploads/${file.fieldname}`),
                    contentType: file.mimetype,
                    size: `${file.size}`
                }
            }, { runValidators: true });

        } else {
            delete dat.image;
            delete dat.password;
            await user.updateOne({
                ...dat
            }, { runValidators: true });
        }
        return res.status(201).json({ message: 'ok' });         //201 created record



    } catch (err) {
        console.log(err);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'already registered' })
        }
        res.status(500).json({ message: 'something went wrong' })
    }

})

authenticationRouter.post('/login', async (req, res) => {

    const { email, password } = req.body;

    try {
        const user = await modelUserRegistration.findOne({ email: email }, { image: 0 });
        if (!user) {
            return res.status(404).json({ message: 'user not found' })
        }
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(400).json({ message: 'invalid credential' })     //400- bad request
        }
        if (user.isApproved === false && user.userType === 'user' && user.isPresident === false) {
            return res.status(403).json({ message: 'You are not Approved. Please contact your member' })  //403 - user is known but not autherized
        }

        let user1 = { ...user._doc }
        delete user1.password;

        const token = jwt.sign({ email: user.email, id: user._id }, SECRET_KEY)
        res.status(201).json({ user: user1, token: token, message: 'ok' })

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'something went wrong' })
    }


})


authenticationRouter.get('/getUserInfo', auth, filterUser, async (req, res) => {
    const { userId } = req;
    try {
        let user = await modelUserRegistration.findById(userId, { password: 0, image: 0 });
        // delete user.password;
        return res.status(200).json({ message: 'ok', user: user });
    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }

})

authenticationRouter.get('/getUserById/:id', auth, filterUser, async (req, res) => {
    const id = req.params.id;

    try {
        const user = await modelUserRegistration.findById(id, { password: 0, image: 0 });
        return res.status(200).json({ message: 'ok', user: user });

    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.get('/getProfileImageById/:id', auth, async (req, res) => {
    const { id } = req.params;
    console.log(id);
    try {
        const image = await modelUserRegistration.findById(id, { image1: 1 });
        const image1 = await modelImage.findById(image.image1);
        return res.status(200).json({ message: 'ok', image: image1 });

    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.get('/getCompressedProfileImageById/:id', auth, async (req, res) => {
    const { id } = req.params;
    console.log(id);
    try {
        const image = await modelUserRegistration.findById(id, { image1: 1 });
        const image1 = await modelImage.findById(image.image1, { data: 0 });
        return res.status(200).json({ message: 'ok', image: image1 });

    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.get('/getImageById/:id', auth, async (req, res) => {
    const { id } = req.params;
    console.log(id);
    try {
        const image = await modelImage.findById(id);
        return res.status(200).json({ message: 'ok', image: image });

    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.get('/getCompressedImageById/:id', auth, async (req, res) => {
    const { id } = req.params;
    console.log(id);
    try {
        const image = await modelImage.findById(id, { data: 0 });


        return res.status(200).json({ message: 'ok', image: image });

    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.post('/approveUserById', auth, filterUser, async (req, res) => {
    const { id } = req.body;
    try {
        let res1 = await modelUserRegistration.findByIdAndUpdate(id, { isApproved: true, isRejected: false })
        return res.status(200).json({ message: 'ok' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.post('/rejectUserById', auth, filterUser, async (req, res) => {
    const { id } = req.body;
    try {
        let res1 = await modelUserRegistration.findByIdAndUpdate(id, { isApproved: false, isRejected: true })
        return res.status(200).json({ message: 'ok' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.get('/getUsersBasedOnPachayathId', auth, filterUser, async (req, res) => {
    const { panchayathOId, key } = req.query;
    try {

        let userList = await modelUserRegistration.find(
            {
                $and: [{ panchayathOId: panchayathOId }, { $or: [{ adharNo: new RegExp(`^${key}`) }, { fullName: new RegExp(`^${key}`) }] }]
            }, { image: 0, password: 0 }
        )
        res.status(200).json({ message: 'ok', users: userList })
    } catch (err) {
        res.status(500).json({ message: 'something went wrong' })
    }
})

authenticationRouter.post('/createWard', auth, filterUser, async (req, res) => {

    const ward = req.body.ward;
    try {
        //check the member is already in another ward
        const wardWithMember = await modelWard.find({ member: ward.member })
        if (wardWithMember.length !== 0) {
            const err = new Error('selected member is already member in another ward');
            err.msg = 'selected member is already member in another ward'
            throw err;
        }
        const wardModel = await modelWard(
            { ...ward }
        )
        await wardModel.save();
        const userModel = await modelUserRegistration.findById(ward.member);
        userModel.userType = 'member';
        userModel.save();
        return res.status(201).json({ message: 'ok', ward: ward })       //created record
    } catch (err) {
        console.log(err);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'already Created the ward. You can edit' })
        }
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: 'something went wrong' })
    }
})

authenticationRouter.get('/searchWard', auth, filterUser, async (req, res) => {

    let { key, panchayathOId } = req.query;
    try {

        const wards = await modelWard.find({
            $and: [
                { panchayathOId: panchayathOId },
                (key?{ wardNo: { $regex: `^${key}`, $options: 'i' } }:{})
            ]
        }).sort({ wardNo: 1 }).populate('member', { fullName: 1 });

        res.status(200).json({ message: 'ok', wards: wards })


    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'something went wrong' })
    }
})

authenticationRouter.get('/getWardById/:id', auth, filterUser, async (req, res) => {
    var id = req.params.id;
    console.log(id);
    try {
        const ward = await modelWard.findById(id).populate('member', { fullName: 1, adharNo: 1, wardNo: 1 });
        return res.status(200).json({ message: 'ok', ward: ward })
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.get('/getWardBywardOId/:id', auth, filterUser, async (req, res) => {
    var id = req.params.id;
    console.log(id);
    try {
        const objectId = mongoose.Types.ObjectId;
        const ward = await modelWard.aggregate([
            { $match: { id: id } },
            {
                $lookup: {
                    from: 'registration',
                    localField: 'member',
                    foreignField: "_id",
                    as: 'member',
                    pipeline: [
                        { "$project": { "fullName": 1, 'adharNo': 1, 'wardNo': 1, 'image1': 1 } }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'panchayath',
                    localField: 'panchayathOId',
                    foreignField: "id",
                    as: 'panchayath',
                }
            },
            { $unwind: '$panchayath' },
            { $unwind: '$member' }
        ]);
        return res.status(200).json({ message: 'ok', ward: ward[0] })
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }
});

authenticationRouter.get('/getPanchayathByPanchayathOId/:id', auth, async (req, res) => {
    const { id } = req.params;
    try {
        let panchayath = await modelPanchayath.findOne({ id: id }).populate("president", { image: 0, password: 0 });
        if (!panchayath) {
            throw Error('No such Panchayat')
        }
        return res.status(200).json({ message: 'ok', panchayath: panchayath })
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.get('/getPanchayathById/:id', auth, async (req, res) => {
    const { id } = req.params;
    try {
        let panchayath = await modelPanchayath.findById(id).populate("president", { image: 0, password: 0 });
        if (!panchayath) {
            throw Error('No such Panchayat')
        }
        return res.status(200).json({ message: 'ok', panchayath: panchayath })
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.post('/updateWardById/:id', auth, filterUser, async (req, res) => {
    const { id } = req.params;
    const newWard = req.body.ward;

    try {

        let oldWard = await modelWard.findById(id);
        if (newWard.member !== oldWard.member.toString()) {
            const wardWithMember = await modelWard.find({ member: newWard.member })
            if (wardWithMember.length !== 0) {
                const err = new Error('selected member is already member in another ward');
                err.msg = 'selected member is already member in another ward'
                throw err;
            }
            //removing usertype member
            await modelUserRegistration.findById(oldWard.member).updateOne({ userType: 'user' });
            await modelUserRegistration.findById(newWard.member).updateOne({ userType: 'member' });
        }


        await oldWard.updateOne(newWard, { runValidators: true })

        return res.status(200).json({ message: 'ok', ward: oldWard })

    } catch (err) {
        console.log(err);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'already Created the ward. You can edit' })
        }
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }

})

authenticationRouter.post('/deleteWard', auth, filterUser, async (req, res) => {
    const { wardId } = req.body;
    try {
        const resmodel = await modelWard.findById(wardId);

        if (!resmodel) {
            const err = new Error('Failed To delete Ward');
            err.msg = 'Failed To Delete Ward'
            throw err
        }
        //change member to user
        const usermodel = await modelUserRegistration.findByIdAndUpdate(resmodel.member, { userType: 'user' }, { runValidators: true });
        resmodel.deleteOne();
        return res.status(200).json({ message: 'ok' });
    } catch (err) {
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.get('/getUsersUnApproved/:id', auth, filterUser, async (req, res) => {
    const { id } = req.params;
    const { isRejected=false, isApproved=false, key } = req.query;
    const isrejected = isRejected === 'true'||isRejected==='True' ? true : false;
    const isapproved = isApproved === 'true'||isApproved==='True' ? true : false;
    try {


        const users = await modelUserRegistration.find({
            $and: [
                { wardOId: id },
                { isApproved: isapproved }, // Assuming `isApproved` is a boolean
                { isRejected: isrejected }, // Assuming `isRejected` is a boolean
                { fullName: new RegExp(key) }
            ]
        }, { image: 0, password: 0 });
        return res.status(200).json({ message: 'ok', users: users, });


    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }

})

authenticationRouter.post('/wardInfoPost', auth, async (req, res) => {

    uploadMultiple(req, res, async (err) => {

        try {
            if (err) {
                throw err;
            }
            let images = req.files;
            let dat = { ...req.body };
            delete dat.images;
            const post = await modelPost.create(
                dat
            )

            for (let i = 0; i < images.length; i++) {
                const imgPath = `${__dirname}/../uploads/${images[i].filename}`;
                const imgCompressFolder = `${__dirname}/../uploads/compressed/`
                const imgCompressedPath = `${imgCompressFolder}${images[i].filename}`
                //compressing image
                await compress({
                    source: imgPath,
                    destination: imgCompressFolder,
                    enginesSetup: {
                        jpg: { engine: 'mozjpeg', command: ['-quality', '20'] },
                        png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] },
                    }
                });
                //resize
                fs.writeFileSync(imgCompressedPath, await sharp(imgCompressedPath).resize({ width: 300 }).toBuffer())
                //saveToDb
                const img = await modelImage.create({
                    data: fs.readFileSync(imgPath),
                    compressedData: fs.readFileSync(imgCompressedPath),
                    contentType: images[i].mimetype,
                    size: images[i].size,
                })
                post.images.push(img._id);
                await post.save();

            }
            return res.status(200).json({ message: 'ok' })
        } catch (err) {
            console.log(err);
            if (err.msg) {
                return res.status(500).json({ message: err.msg })
            }
            return res.status(500).json({ message: "something went wrong" })
        }
    })


})

authenticationRouter.post('/likeDiscussionPost', auth, async (req, res) => {
    try {
        const { postId, userId } = req.body.data;
        console.log(req.body.data)
        const dat = await modelPost.findById(postId);
        dat.likes.push(userId);
        await dat.save();
        dat.setLiked = userId;
        return res.status(200).json({ message: 'ok', likes: dat.likesCount, isLiked: dat.isLiked })

    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.post('/DislikeDiscussionPost', auth, async (req, res) => {
    try {
        const { postId, userId } = req.body.data;
        console.log(postId);
        const dat = await modelPost.findByIdAndUpdate(postId, {
            $pullAll: {
                likes: [userId]
            }
        }, { new: true });
        await dat.save();
        dat.setLiked = userId;
        return res.status(200).json({ message: 'ok', likes: dat.likesCount, isLiked: dat.isLiked })

    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.post('/addDiscussionReplay', auth, async (req, res) => {

    try {

        const replay = await modeldiscussionReplay.create({
            ...req.body.data
        });
        await replay.save();

        return res.status(200).json({ message: 'ok' })
    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.post('/panchayathInfoPost', auth, async (req, res) => {

    uploadMultiple(req, res, async (err) => {

        try {
            if (err) {
                throw err;
            }
            let images = req.files;
            let dat = { ...req.body };
            delete dat.images;
            const post = await modelPost.create(dat)

            for (let i = 0; i < images.length; i++) {
                const imgPath = `${__dirname}/../uploads/${images[i].filename}`;
                const imgCompressFolder = `${__dirname}/../uploads/compressed/`
                const imgCompressedPath = `${imgCompressFolder}${images[i].filename}`
                //compressing image
                await compress({
                    source: imgPath,
                    destination: imgCompressFolder,
                    enginesSetup: {
                        jpg: { engine: 'mozjpeg', command: ['-quality', '20'] },
                        png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] },
                    }
                });
                //resize
                fs.writeFileSync(imgCompressedPath, await sharp(imgCompressedPath).resize({ width: 300 }).toBuffer())
                //saveToDb
                const img = await modelImage.create({
                    data: fs.readFileSync(imgPath),
                    compressedData: fs.readFileSync(imgCompressedPath),
                    contentType: images[i].mimetype,
                    size: images[i].size,
                })
                post.images.push(img._id);
                await post.save();

            }
            return res.status(200).json({ message: 'ok' })
        } catch (err) {
            console.log(err);
            if (err.msg) {
                return res.status(500).json({ message: err.msg })
            }
            return res.status(500).json({ message: "something went wrong" })
        }
    })


})

authenticationRouter.post('/addWardProject', auth, filterUser, async (req, res) => {
    uploadMultiple(req, res, async (err) => {

        try {

            if (err) {
                throw err;
            }


            let images = req.files;
            let data = req.body;
            let endDate;
            let startDate;
            console.log(data);
            endDate = data.endDate !== '' ? new Date(data.endDate) : null
            startDate = new Date(data.startDate);
            if (startDate.toString() === 'Invalid Date' || (endDate?.toString() === 'Invalid Date')) {
                const err1 = new Error('date is not in format');
                err1.msg = 'date is not valid';
                throw err1;
            }

            const project = await modelWardProject.create({
                ...data,
                startDate: startDate,
                endDate: endDate,
                images: [],
            })

            for (let i = 0; i < images.length; i++) {
                const imgPath = `${__dirname}/../uploads/${images[i].filename}`;
                const imgCompressFolder = `${__dirname}/../uploads/compressed/`
                const imgCompressedPath = `${imgCompressFolder}${images[i].filename}`
                //compressing image
                await compress({
                    source: imgPath,
                    destination: imgCompressFolder,
                    enginesSetup: {
                        jpg: { engine: 'mozjpeg', command: ['-quality', '20'] },
                        png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] },
                    }
                });
                //resize
                fs.writeFileSync(imgCompressedPath, await sharp(imgCompressedPath).resize({ width: 300 }).toBuffer())
                //saveToDb
                const img = await modelImage.create({
                    data: fs.readFileSync(imgPath),
                    compressedData: fs.readFileSync(imgCompressedPath),
                    contentType: images[i].mimetype,
                    size: images[i].size,
                })
                project.images.push(img._id);
                await project.save();

            }
            return res.status(200).json({ message: 'ok' })
        } catch (err) {
            console.log(err);
            if (err.msg) {
                return res.status(500).json({ message: err.msg })
            }
            return res.status(500).json({ message: "something went wrong" })
        }

    });
})

authenticationRouter.post('/addProjectRatingUser/:id', auth, filterUser, async (req, res) => {
    try {
        const objectId = mongoose.Types.ObjectId;
        const { id } = req.params;
        await modelWardProject.updateOne(
            { _id: new objectId(id) },
            {
                $pull: {
                    rating: {
                        owner: new objectId(req.body.data.owner)
                    }
                }
            });
        const project = await modelWardProject.updateOne(
            { _id: new objectId(id) },
            {
                $push: {
                    rating: req.body.data
                }
            },
            { new: true });
        const newProject = await modelWardProject.aggregate([
            { $match: { _id: new objectId(id) } },
            { $unwind: { path: '$rating', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$_id',
                    averageRating: { $avg: '$rating.rating' }
                }
            },
        ])
        return res.status(200).json({ message: 'ok', project: newProject })
    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.post('/addWardAnnouncement', auth, filterUser, async (req, res) => {
    uploadMultiple(req, res, async (err) => {

        try {

            if (err) {
                throw err;
            }


            let images = req.files;
            let data = req.body;
            console.log(data);

            const project = await modelwardAnnoucement.create({
                ...data,
                images: [],
            })

            for (let i = 0; i < images.length; i++) {
                const imgPath = `${__dirname}/../uploads/${images[i].filename}`;
                const imgCompressFolder = `${__dirname}/../uploads/compressed/`
                const imgCompressedPath = `${imgCompressFolder}${images[i].filename}`
                //compressing image
                await compress({
                    source: imgPath,
                    destination: imgCompressFolder,
                    enginesSetup: {
                        jpg: { engine: 'mozjpeg', command: ['-quality', '20'] },
                        png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] },
                    }
                });
                //resize
                fs.writeFileSync(imgCompressedPath, await sharp(imgCompressedPath).resize({ width: 300 }).toBuffer())
                //saveToDb
                const img = await modelImage.create({
                    data: fs.readFileSync(imgPath),
                    compressedData: fs.readFileSync(imgCompressedPath),
                    contentType: images[i].mimetype,
                    size: images[i].size,
                })
                project.images.push(img._id);
                await project.save();

            }
            return res.status(200).json({ message: 'ok' })
        } catch (err) {
            console.log(err);
            if (err.msg) {
                return res.status(500).json({ message: err.msg })
            }
            return res.status(500).json({ message: "something went wrong" })
        }

    });
})

authenticationRouter.post('/addPanchayathAnnouncement', auth, filterUser, async (req, res) => {
    uploadMultiple(req, res, async (err) => {

        try {

            if (err) {
                throw err;
            }


            let images = req.files;
            let data = req.body;
            console.log(data);

            const project = await modelwardAnnoucement.create({
                ...data,
                images: [],
            })

            for (let i = 0; i < images.length; i++) {
                const imgPath = `${__dirname}/../uploads/${images[i].filename}`;
                const imgCompressFolder = `${__dirname}/../uploads/compressed/`
                const imgCompressedPath = `${imgCompressFolder}${images[i].filename}`
                //compressing image
                await compress({
                    source: imgPath,
                    destination: imgCompressFolder,
                    enginesSetup: {
                        jpg: { engine: 'mozjpeg', command: ['-quality', '20'] },
                        png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] },
                    }
                });
                //resize
                fs.writeFileSync(imgCompressedPath, await sharp(imgCompressedPath).resize({ width: 300 }).toBuffer())
                //saveToDb
                const img = await modelImage.create({
                    data: fs.readFileSync(imgPath),
                    compressedData: fs.readFileSync(imgCompressedPath),
                    contentType: images[i].mimetype,
                    size: images[i].size,
                })
                project.images.push(img._id);
                await project.save();

            }
            return res.status(200).json({ message: 'ok' })
        } catch (err) {
            console.log(err);
            if (err.msg) {
                return res.status(500).json({ message: err.msg })
            }
            return res.status(500).json({ message: "something went wrong" })
        }

    });
})

authenticationRouter.post('/addWardComplaint', auth, filterUser, async (req, res) => {
    uploadMultiple(req, res, async (err) => {

        try {

            if (err) {
                throw err;
            }


            let images = req.files;
            let data = req.body;
            console.log(data);

            const complaint = await modelwardComplaint.create({
                ...data,
                images: [],
            })

            for (let i = 0; i < images.length; i++) {
                const imgPath = `${__dirname}/../uploads/${images[i].filename}`;
                const imgCompressFolder = `${__dirname}/../uploads/compressed/`
                const imgCompressedPath = `${imgCompressFolder}${images[i].filename}`
                //compressing image
                await compress({
                    source: imgPath,
                    destination: imgCompressFolder,
                    enginesSetup: {
                        jpg: { engine: 'mozjpeg', command: ['-quality', '20'] },
                        png: { engine: 'pngquant', command: ['--quality=20-50', '-o'] },
                    }
                });
                //resize
                fs.writeFileSync(imgCompressedPath, await sharp(imgCompressedPath).resize({ width: 300 }).toBuffer())
                //saveToDb
                const img = await modelImage.create({
                    data: fs.readFileSync(imgPath),
                    compressedData: fs.readFileSync(imgCompressedPath),
                    contentType: images[i].mimetype,
                    size: images[i].size,
                })
                complaint.images.push(img._id);
                await complaint.save();

            }
            return res.status(200).json({ message: 'ok' })
        } catch (err) {
            console.log(err);
            if (err.msg) {
                return res.status(500).json({ message: err.msg })
            }
            return res.status(500).json({ message: "something went wrong" })
        }

    });
})

authenticationRouter.post('/closeComplaint/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const dbres = await modelwardComplaint.findById(id);
        if (dbres.owner.toString() === req.userId) {
            await dbres.updateOne({
                $set: {
                    isSolved: 'true',
                    solvedDate: new Date()
                }
            }, { new: true });
        } else {
            console.log('complaint owner is not matching');
            const err = new Error('You Can not Change this');
            err.msg = 'you can not change this'
            throw err;
        }
        const newres = await modelwardComplaint.findById(id).populate('owner', { fullName: 1 });;
        return res.status(200).json({ message: 'ok', complaint: newres })
    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.post('/addWardGramSabha', auth, async (req, res) => {


    try {
        let data = req.body.data;
        let date = new Date(data.date);
        if (date.toString() === 'Invalid Date') {
            const err1 = new Error('date is not in format');
            err1.msg = 'date is not valid';
            throw err1;
        }

        const gramSabha = await modelwardGramSabha.create({
            ...data,
            date: date
        })

        return res.status(200).json({ message: 'ok' });
    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }
})


authenticationRouter.post('/addWardInstitutes', auth, async (req, res) => {


    try {
        let data = req.body.data;
        let institute = await modelwardInstitutes.create(
            { ...data }
        )
        return res.status(200).json({ message: 'ok' });
    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.get('/getInstitutesByWard/:id', auth, async (req, res) => {

    const { id } = req.params;

    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        const institutes = await modelwardInstitutes.find({ wardOId: id }, { title: 1, _id: 1, catogery: 1 }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        return res.status(200).json({ message: 'ok', institutes: institutes });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.get('/getInstitutesByPanchayathId/:id', auth, async (req, res) => {

    const { id } = req.params;

    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        const institutes = await modelwardInstitutes.find({ panchayathOId: id }, { title: 1, _id: 1, catogery: 1, wardOId: 1, panchayathOId: 1 }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        return res.status(200).json({ message: 'ok', institutes: institutes });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.get('/getWardInstitutesById/:id', auth, async (req, res) => {

    const { id } = req.params;

    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        const institutes = await modelwardInstitutes.findById(id).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        return res.status(200).json({ message: 'ok', institute: institutes });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }
})

authenticationRouter.get('/getPostsByWard/:id', auth, async (req, res) => {
    const { id } = req.params;
    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        const post = await modelPost.find({
            $and: [
                { wardOId: id },
                { isGallaryPost: false }
            ]
        },).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        console.log('post.isLiked');
        post.forEach(
            (pos) => {
                pos.setLiked = req.userId;
            }
        )
        return res.status(200).json({ message: 'ok', posts: post })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.get('/getPostsByPanchayath/:id', auth, async (req, res) => {
    const { id } = req.params;
    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        const post = await modelPost.find({ $and: [{ wardOId: 'NOT' }, { panchayathOId: id }, { isGallaryPost: false }] }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        post.forEach(
            (pos) => {
                pos.setLiked = req.userId;
            }
        )
        return res.status(200).json({ message: 'ok', posts: post })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.get('/getGallaryPostsByWardAndPanchayath', auth, async (req, res) => {
    const { wardOId, panchayathOId } = req.query;
    try {
        if (panchayathOId === 'undefined') {
            throw new Error('id is not defined')
        }
        const post = await modelPost.find(
            {
                $or: [
                    {
                        $and: [
                            { wardOId: 'NOT' },
                            { panchayathOId: panchayathOId },
                            { isGallaryPost: true }
                        ]
                    },
                    {
                        $and: [
                            { wardOId: wardOId },
                            { panchayathOId: panchayathOId },
                            { isGallaryPost: true }
                        ]
                    }
                ]
            }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        post.forEach(
            (pos) => {
                pos.setLiked = req.userId;
            }
        )
        return res.status(200).json({ message: 'ok', posts: post })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.get('/getGallaryPostsByWard', auth, async (req, res) => {
    const { wardOId, panchayathOId } = req.query;
    try {
        if (panchayathOId === 'undefined') {
            throw new Error('id is not defined')
        }
        const post = await modelPost.find(
            {
                $and: [
                    { wardOId: wardOId },
                    { isGallaryPost: true }
                ]

            }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        post.forEach(
            (pos) => {
                pos.setLiked = req.userId;
            }
        )
        return res.status(200).json({ message: 'ok', posts: post })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.get('/getGallaryPostsByPanchayath', auth, async (req, res) => {
    const { wardOId, panchayathOId } = req.query;
    try {
        if (panchayathOId === 'undefined') {
            throw new Error('id is not defined')
        }
        const post = await modelPost.find(
            {
                $and: [
                    { wardOId: 'NOT' },
                    { panchayathOId: panchayathOId },
                    { isGallaryPost: true }
                ]

            }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        post.forEach(
            (pos) => {
                pos.setLiked = req.userId;
            }
        )
        return res.status(200).json({ message: 'ok', posts: post })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.get('/getProjectByWard/:id', auth, filterUser, async (req, res) => {
    const { id } = req.params;
    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        const projects = await modelWardProject.aggregate(
            [
                { $match: { wardOId: id } },
                { $unwind: { path: '$rating', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: '$_id',
                        doc: { "$first": "$$ROOT" },
                        averageRating: { $avg: '$rating.rating' }
                    }
                },
                { "$replaceRoot": { "newRoot": { $mergeObjects: ['$doc', { 'averageRating': '$averageRating' }] } } },
                { '$unset': 'rating' },
                {
                    $lookup: {
                        from: 'registration',
                        localField: 'owner',
                        foreignField: "_id",
                        as: 'owner',
                        pipeline: [{ "$project": { "fullName": 1 } }]
                    }
                },
                { $unwind: '$owner' },
                { $sort: { createdAt: -1 } }

            ]
        );
        // const projects = await modelWardProject.find({ wardOId: id }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        return res.status(200).json({ message: 'ok', projects: projects })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.get('/wardProjectReviewById/:id', auth, filterUser, async (req, res) => {
    const { id } = req.params;
    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        const reviews = await modelWardProject.findById(id, { rating: 1 }).populate('rating.owner', { fullName: 1 });
        return res.status(200).json({ message: 'ok', reviews: reviews })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.get('/getProjectByPanchayath/:id', auth, filterUser, async (req, res) => {
    const { id } = req.params;
    const { wardOId } = req.query;

    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        // const projects = await modelWardProject.find({ $and: [{ wardOId: new RegExp(`^${wardOId}`) }, { panchayathOId: id }, { isPanchayathProject: 'true' }] }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        const projects = await modelWardProject.aggregate(
            [
                {
                    $match: {
                        $and: [
                            { panchayathOId: id },
                            { isPanchayathProject: 'true' }
                        ]
                    }
                },
                { $unwind: { path: '$rating', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: '$_id',
                        doc: { "$first": "$$ROOT" },
                        averageRating: { $avg: '$rating.rating' }
                    }
                },
                { "$replaceRoot": { "newRoot": { $mergeObjects: ['$doc', { 'averageRating': '$averageRating' }] } } },
                { '$unset': 'rating' },
                {
                    $lookup: {
                        from: 'registration',
                        localField: 'owner',
                        foreignField: "_id",
                        as: 'owner',
                        pipeline: [{ "$project": { "fullName": 1 } }]
                    }
                },
                { $unwind: '$owner' },
                { $sort: { createdAt: -1 } }

            ]
        );
        return res.status(200).json({ message: 'ok', projects: projects })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})


authenticationRouter.get('/getAnnouncementsByWard/:id', auth, filterUser, async (req, res) => {
    const { id } = req.params;
    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        const announcements = await modelwardAnnoucement.find({ wardOId: id }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });

        return res.status(200).json({ message: 'ok', announcements: announcements })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.get('/getComplaintsByWard/:id', auth, filterUser, async (req, res) => {
    const { id } = req.params;
    const listValue = Number(req.query.listValue);
    console.log(listValue);
    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        let announcements = []
        switch (listValue) {
            case -1:

                announcements = await modelwardComplaint.find({ wardOId: id }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
                break;
            case 1:
                announcements = await modelwardComplaint.find({ wardOId: id, owner: req.userId }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 })
                break
            case 2:
                announcements = await modelwardComplaint.find({ wardOId: id, isSolved: 'false' }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 })
                break;
            case 3:
                announcements = await modelwardComplaint.find({ wardOId: id, isSolved: 'true' }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 })
                break;
            default:
                break;
        }
        return res.status(200).json({ message: 'ok', announcements: announcements })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.get('/getComplaintsByPanchayath/:id', auth, filterUser, async (req, res) => {
    const { id } = req.params;
    const listValue = Number(req.query.listValue);
    console.log(listValue);
    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        let announcements
        switch (listValue) {
            case -1:

                announcements = await modelwardComplaint.find({ $and: [{ panchayathOId: id }, { wardOId: 'NOT' }] }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
                break;
            case 1:
                announcements = await modelwardComplaint.find({ $and: [{ panchayathOId: id }, { wardOId: 'NOT' }, { owner: req.userId }] }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 })
                break
            case 2:
                announcements = await modelwardComplaint.find({ $and: [{ panchayathOId: id }, { wardOId: 'NOT' }, { isSolved: 'false' }] }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 })
                break;
            case 3:
                announcements = await modelwardComplaint.find({ $and: [{ panchayathOId: id }, { wardOId: 'NOT' }, { isSolved: 'true' }] }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 })
                break;
            default:
                break;
        }
        return res.status(200).json({ message: 'ok', announcements: announcements })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.get('/getAnnouncementsByPanchayath/:id', auth, filterUser, async (req, res) => {
    const { id } = req.params;
    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        const announcements = await modelwardAnnoucement.find({ panchayathOId: id, wardOId: 'NOT' }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        return res.status(200).json({ message: 'ok', announcements: announcements })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.get('/getGramSabhaByWard/:id', auth, filterUser, async (req, res) => {
    const { id } = req.params;
    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        const data = await modelwardGramSabha.find({ wardOId: id }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        return res.status(200).json({ message: 'ok', data: data })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})

authenticationRouter.get('/getAllWardByPanchayathOId/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { key } = req.query;
    console.log(`lsdjlfs ${key}`);
    try {
        let ward;
        switch (key) {
            case '1':
                ward = await modelWard.aggregate(
                    [
                        { $match: { panchayathOId: id } },
                        {
                            $lookup: {
                                from: 'wardProject',
                                localField: 'id',
                                foreignField: 'wardOId',
                                as: 'projects',
                                pipeline: [
                                    { $unwind: { path: '$rating' } },
                                    {
                                        $group:
                                        {
                                            _id: '$_id',
                                            averageRating: { $avg: '$rating.rating' }
                                        }
                                    },
                                    { $project: { averageRating: { $ifNull: ['$averageRating', 0] } } }
                                ]
                            }
                        },
                        { $unwind: { path: '$projects' } },
                        {
                            $group: {
                                _id: '$_id',
                                doc: { "$first": "$$ROOT" },
                                averageRating: { $avg: '$projects.averageRating' }
                            }
                        },
                        { "$replaceRoot": { "newRoot": { $mergeObjects: ['$doc', { 'averageRating': '$averageRating' }] } } },
                        { $sort: { averageRating: -1 } }
                    ]
                );
                break;

            case '2':
                ward = await modelWard.aggregate([
                    { $match: { panchayathOId: id } },
                    {
                        $lookup: {
                            from: 'wardComplaint',
                            localField: 'id',
                            foreignField: 'wardOId',
                            as: 'uCount',
                            pipeline: [
                                { $project: { isSolved: 1 } },
                                { $match: { isSolved: 'false' } },
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: 'wardComplaint',
                            localField: 'id',
                            foreignField: 'wardOId',
                            as: 'count',
                            pipeline: [
                                { $project: { isSolved: 1 } },
                                { $match: { isSolved: 'true' } },
                            ]
                        }
                    },
                    { $addFields: { unSolvedComplaints: { $size: '$uCount' } } },
                    { $addFields: { solvedComplaints: { $size: '$count' } } },
                    { $project: { uCount: 0, count: 0 } },
                    {
                        $addFields: {
                            solveRate: {
                                $divide: ['$solvedComplaints', {
                                    $cond: [
                                        { $eq: [{ $add: ['$unSolvedComplaints', '$solvedComplaints'] }, 0] },
                                        1,
                                        { $add: ['$unSolvedComplaints', '$solvedComplaints'] }
                                    ]
                                }]
                            }
                        }
                    },
                    {
                        $match: {
                            $or: [
                                { unSolvedComplaints: { $gt: 0 } },
                                { solvedComplaints: { $gt: 0 } }
                            ]
                        }
                    },
                    { $sort: { solveRate: -1 } }
                ]);

            default:
                break;
        }
        res.status(200).json({ message: 'ok', wards: ward })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'something went wrong' })
    }
})

authenticationRouter.get('/getDiscussionReplayById/:id', auth, async (req, res) => {
    const { id } = req.params;
    const objectId = mongoose.Types.ObjectId;
    try {
        const replays = await modeldiscussionReplay.find({ chatId: new objectId(id) }).populate('owner', { fullName: 1 });
        res.status(200).json({ message: 'ok', replays: replays })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'something went wrong' })
    }
})

authenticationRouter.get('/getAllPanchayath', auth, async (req, res) => {
    const { id } = req.params;
    const { key } = req.query;
    console.log(req.params);
    console.log(req.query);
    try {
        const panchayath = await modelPanchayath.find(
            {
                '$or':
                    [
                        { title: { "$regex": `^${key}`, "$options": "i" } },
                        { panchayath: { "$regex": `^${key}`, "$options": "i" } }
                    ]
            }
        ).sort({ title: 1 });
        res.status(200).json({ message: 'ok', panchayaths: panchayath, })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'something went wrong' })
    }
})

authenticationRouter.get('/getAllPanchayathSorted', auth, async (req, res) => {
    const { id } = req.params;
    const { key, searchString } = req.query;
    let panchayath
    try {
        switch (key) {
            case '1':
                panchayath = await modelPanchayath.aggregate([
                    {
                        $lookup: {
                            from: 'wardProject',
                            localField: 'id',
                            foreignField: "panchayathOId",
                            as: 'projects',
                            pipeline: [
                                { $unwind: { path: '$rating' } },
                                {
                                    $group:
                                    {
                                        _id: '$_id',
                                        averageRating: { $avg: '$rating.rating' }
                                    }
                                },
                                { $project: { averageRating: { $ifNull: ['$averageRating', 0] } } },

                            ]
                        }
                    },
                    { $unwind: { path: '$projects' } },
                    {
                        $group: {
                            _id: '$_id',
                            doc: { "$first": "$$ROOT" },
                            averageRating: { $avg: '$projects.averageRating' }
                        }
                    },
                    { "$replaceRoot": { "newRoot": { $mergeObjects: ['$doc', { 'averageRating': '$averageRating' }] } } },
                    { $sort: { averageRating: -1 } },
                    {
                        $match: {
                            '$or':
                                [{ title: { "$regex": `^${searchString}`, "$options": "i" } },
                                { panchayath: { "$regex": `^${searchString}`, "$options": "i" } }]
                        }
                    }
                ]);
                break;

            case '2':
                panchayath = await modelPanchayath.aggregate([
                    {
                        $lookup: {
                            from: 'wardComplaint',
                            localField: 'id',
                            foreignField: 'panchayathOId',
                            as: 'uCount',
                            pipeline: [
                                { $project: { isSolved: 1 } },
                                { $match: { isSolved: 'false' } },
                            ]
                        }
                    },
                    {
                        $lookup: {
                            from: 'wardComplaint',
                            localField: 'id',
                            foreignField: 'panchayathOId',
                            as: 'count',
                            pipeline: [
                                { $project: { isSolved: 1 } },
                                { $match: { isSolved: 'true' } },
                            ]
                        }
                    },
                    { $addFields: { unSolvedComplaints: { $size: '$uCount' } } },
                    { $addFields: { solvedComplaints: { $size: '$count' } } },
                    { $project: { uCount: 0, count: 0 } },
                    {
                        $addFields: {
                            solveRate: {
                                $divide: ['$solvedComplaints', {
                                    $cond: [
                                        { $eq: [{ $add: ['$unSolvedComplaints', '$solvedComplaints'] }, 0] },
                                        1,
                                        { $add: ['$unSolvedComplaints', '$solvedComplaints'] }
                                    ]
                                }]
                            }
                        }
                    },
                    {
                        $match: {
                            $or: [
                                { unSolvedComplaints: { $gt: 0 } },
                                { solvedComplaints: { $gt: 0 } }
                            ]
                        }
                    },
                    { $sort: { solveRate: -1 } }
                ])

            default:
                break;
        }

        res.status(200).json({ message: 'ok', panchayaths: panchayath })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'something went wrong' })
    }
})


module.exports = authenticationRouter;