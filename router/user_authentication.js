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
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
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
        filename: (req, file, cd) => {
            const extension = file.mimetype.substring(file.mimetype.indexOf('/') + 1)
            cd(null, `${Date.now()}-${file.fieldname}.${extension}`)
        }

    }
)

const upload = multer({ storage: storage, fileFilter });
const uploadMultiple = multer({ storage: storageMultiple, fileFilter });

authenticationRouter.get('/auth', auth, async (req, res) => {
    const user = await modelUserRegistration.findById(req.userId, { image: 0, password: 0 });
    res.status(200).json({ message: 'ok', user: user })
})



authenticationRouter.post('/dev/register', (req, res) => {


    uploadToFolder(req, res, async (err) => {
        if (err) {
            console.log(err);
            if (err.code === 11000) {
                return res.status(409).json({ message: 'already registered' })
            }
            return res.status(500).json({ message: 'something went wrong' })
        }

        const user = await modelUserRegistration.findByIdAndUpdate(req.userId, { image: req.file.filename })
        res.status(200).json({ message: 'ok' });
    });

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
        const image = await modelUserRegistration.findById(id, { image: 1 });
        return res.status(200).json({ message: 'ok', image: image });

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
                { $where: `/^${key}.*/.test(this.wardNo)` }
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
        const ward = await modelWard.findOne({ id: id }).populate('member', { fullName: 1, adharNo: 1, wardNo: 1 });
        return res.status(200).json({ message: 'ok', ward: ward })
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
    const { isRejected, isApproved } = req.query;
    try {


        const users = await modelUserRegistration.find({ $and: [{ wardOId: id }, { $where: `/${isApproved}.*/.test(this.isApproved)` }, { $where: `/${isRejected}.*/.test(this.isRejected)` }] }, { image: 0, password: 0 });
        return res.status(200).json({ message: 'ok', users: users, });


    } catch (err) {
        console.log(err);
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: "something went wrong" })
    }

})

authenticationRouter.post('/wardInfoPost', auth, uploadMultiple.array('images'), async (req, res) => {
    let images = req.files;
    let { description, owner, wardOId, panchayathOId } = req.body;
    try {
        const post = await modelPost.create({
            description: description,
            owner: owner,
            wardOId: wardOId,
            panchayathOId: panchayathOId
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
            post.images.push(img._id);
            await post.save();

        }
        return res.status(200).json({ message: 'ok' })
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }

})

authenticationRouter.post('/addWardProject', auth, filterUser, uploadMultiple.array('images'), async (req, res) => {
    let images = req.files;
    let data = req.body;
    console.log(data);
    try {

        let endDate;
        try{
            endDate = endDate!==''?new Date(data.endDate):null
        }catch(err){
            const err1 = new Error('date is not in format');
            err1.msg = 'date is not valid';
            throw err1
        }

        

        const project = await modelWardProject.create({
            ...data,
            startDate:new Date(data.startDate),
            endDate:endDate,
            images:[],
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
})

authenticationRouter.get('/getPostsByWard/:id', auth, async (req, res) => {
    const { id } = req.params;
    try {
        if (id === 'undefined') {
            throw new Error('id is not defined')
        }
        const post = await modelPost.find({ wardOId: id }).sort({ createdAt: -1 }).populate('owner', { fullName: 1 });
        return res.status(200).json({ message: 'ok', posts: post })

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }


})
module.exports = authenticationRouter;