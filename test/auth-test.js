// Set enviroment to test
require('dotenv').config()
process.env.NODE_ENV = 'test'

//Dev dependencies
const chai = require('chai');
let should = chai.should();
const chaiHttp = require('chai-http');
const app = require('../index');
var mongoose = require('mongoose');
var redis = require('../redis');

chai.use(chaiHttp);

const userData = {
    username: 'fixilix',
    email: 'fixilix@gmail.com',
    password: 'testtest',
    token: ''
}

const secondUserData = {
    username: 'user',
    email: 'user@gmail.com',
    password: 'testtest',
    token: ''
}

describe('Regiser', function() {
    it('Wait for load', function(done) {
        this.timeout(0)
        setTimeout(function() {
            done()
        }, 6000)
    });
    it('Should add a new user', function(done) {
        chai.request(app)
        .post('/api/auth/register')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(userData)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.success.should.equal(true);
            done();
        })  
    });
    it('Should add a second user', function(done) {
        chai.request(app)
        .post('/api/auth/register')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(secondUserData)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.success.should.equal(true);
            done();
        })  
    });
    it('Should throw error that user already exists', function(done) {
        chai.request(app)
        .post('/api/auth/register')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(userData)
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].msg.should.equal('User with this email or username already exist');
            done();
        })
    })
})  
describe('Login', function() {
    it('Should login user', function(done) {
        chai.request(app)
        .post('/api/auth/login')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(userData)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.token.should.be.a('string')
            res.body.user.username.should.equal('fixilix')
            res.body.user.should.not.have.property('password')
            userData.token = res.body.token
            done();
        })
    })
    it('Should throw error that username or password is wrong', function(done) {
        const fakeUserData = {
            username: 'fixilix1',
            password: 'testtest'
        }
        chai.request(app)
        .post('/api/auth/login')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(fakeUserData)
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('global')
            res.body.errors[0].msg.should.equal('Wrong username or password')
            done();
        })
    })
    it('Should throw error that username or password is wrong', function(done) {
        const fakeUserData = {
            username: 'fixilix',
            password: 'testtest1'
        }
        chai.request(app)
        .post('/api/auth/login')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(fakeUserData)
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('global')
            res.body.errors[0].msg.should.equal('Wrong username or password')
            done();
        })
    })
    it('Should throw error that password does not exists', function(done) {
        const fakeUserData = {
            username: 'fixilix'
        }
        chai.request(app)
        .post('/api/auth/login')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send(fakeUserData)
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('password')
            res.body.errors[0].msg.should.equal('Password must be a String')
            res.body.errors[1].param.should.equal('password')
            res.body.errors[1].msg.should.equal('Password must be at least 7 characters long and 64 characters at max')
            done();
        })
    })
})

describe('Should request reset token', function() {
    it('Should throw error, email requested', function(done) {
        chai.request(app)
        .post('/api/auth/reset-password/send-token')
        .set('content-type', 'application/x-www-form-urlencoded')
        // .send(fakeUserData)
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('email')
            res.body.errors[0].msg.should.equal('Please enter valid email address')
            done();
        })
    })

    it('Should throw error, user with that email does not exist', function(done) {
        chai.request(app)
        .post('/api/auth/reset-password/send-token')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: 'smelse@gmail.com',
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('email')
            res.body.errors[0].msg.should.equal('There is no user with that email')
            done();
        })
    })
    it('Should get the actual token', function(done) {
        this.timeout(0)
        chai.request(app)
        .post('/api/auth/reset-password/send-token')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: 'fixilix@gmail.com',
        })
        .end((err, res) => {
            res.should.have.status(200);
            res.body.success.should.equal(true);
            res.body.token.should.be.a('number');
            userData.resetToken = res.body.token;
            done();
        })
    })
})

describe('Check token', function(){
    it('Should throw error token must be number', function (done){
        chai.request(app)
        .post('/api/auth/reset-password/check')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: userData.email, 
            token: 'asdasd'
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('token');
            res.body.errors[0].msg.should.equal('Token must be valid number');
            done();
        })
    })

    it('Should throw error that user with that email does not exist', function(done){
        chai.request(app)
        .post('/api/auth/reset-password/check')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: 'notemail@mail.com', 
            token: '123456'
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('email');
            res.body.errors[0].msg.should.equal('There is no user with that email');
            done();
        })
    })
    
    it('Should throw error that that user does not have active reset token', function(done){
        chai.request(app)
        .post('/api/auth/reset-password/check')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: secondUserData.email, 
            token: '123456'
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('token');
            res.body.errors[0].msg.should.equal('There is no reset token for that email');
            done();
        })
    })

    it('Should throw error that token is incorrect', function(done){
        chai.request(app)
        .post('/api/auth/reset-password/check')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: userData.email, 
            token: '123456'
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('token');
            res.body.errors[0].msg.should.equal('Token incorrect. Please try again.');
            done();
        })
    })
    it('Should return a success', function(done){
        chai.request(app)
        .post('/api/auth/reset-password/check')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: userData.email, 
            token: userData.resetToken
        })
        .end((err, res) => {
            res.should.have.status(200);
            res.body.success.should.equal(true);
            done();
        })
    })
})

describe('Reset password', function() {
    it('Should throw error that password is required', function(done){
        chai.request(app)
        .post('/api/auth/reset-password/set-password')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: userData.email, 
            token: userData.resetToken
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('password');
            res.body.errors[0].msg.should.equal('Password must be a String');
            done();
        })
    })

    it('Should throw error token must be number', function (done){
        chai.request(app)
        .post('/api/auth/reset-password/set-password')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: userData.email, 
            token: 'asdasd',
            password: 'testtest'
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('token');
            res.body.errors[0].msg.should.equal('Token must be valid number');
            done();
        })
    })

    it('Should throw error that user with that email does not exist', function(done){
        chai.request(app)
        .post('/api/auth/reset-password/set-password')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: 'notemail@mail.com', 
            token: '123456',
            password: 'testtest'
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('email');
            res.body.errors[0].msg.should.equal('There is no user with that email');
            done();
        })
    })
    
    it('Should throw error that that user does not have active reset token', function(done){
        chai.request(app)
        .post('/api/auth/reset-password/set-password')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: secondUserData.email, 
            token: '123456',
            password: 'testtest'
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('token');
            res.body.errors[0].msg.should.equal('There is no reset token for that email');
            done();
        })
    })
    it('Should throw error that token is incorrect', function(done){
        chai.request(app)
        .post('/api/auth/reset-password/set-password')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: userData.email, 
            token: '123456',
            password: 'password'
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.errors[0].param.should.equal('token');
            res.body.errors[0].msg.should.equal('Token incorrect. Please try again.');
            done();
        })
    })

    it('Should return a success', function(done){
        chai.request(app)
        .post('/api/auth/reset-password/set-password')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            email: userData.email, 
            token: userData.resetToken, 
            password: 'newPassword'
        })
        .end((err, res) => {
            res.should.have.status(200);
            res.body.success.should.equal(true);
            userData.password = 'newPassword';
            done();
        })
    })

    it('Should login user with a new password', function(done) {
        chai.request(app)
        .post('/api/auth/login')
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
            username: userData.username, 
            password: userData.password
        })
        .end((err, res) => {
            res.should.have.status(200);
            res.body.token.should.be.a('string')
            res.body.user.username.should.equal('fixilix')
            res.body.user.should.not.have.property('password')
            userData.token = res.body.token
            done();
        })
    })
})

describe('User', function(){
    it('Should load user', function(done) {
        chai.request(app)
        .get('/api/users/fixilix')
        .set('content-type', 'application/x-www-form-urlencoded')
        .set('Authorization', userData.token)
        .end((err, res) => {
            res.should.have.status(200);
            done();
        })
    })
    it('Should load user again', function(done) {
        chai.request(app)
        .get('/api/users/fixilix')
        .set('Authorization', userData.token)
        .end((err, res) => {
            res.should.have.status(200);
            done();
        })
    })
    it('Should throw error that user do not exist', function(done) {
        chai.request(app)
        .get('/api/users/fixili')
        .set('Authorization', userData.token)
        .end((err, res) => {
            res.should.have.status(400);
            done();
        })
    })
})

describe('Coins', function(){
    it('Should load coins', function(done) {
        this.timeout(0)
        chai.request(app)
        .get('/api/coins')
        .set('Authorization', userData.token)
        .send({
            start: 0,
            limit: 5000,
            search: ''
        })
        .end((err, res) => {
            res.should.have.status(200);
            res.body.coins.should.be.a('array');
            done();
        })
    })
})

after(function(){
    mongoose.connection.db.dropDatabase();
    redis.flushall();
})