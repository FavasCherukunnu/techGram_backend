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

const PORT = 3002;

const app = express();



mongoose.connect('mongodb://127.0.0.1:27017/techGram1').then(() => {
    console.log('connected to db');
    app.listen(PORT, () => { console.log('listening to port ' + PORT); })
}).catch((err) => { console.log('error connecting to db', err); })

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({exposedHeaders:['x-auth-token']}));

app.use('/user', authenticationRouter)
app.use('/admin',adminAuthentication)

