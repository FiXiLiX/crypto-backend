require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport')
const cors = require('cors');
require('./passport')
require('./mongoose')
require('./redis')
require('./nodemailer')
const app = express();

app.use(bodyParser.urlencoded({ extended: true }))
    .use(passport.initialize())
    .use(cors())

const authRoutes = require('./routes/auth')
const usersRoutes = require('./routes/users')
const coinsRoutes = require('./routes/coins')
const transactionsRoutes = require('./routes/transactions')
app.use('/api/auth', authRoutes)
    .use('/api/users', usersRoutes)
    .use('/api/coins', coinsRoutes)
    .use('/api/transactions', transactionsRoutes)

app.listen(3000, () => console.log('Express started'));
module.exports = app