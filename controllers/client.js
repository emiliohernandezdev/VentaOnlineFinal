'use strict'

var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var moment = require('moment');
var User = require('../models/user');
var Products = require('../models/product');
var Category = require('../models/category');
var Bill = require('../models/bill');
var Cart = require('../models/cart');
var Product = require('../models/product');
const PDFDocument = require('pdfkit');
var fs = require('fs');


function Login(req, res){
    var params = req.body;
    var email = params.email;
    var password = params.password;

    User.findOne({email: email.toLowerCase(), role: "CLIENT"}, (err, user) => {
        if(err){
            res.status(500).send({message: 'Error al intentar iniciar sesión'});
        }else{
            if(user){
                bcrypt.compare(password, user.password, (err, check) => {
                    if(check){
                        if(params.getToken){
                            res.status(200).send({
                                token: jwt.createToken(user)
                            })
                        }else{
                            var userId = user._id;

                            Cart.findOne({client: userId}, (err, cart) => {
                                if(err) res.status(500).send({message: 'Error al intentar crear un carrito'});
                                else{
                                    if(!cart){
                                        var newcart = new Cart();
                                        newcart.client = userId;
                                        newcart.products = [];
                        
                                        newcart.save((err, cartStored) => {
                                            if(err) res.status(500).send({message: 'Error al intentar crear el carrito'});
                                            else{
                                                if(!cartStored){
                                                    res.status(404).send({message: 'No se ha creado el carrito'});
                                                }else{
                                                    console.log('Carrito creado');
                                                }
                                            }
                                        })
                                    }else{
                                        console.log('Carrito ya existente para el cliente');
                                    }
                                }
                            })
                            Bill.find({client: user._id}, (err, shops) => {
                                if(err) res.status(500).send({message: 'Error al intentar listar las compras'});
                                else{
                                    if(shops.length < 1){ res.status(404).send({message: 'No hay compras'});}
                                    else{ res.status(200).send({shops}); }
                                }
                            })
                        }   
                    }else{
                        res.status(404).send({message: 'El usuario no se ha podido loguear'});
                    }
                })
            }else{
                res.status(404).send({message: 'No se puede encontrar el usuario'});
            }
        }
    })
}

function Register(req, res){
    var user = new User();
    var params = req.body;

    if(params.name, params.surname, params.email, params.password){
        user.name = params.name;
        user.surname = params.surname;
        user.email = params.email;
        user.role = "CLIENT";

        User.findOne({email: user.email.toLowerCase(), role: "CLIENT"}, (err, issetUser) => {
            if(err){
                res.status(500).send({message: 'Error, usuario ya registrado'});
            }else{
                if(!issetUser){
                    bcrypt.hash(params.password, null, null, function(err, hash){
                        user.password = hash;

                        user.save((err, userStored) => {
                            if(err){
                                res.status(500).send({message: 'Error al guardar el usuario'});
                            }else{
                                if(!userStored){
                                    res.status(404).send({message: 'No se ha podido guardar el usuario'});
                                }else{
                                    res.status(200).send({savedUser: userStored});
                                }
                            }
                        })
                    })
                }else{
                    res.status(404).send({message: 'El usuario no se puede registrar'});
                }
            }
        })
    }else{
        res.status(404).send({message: 'Ingrese los datos solicitados'});
    }
}

function SearchProducts(req, res){
    var params = req.body;
    var filter = params.name;

    if(req.user.role === "CLIENT"){
        Products.find({name: filter}, (err, products) => {
            if(err) res.status(500).send({message: 'Error al intentar buscar productos'});
            else{
                if(products.length < 1){
                    res.status(404).send({message: 'No se encontraron productos'});
                }else if(products.length === 1){
                    res.status(200).send({message: 'Se ha encontrado: ' + products.length+ ' resultado', results: products});
                }else{
                    res.status(200).send({message: 'Se han encontrado: ' + products.length+ ' resultados', results: products});
                }
            }
        })
    }else{
        res.status(404).send({message: 'No tiene permisos'});
    }


    
}

function ListCategories(req, res){
    if(req.user.role === "CLIENT"){ 
        Category.find({}, (err, categories) => {
            if(err) res.status(500).send({message: 'Error al intentar mostrar las categorías'});
            else{
                if(!categories){
                    res.status(404).send({message: 'No hay categorías'});
                }else{
                    res.status(200).send({categories: categories});
                }
            }
        })
    }else{
        res.status(404).send({message: 'No tiene permisos'});
    }

}

async function MostSaled(req, res){
    if(req.user.role === "CLIENT" || "ADMIN"){
        const saled = await Product.find().select('name categoria vendido').sort({'vendido': -1}).limit(5)
        return res.status(200).send({saled: saled});
        
    }else{
        res.status(404).send({message: 'No tiene permisos para ver el reporte'});
    }
}

function CategoryCatalog(req, res){
    var categoryId = req.params.id;

    Products.find({category: categoryId}, (err, products) => {
        if(err) res.status(500).send({message: 'Error al intentar listar los productos'});
        else{
            if(!products){
                res.status(404).send({message: 'No hay productos'});
            }else{
                res.status(200).send({products});
            }
        }
    })
}

function AddToCart(req, res){
    var cartId = req.params.id;
    var params = req.body;
    var update = { productID: params.product, units: params.units};


    if(params.showBill){
        Cart.findOne({_id: cartId}, (err, cart) => {
            if(err) res.status(500).send({message: 'Error al intentar ver la factura'});
            else{
                res.status(200).send({bill: cart})
            }
        })
        
    }else{
        Cart.findOne({_id: cartId}, (err, cart) => {
            if(err) res.status(500).send({message: 'Error al intentar agregar al carrito'});
            else{
                if(!cart){
                    res.status(404).send({message: 'Usuario sin carrito'});
                }else{
                    if(req.user.sub === ""+cart.client+""){
                        Product.findOne({_id: params.product}, (err, prod)=>{
                            if(err) res.status(500).send({message: 'Error al intentar agregar al carrito'});
                            else{
                                if(prod.stock > params.units){
                                    Cart.findByIdAndUpdate(cartId,{$push: {products:  update}}, (err, add) => {
                                        if(err)  res.status(500).send({message: 'Error al intentar agregar al carrito'});
                                        else{
                                            if(!add){
                                                res.status(404).send({message: 'Producto no agregado al carrito'});
                                            }else{
                                                Product.findOne({_id: params.product}, (err, product) =>{
                                                    var newStock = product.stock - params.units;
                                                    Product.findByIdAndUpdate(params.product, {stock: newStock}, (err, saved) => {
                                                        if(err) res.status(500).send({message: 'Error al intentar guardar las compras'});
                                                        else{
                                                            if(!saved){
                                                                res.status(404).send({message: 'No se pudieron guardar los cambios'});
                                                            }else{
                                                                res.status(404).send({message: 'Producto agregado al carrito'});
                                                            }
                                                        }
                                                    })
                                                })
                                                
                                            }
                                        }
                                    })
                                }else if(prod.stock < params.units){
                                    res.status(404).send({message: 'No hay suficientes unidades'});
                                }
                            }
                        })
                    }else{
                        res.status(404).send({message: 'No tiene permiso'})
                    }
    
    
                }
            }
        })
    }


    
}


function UpdateProfile(req, res){
    var userId = req.user.sub;
    var update = req.body;

    if(req.user.sub != userId){
        res.status(404).send({message:'No tiene permisos'});
    }else{
        User.findByIdAndUpdate(userId, update, (err, profileUpdated) => {
            if(err) res.status(500).send({message: 'Error al intentar actualizar el perfil'});
            else{
                if(!profileUpdated){
                    res.status(404).send({message: 'Error al actualizar el perfil'});
                }else{
                    res.status(200).send({profile: profileUpdated});
                }
            }
        })
    }


}

function DeleteAccount(req, res){
    var userId = req.user.sub;

    if(req.user.sub != userId){
        res.status(404).send({message: 'No tiene permisos'});
    }else{
        User.findByIdAndDelete(userId, (err, deletedAccount) => {
            if(err) res.status(500).send({message: 'Error al intentar eliminar la cuenta'});
            else{
                if(!deletedAccount) res.status(404).send({message: 'Error al eliminar la cuenta'});
                else res.status(200).send({message: 'Cuenta eliminada con éxito'});
            }
        })
    }

}

function ExportBill(req, res){
    var billId = req.params.id;
    const doc = new PDFDocument;
    
    doc.pipe()
    
}

module.exports = {
Login,
Register,
SearchProducts,
ListCategories,
CategoryCatalog,
UpdateProfile,
DeleteAccount,
AddToCart,
MostSaled
}