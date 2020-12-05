require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport')
require('./passport')
require('./mongoose')
require('./redis')
require('./nodemailer')
const app = express();

app.use(bodyParser.urlencoded({ extended: true }))
    .use(passport.initialize())

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)

app.listen(3000, () => console.log('Express started'));
module.exports = app