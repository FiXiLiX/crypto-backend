const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    }
})

userSchema.statics.findByUsername = async function (username) {
    const user = await this.findOne({username})
    if(user)user.password = undefined
    return user
}

userSchema.statics.findByEmail = async function (email) {
    const user = await this.findOne({email})
    if(user)user.password = undefined
    return user
}

module.exports = mongoose.model('User', userSchema)