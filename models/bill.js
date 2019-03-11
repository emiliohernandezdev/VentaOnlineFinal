'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BillSchema = Schema({
    client: {type: Schema.ObjectId, ref: "User"},
    products: Array
});

module.exports = mongoose.model('Bill', BillSchema);