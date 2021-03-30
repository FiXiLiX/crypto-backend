const router = require('express').Router();
const passport = require('passport');
const errorHandler = require('../helpers/error-handler')

const User = require('../models/User');
const Coin = require('../models/Coin');

router.get('/dashboard', passport.authenticate('jwt', {session: false}),async (req, res) => {
    try {
        const coins = await Coin.getMyCoins(req.user._id);
        let totalValueOfCoins = 0;
        for(let i = 0; i < coins.length; i++) {
            totalValueOfCoins += coins[i].coin.price * coins[i].hold.value;
        }
        return res.status(200).json({
            dolars: req.user.dolars,
            totalValueOfCoins,
            totalPortfolio: req.user.dolars + totalValueOfCoins,
            data: coins
        });
    } catch (error) {
        console.log(error);
        return res.status(400).json(errorHandler(error));
    }
})

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

router.get('/', passport.authenticate('jwt', {session: false}),(req, res) => {
    return res.status(200).json({user: req.user})
})

module.exports = router