const router = require('express').Router();
const passport = require('passport');
const errorHandler = require('../helpers/error-handler')

const User = require('../models/User');

router.get('/:username', passport.authenticate('jwt', {session: false}),
async (req, res) => {
    try{
        const user = await User.findByUsername(req.params.username)
        if(!user)throw {
            type: 'custom',
            param: 'username',
            message: 'User with that username do not exist'
        }
        return res.status(200).send({user});
    }catch(error){return res.status(400).json(errorHandler(error))}
})

module.exports = router