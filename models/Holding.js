const mongoose = require('mongoose');
const Schema = mongoose.Schema;

holdingSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coin_id: { type: Number, required: true, unique: true },
    value: { type: Number, required: true },
});

holdingSchema.statics.getByUserId = async function (user_id){
    return await this.find({user_id, value: {$gt: 1/10000000}})
}

//Add or remove amount of coin
holdingSchema.methods.changeAmount = async function (amount){
    if(this.value + amount < 0)throw {
        type: 'custom',
        param: 'amount',
        message: 'You tried to sell more coins than you own'
    }
    this.value += Number(amount);
    return await this.save();
}

module.exports = mongoose.model('Holding', holdingSchema);