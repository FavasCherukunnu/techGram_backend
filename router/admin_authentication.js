var express = require('express');
const modelAdminRegistration = require('../models/admin/admin.registration.model');
const adminAuthentication = express.Router();
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../controllers/user_controllers');
const { auth, authAdmin } = require('../controllers/middlewares');
const modelPanchayath = require('../models/panchayath_model');

adminAuthentication.get('/auth',authAdmin,(req,res)=>{
    res.status(200).json({message:'ok'})
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
        const panchayathModel = new modelPanchayath({
            ...panchayath
        })
        await panchayathModel.save();
        return res.status(201).json({ message: 'ok', panchayath: panchayathModel })       //created record
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'already registered the panchayath' })
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
        })
        console.log(panchayaths);
        res.status(200).json({ message: 'ok', panchayaths: panchayaths })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'something went wrong' })

    }
})

adminAuthentication.get('/getPanchayathById/:id', authAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        let panchayath = await modelPanchayath.findById(id);
        if (!panchayath) {
            throw Error('No such Panchayat')
        }
        return res.status(200).json({ message: 'ok',panchayath:panchayath})
    } catch (err) {
        console.log(err);
        return res.status(500).json({message:"something went wrong"})
    }
})

adminAuthentication.post('/updatePanchayath/:id',authAdmin,async(req,res)=>{
    const panchayath = req.body.panchayath;
    delete panchayath._id;
    delete panchayath.updatedAt
    // panchayath.updatedAt = Date.now();
    const {id} = req.params;
    
    try{
        let panchayathdb = await modelPanchayath.findByIdAndUpdate(id,panchayath,{runValidators:true,setDefaultsOnInsert:true})
        res.status(200).json({message:'ok',panchayath:panchayathdb})
    }catch(err){
        console.log(err);
        res.status(500).json({message:'something went wrong'})
    }

})







module.exports = adminAuthentication;