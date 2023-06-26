const express = require('express');
const { userRegistration } = require('../controllers/user_controllers');
const multer = require('multer')
const modelUserRegistration = require('../models/user/user.registration.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { auth } = require('../controllers/middlewares');
const fs = require('fs');
const { stringToDate } = require('../staticFiles/functions');
const modelWard = require('../models/ward_model');
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


authenticationRouter.get('/auth', auth, async (req, res) => {
    const user = await modelUserRegistration.findById(req.userId, { image: 0, password: 0 });
    res.status(200).json({ message: 'ok', user: user })
})


authenticationRouter.post('/register', upload.single('image'), async (req, res) => {
    var dat = JSON.parse(req.body.data1)
    const file = req.file;
    delete dat.dataTimeNow
    dat.dob = new Date(`${dat.dob.year}-${dat.dob.month}-${dat.dob.day}T00:00:00+05:30`);
    // dat.dateTimeNow = new Date();

    // console.log(dat);
    console.log(file);

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
        if (user.isApproved === false) {
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


authenticationRouter.get('/getUserInfo', auth, async (req, res) => {
    const { userId } = req;
    console.log(userId);
    try {
        let user = { ...await modelUserRegistration.findById(userId) }._doc;
        delete user.password;
        return res.json({ user: user });
    } catch (err) {
        console.log(err);
    }

})

authenticationRouter.get('/getUsersBasedOnPachayathId', auth, async (req, res) => {
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

authenticationRouter.post('/createWard', auth, async (req, res) => {

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

authenticationRouter.get('/searchWard', auth, async (req, res) => {

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

authenticationRouter.get('/getWardById/:id', auth, async (req, res) => {
    var id = req.params.id;
    try {
        const ward = await modelWard.findById(id).populate('member', { fullName: 1, adharNo: 1, wardNo: 1 });
        return res.status(200).json({ message: 'ok', ward: ward })
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "something went wrong" })
    }
})
authenticationRouter.post('/updateWardById/:id', auth, async (req, res) => {
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

authenticationRouter.post('/deleteWard', auth, async (req, res) => {
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

module.exports = authenticationRouter;