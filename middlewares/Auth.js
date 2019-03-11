'use strict';

var jwt = require('jwt-simple');
var moment = require('moment');
var secret = '070501';

exports.ensureAuth = function(req, res, next){
    if(!req.headers.authorization){
        return res.status(404).send({
            message: 'La peticion de la cabecera no tiene autenticación'
        })
    }
    var token = req.headers.authorization.replace(/['"]+/g, '');

    try{
        var payload = jwt.decode(token, secret);
        if(payload.exp <= moment().unix()){
            return res.status(404).send({message: 'El token ha expirado'});
        }
    }catch(exp){
        return res.status(404).send({
            message: 'El token no es valido'
        });
    }
    req.user = payload;

    next();
}