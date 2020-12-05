require('dotenv').config();
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const jwtStrategy = require('passport-jwt').Strategy;
const bcrypt = require('bcrypt');
const moment = require('moment');

const User = require('./models/User');

const ERROR_WRONG_US_OR_PASS = {
    type: 'custom',
    param: 'global',
    message: 'Wrong username or password'
}

passport.use(new localStrategy({
    usernameField: 'username',
    passwordField: 'password',
}, async (username, password, done) => {
    try {
        //Check does user with that name exist
        const user = await User.findOne({username});
        if(!user)done(ERROR_WRONG_US_OR_PASS);
        //Check if password match with one in database
        const checkPass = bcrypt.compareSync(password, user.password);
        if(!checkPass)done(ERROR_WRONG_US_OR_PASS);
        return done(null, user);
    } catch (error) {
        done(error);
    };
}));

passport.use(new jwtStrategy({
    jwtFromRequest: req => req.header('Authorization'),
    secretOrKey: process.env.SECRET_KEY,
},async (jwtPayload, done) => {
    if(moment() > jwtPayload.expires) return done({
        type: 'custom',
        param: 'global',
        message: 'JWT token expired'
    });
    user = await User.findOne({username: jwtPayload.username});
    if(!user)done({
        type: 'custom',
        param: 'global',
        message: 'JWT token does not have user'
    })
    return done(null, user)
}))