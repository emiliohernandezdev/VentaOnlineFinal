'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = process.env.PORT || 3789;
var adminController = require('./controllers/admin');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/VentaOnline2017438', {useNewUrlParser: true})
.then((err, res) => {
    console.log('Conexión realizada a la base de datos');
    app.listen(port, () => {
        adminController.CreatedDefaultCategory();
        adminController.CreateAdminUser();
        adminController.CreateClient();
        adminController.CreateDefaultProduct();
        console.log('Sevidor ejecutándose en localhost:'+port);
    })
})

.catch((err) => console.log(err));