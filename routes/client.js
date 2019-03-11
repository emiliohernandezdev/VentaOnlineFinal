'use strict'

var express = require('express');
var ClientController = require('../controllers/client');
var md_auth = require('../middlewares/Auth');
var api = express.Router();


api.post('/login', ClientController.Login);
api.post('/register', ClientController.Register);
api.post('/search-products', md_auth.ensureAuth, ClientController.SearchProducts);
api.put('/add-to-cart/:id', md_auth.ensureAuth, ClientController.AddToCart);




module.exports = api;