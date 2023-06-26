var express = require('express');
const modelAdminRegistration = require('../models/admin/admin.registration.model');
const adminAuthentication = express.Router();
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../controllers/user_controllers');
const { auth, authAdmin } = require('../controllers/middlewares');
const modelPanchayath = require('../models/panchayath_model');
const modelUserRegistration = require('../models/user/user.registration.model');

adminAuthentication.get('/auth', authAdmin, (req, res) => {
    res.status(200).json({ message: 'ok' })
})

adminAuthentication.post('/login', async (req, res) => {

    const { userName, password } = req.body;
    try {
        const admin = await modelAdminRegistration.findOne(
            {
                userName: userName,
                password: password
            }
        )
        if (!admin) {
            return res.status(404).json({ message: 'admin not found' })
        }
        const token = jwt.sign({ userName: admin.userName, id: admin._id }, SECRET_KEY, { expiresIn: '24h' })
        res.set('x-auth-token', token).status(200).json({ message: 'ok', admin: { userName: admin.userName, id: admin._id } })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'something went wrong' })
    }

});

adminAuthentication.post('/createPanchayath', authAdmin, async (req, res) => {

    const panchayath = req.body.panchayath;
    try {

        //check wether the president is in panchyath or not
        if (panchayath.president !== null || panchayath.president !== undefined) {
            const user = await modelUserRegistration.findById(panchayath.president, { panchayathOId: 1 })
            console.log(user);
            if (user.panchayathOId !== panchayath.id) {
                const err = new Error('president is from out of panchayath')
                err.msg = 'president is from out of panchayath';
                throw err
            }
        }

        const panchayathModel = new modelPanchayath({
            ...panchayath
        })
        await panchayathModel.save();
        if (panchayath.president) {
            const userModel = await modelUserRegistration.findByIdAndUpdate(panchayath.president, { isApproved: true, isPresident: true });
        }
        return res.status(201).json({ message: 'ok', panchayath: panchayathModel })       //created record
    } catch (err) {
        console.log(err);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'already registered. You can edit Panchayath Details' })
        }
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        return res.status(500).json({ message: 'something went wrong' })
    }
})

adminAuthentication.get('/listPanchayath', authAdmin, async (req, res) => {
    try {
        const panchayath = await modelPanchayath.find().sort({ title: 1 });
        res.status(200).json({ message: 'ok', panchayaths: panchayath })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'something went wrong' })
    }
})

adminAuthentication.get('/searchPanchayath', authAdmin, async (req, res) => {
    let { key, district } = req.query;
    try {
        const panchayaths = await modelPanchayath.find({
            $and:
                [{
                    '$or':
                        [{ title: { "$regex": `^${key}`, "$options": "i" } },
                        { panchayath: { "$regex": `^${key}`, "$options": "i" } }]
                }, { district: new RegExp(district) }]
        }).populate('president', { fullName: 1 })
        res.status(200).json({ message: 'ok', panchayaths: panchayaths })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'something went wrong' })

    }
})

adminAuthentication.get('/getPanchayathById/:id', authAdmin, async (req, res) => {
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

adminAuthentication.post('/updatePanchayath/:id', authAdmin, async (req, res) => {
    const panchayath = req.body.panchayath;
    delete panchayath._id;
    delete panchayath.updatedAt;
    // panchayath.updatedAt = Date.now();
    const { id } = req.params;

    try {

        //check wether the president is in panchyath or not
        if (panchayath.president !== null && panchayath.president !== undefined) {
            const user = await modelUserRegistration.findById(panchayath.president, { panchayathOId: 1 })
            console.log(user);
            if (user.panchayathOId !== panchayath.id) {
                const err = new Error('president is from out of panchayath')
                err.msg = 'president is from out of panchayath';
                throw err
            }
        }

        let panchayathdatabase = await modelPanchayath.findById(id)
        if (panchayathdatabase.president !== null && panchayathdatabase.president !== undefined) {
            let oldPresidentdb = await modelUserRegistration.findById(panchayathdatabase.president)

            if (panchayathdatabase.president.toString() !== panchayath.president) {
                await oldPresidentdb.updateOne({ isPresident: false, userType: 'user' })
                console.log('changed president');

            } else {
                console.log('not changed president');
            }
        }
        if (panchayath.president !== null && panchayath.president !== undefined) {
            let newPresidentdb = await modelUserRegistration.findByIdAndUpdate(panchayath.president, { isPresident: true, isApproved: true })
        }
        // let panchayathdb = await modelPanchayath.findByIdAndUpdate(id, panchayath, { runValidators: true})
        await panchayathdatabase.updateOne(panchayath, { runValidators: true })
        res.status(200).json({ message: 'ok', panchayath: panchayathdatabase })
    } catch (err) {
        console.log(err);
        
        if (err.msg) {
            return res.status(500).json({ message: err.msg })
        }
        res.status(500).json({ message: 'something went wrong' })
    }

})

adminAuthentication.get('/getUsersBasedOnPachayathId', authAdmin, async (req, res) => {
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







module.exports = adminAuthentication;