const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer')
const { userRegistration, userLogin } = require('./controllers/user_controllers.js')
const modelUserRegistration = require('./models/user/user.registration.model.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticationRouter = require('./router/user_authentication.js');
const { auth } = require('./controllers/middlewares.js');
const adminAuthentication = require('./router/admin_authentication.js');
const SECRET_KEY = 'techGram123';
const path = require('path')
require('dotenv').config();

const PORT = process.env.PORT;
const MONGOURI = process.env.MONGOURI;

const app = express();



mongoose.connect(MONGOURI).then(() => {
    console.log('connected to db');
    app.listen(PORT, () => { console.log('listening to port ' + PORT); })
}).catch((err) => { console.log('error connecting to db', err); })

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    exposedHeaders:['x-auth-token'],
    origin: true
}));
app.use('/uploads/profile',express.static('./uploads/profile'))

app.use('/user', authenticationRouter)
app.use('/admin',adminAuthentication)
app.get('/test', (req, res) => {
    res.send('working v1')
})

