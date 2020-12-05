require('dotenv').config()
const nodemailer = require("nodemailer");

senderInfo = async function(){
    if(process.env.NODE_ENV == 'development' || process.env.NODE_ENV == 'test'){
        const testAcc = await nodemailer.createTestAccount();
        return {
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAcc.user,
                pass: testAcc.pass,
            },
        }
    }else{
        return {
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            secure: process.env.MAIL_IS_SECURE, // true for 465, false for other ports
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD
            },
        }
    }
}
const senderData = senderInfo();
module.exports = async function (){
    return nodemailer.createTransport(await senderData);
}