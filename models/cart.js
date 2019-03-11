'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CartSchema = Schema({
    client: {type: Schema.ObjectId, ref: "User"},
    products: Array
});

module.exports = mongoose.model('Cart', CartSchema);