const moment = require('moment')
const axios = require('axios')
const redis = require('../redis')
const errorHandler = require('./error-handler')

const Coin = require('../models/Coin')

const check = async function (){
    //Return "false" if dont found anything
    let lastUpdate = await redis.get('coins:lastUpdate');
    let isUpdateActive = await redis.get('coins:isUpdateActive');
    //Make Boolean of it, if return anything except "false" make it true
    isUpdateActive = isUpdateActive != null;
    lastUpdate = lastUpdate != null;
    if(!lastUpdate && !isUpdateActive){
        redis.set('coins:isUpdateActive', true);
        console.log('Load coins from CMC: ', moment());
        await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
        {
            params: {
                'start': '1',
                'limit': '399',
                'convert': 'USD',
                'CMC_PRO_API_KEY': process.env.CMC_API_KEY
            }
        })
        .then(async (response) => {
            await Coin.find({}).remove();
            const coinsData = response.data.data;
            await coinsData.forEach(async coin => {
                await Coin.addNewCoin(coin)
            });
        })
        .then(() => {
            redis.del('coins:isUpdateActive');
            redis.set('coins:lastUpdate', String(moment()), 'EX', 60*10);
        })
        .catch(error => console.log(errorHandler(error)));
    }    
}
module.exports = check;