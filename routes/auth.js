const express = require('express');
const passport = require('passport');
const redis = require('../redis');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const errorHandler = require('../helpers/error-handler');
let nodemailer;
if(process.env.NODE_ENV==='development')nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

const HASHCOST = 10

router.post('/register', [
    body('username').isString().withMessage('Username must be a String')
    .isLength({min:3, max: 21}).withMessage('Username must be at least 3 characters long and 21 at max')
    .escape().trim(),
    body('email').isEmail().withMessage('Please enter valid email address').escape().trim(),
    body('password').isString().withMessage('Password must be a String')
    .isLength({min:7, max: 64}).withMessage('Password must be at least 7 characters long and 64 characters at max')
    .trim()
],async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try{
        const {username, email, password} = req.body;
        const user = await User.findOne().or([{username}, {email}])
        if(user)throw {
            type: 'custom',
            param: 'global',
            message: 'User with this email or username already exist'
        }
        const hashedPassword = bcrypt.hashSync(password, HASHCOST);
        await User.create({username, email, password: hashedPassword});
        return res.status(200).json({success: true})
    }catch(error){return res.status(400).json(errorHandler(error))}
})

router.post('/login', [
    body('username').isString().withMessage('Username must be a String')
    .isLength({min:3, max: 21}).withMessage('Username must be at least 3 characters long and 21 at max')
    .escape().trim(),
    body('password').isString().withMessage('Password must be a String')
    .isLength({min:7, max: 64}).withMessage('Password must be at least 7 characters long and 64 characters at max')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    passport.authenticate('local', {session: false}, (error, user) => {
        try{
            if(error) throw error;
            const payload = {
                username: user.username,
                expires: Date.now() + parseInt(process.env.JWT_EXPIRATION_SEC * 1000)
            };

            req.login(payload, {session: false}, (error) => {
                if(error)throw error;

                const token = jwt.sign(JSON.stringify(payload), process.env.SECRET_KEY);

                user.password = undefined;
                return res.status(200).json({token, user});
            });
        }catch(error){return res.status(400).json(errorHandler(error))};
    })(req, res);
})

router.post('/reset-password/send-token',[
    body('email').isEmail().withMessage('Please enter valid email address').escape().trim(),
],async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try{
        const user = await User.findByEmail(req.body.email);
        if(!user)throw {
            type: 'custom',
            param: 'email',
            message: 'There is no user with that email'
        };
        //Not the safest method, but do the work
        const token = {
            token: Math.floor(Math.random() * (999999 - 100000) + 100000),
            attempts: 5
        };
        //Store token in redis, with expiration after 15 min
        redis.set('resetPassword:' + user.email, JSON.stringify(token), 'EX', 15 * 60)
        const transporter = await require('../nodemailer')()
        const mailInfo = await transporter.sendMail({
            from: process.env.APP_NAME,
            to: user.email,
            subject: "Password reset",
            html: "Your token is: " + token.token,
        })
        if(process.env.NODE_ENV=='development') console.log("Preview URL: %s", nodemailer.getTestMessageUrl(mailInfo));
        else if(process.env.NODE_ENV=='test') return res.status(200).json({success: true, token: token.token})
        return res.status(200).json({success: true})
    }catch(error){return res.status(400).json(errorHandler(error))}
})

router.post('/reset-password/check', [
    body('email').isEmail().withMessage('Please enter valid email address').escape().trim(),
    body('token').isNumeric().withMessage('Token must be valid number')
],async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try{
        const user = await User.findByEmail(req.body.email);
        if(!user)throw {
            type: 'custom',
            param: 'email',
            message: 'There is no user with that email'
        };
    
        let tokenFromDB = await redis.get('resetPassword:' + user.email)
        if(!tokenFromDB) throw {
            type: 'custom',
            param: 'token',
            message: 'There is no reset token for that email'
        }
        tokenFromDB = JSON.parse(tokenFromDB);
        if(tokenFromDB.attempts === 0) throw {
            type: 'custom',
            param: 'token',
            message: 'Token expired. Please try again.'
        }
        if(tokenFromDB.token != req.body.token) {
            tokenFromDB.attempts--;
            redis.set('resetPassword:' + user.email, JSON.stringify(tokenFromDB))
            throw {
                type: 'custom',
                param: 'token',
                message: 'Token incorrect. Please try again.'
            }
        }
        return res.status(200).json({ success: true });
    }catch(error){return res.status(400).json(errorHandler(error))}
})

router.post('/reset-password/set-password',[
    body('email').isEmail().withMessage('Please enter valid email address').escape().trim(),
    body('token').isNumeric().withMessage('Token must be valid number'),
    body('password').isString().withMessage('Password must be a String')
    .isLength({min:7, max: 64}).withMessage('Password must be at least 7 characters long and 64 characters at max')
], async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try{
        const user = await User.findByEmail(req.body.email);
        if(!user)throw {
            type: 'custom',
            param: 'email',
            message: 'There is no user with that email'
        };
    
        let tokenFromDB = await redis.get('resetPassword:' + user.email)
        if(!tokenFromDB) throw {
            type: 'custom',
            param: 'token',
            message: 'There is no reset token for that email'
        };
        tokenFromDB = JSON.parse(tokenFromDB);
        if(tokenFromDB.attempts === 0) throw {
            type: 'custom',
            param: 'token',
            message: 'Token expired. Please try again.'
        };
        if(tokenFromDB.token != req.body.token) {
            tokenFromDB.attempts--;
            redis.set('resetPassword:' + user.email, JSON.stringify(tokenFromDB));
            throw {
                type: 'custom',
                param: 'token',
                message: 'Token incorrect. Please try again.'
            };
        }

        redis.del('resetPassword:' + user.email);
        user.password = bcrypt.hashSync(req.body.password, HASHCOST);
        await user.save();
        return res.status(200).json({ success: true });
    }catch(error){return res.status(400).json(errorHandler(error))}
})

module.exports = router;