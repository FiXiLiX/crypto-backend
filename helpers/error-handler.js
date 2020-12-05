module.exports = function(error) {
    if(error.type = 'custom')return {
        errors: [{
            param: error.param,
            msg: error.message,
        }]
    }
}