'use strict'

var express = require('express');
var AdminController = require('../controllers/admin');
var md_auth = require('../middlewares/Auth');
var api = express.Router();

//api.post('/login',);

api.post('/login', AdminController.Login);
api.post('/register', AdminController.Register);
api.post('/add-product', md_auth.ensureAuth, AdminController.AddProduct);
api.put('/update-product/:id', md_auth.ensureAuth, AdminController.UpdateProduct);
api.put('/delete-product/:id', md_auth.ensureAuth, AdminController.DeleteProduct);
api.post('/add-category', md_auth.ensureAuth, AdminController.AddCategory);
api.put('/update-category/:id', md_auth.ensureAuth, AdminController.UpdateCategory);
api.put('/delete-category/:id', md_auth.ensureAuth, AdminController.DeleteCategory);
api.post('/create-bill', md_auth.ensureAuth, AdminController.AddBill);
api.put('/add-product-bill/:id', md_auth.ensureAuth, AdminController.AddProductToBill);
api.put('/user-bills/:id', md_auth.ensureAuth, AdminController.showUserBills);
api.get('/bill-products/:id', md_auth.ensureAuth, AdminController.showBillProducts);
api.get('/list-categories', md_auth.ensureAuth, AdminController.ListCategories);
api.get('/report-most-saled', md_auth.ensureAuth, AdminController.MostSaled);



module.exports = api;