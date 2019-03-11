'use strict'

var Product = require('../models/product');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var moment = require('moment');
var Category = require('../models/category');
var User = require('../models/user');
var Bill = require('../models/bill');


function Login(req, res){
    var params = req.body;
    var email = params.email;
    var password = params.password;

    User.findOne({email: email.toLowerCase()}, (err, user) => {
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
                            res.status(200).send({user: user});
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

    if(params.name, params.surname, params.email, params.password, params.role){
        user.name = params.name;
        user.surname = params.surname;
        user.email = params.email;
        user.role = params.role;

        User.findOne({email: user.email.toLowerCase()}, (err, issetUser) => {
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

function AddProduct(req, res){
    var product = new Product();
    var params = req.body;

    product.name = params.name;
    product.description = params.description;
    product.price = params.price;
    product.stock = params.stock;
    product.category = params.category;

    if(req.user.role === "ADMIN"){
        if(params.name, params.description, params.price, params.stock, params.category){
            product.save((err, productStored) => {
                if(err){
                    res.status(500).send({message: 'Error al intentar agregar producto'});
                }else{
                    if(!productStored){
                        res.status(404).send({message: 'Error al guardar el producto'});
                    }else{
                        res.status(200).send({product: productStored});
                    }
                }
            })
        }
    }else{
        res.status(404).send({message: 'No tiene permisos para agregar productos'});
    }


}


function UpdateProduct(req, res){
    var productId = req.params.id;
    var update = req.body;

    if(req.user.role === "ADMIN"){
        Product.findByIdAndUpdate(productId, update, {new: true}, (err, productUpdated) => {
            if(err){
                res.status(500).send({message: 'Error al intentar editar el producto'});
            }else{
                if(!productUpdated){
                    res.status(404).send({message: 'Error al actualizar el producto'});
                }else{
                    res.status(200).send({product: productUpdated});
                }
            }
        })
    }else{
        res.status(404).send({message: 'No tiene permisos para actualizar el producto'});
    }
}

function DeleteProduct(req, res){
    var productId = req.params.id;

    if(req.user.role === "ADMIN"){
        Product.findByIdAndDelete(productId, (err, productDeleted) => {
            if(err){
                res.status(500).send({message: 'Error al intentar eliminar el producto'});
            }else{
                if(!productDeleted){
                    res.status(404).send({message: 'Error al eliminar el producto'});
                }else{
                    res.status(200).send({message: 'Producto eliminado con éxito'});
                }
            }
        })
    }else{
        res.status(404).send({message: 'No tiene permisos para eliminar el producto'});
    }
}

function AddCategory(req, res){
    var category = new Category();
    var params = req.body;
    category.name = params.name;
    category.description = params.description;

    if(req.user.role==="ADMIN"){
        if(params.name, params.description){
            category.save((err, categoryStored) => {
                if(err){
                    res.status(500).send({message: 'Error al intentar guardar la categoría'});
                }else{
                    if(!categoryStored){
                        res.status(404).send({message: 'Error al guardar la categoría'});
                    }else{
                        res.status(200).send({storedCategory: categoryStored});
                    }
                }
            })
        }
    }else{
        res.status(404).send({message: 'No tiene permisos para agregar categorías'});
    }

}

function UpdateCategory(req, res){
    var categoryId = req.params.id;
    var update = req.body;

    if(req.user.role==="ADMIN"){
        if(update){
            Category.findByIdAndUpdate(categoryId, update, {new: true}, (err, categoryUpdated) => {
                if(err){
                    res.status(500).send({message: 'Error al intentar actualizar la categoría'});
                }else{
                    if(!categoryUpdated){
                        res.status(404).send({message: 'Error al actualizar la categoría'});
                    }else{
                        res.status(200).send({updatedCategory: categoryUpdated});
                    }
                }
            })
        }else{
            res.status(404).send({message: 'No ha enviado nada para actualizar'});
        }
    }else{
        res.status(404).send({message: 'No tiene permisos para actualizar categorías'});
    }
}

function CreateAdminUser(req, res){
    var userN = new User();
    var email = "admin@root.com"
    var password = "admin";

    User.findOne({email: email.toLowerCase()}, (err, user) =>{
        if(err) res.status(500).send({message: 'Error al crear el usuario'});
        else{
            if(!user){
                userN.name = "Administrador";
                userN.surname = "System";
                userN.email = email;
                userN.role = "ADMIN"
                
                bcrypt.hash(password, null, null, (err, hash) =>{
                    if(err) res.status(500).send({message: 'Error al intentar encriptar la contraseña'});
                    else{
                        userN.password = hash;
                        userN.save((err, userStored) => {
                            if(err) res.status(500).send({message: 'Error al crear el usuario'});
                            else{
                                console.log('Usuario Administrador creado:', userStored);
                            }
                        })
                    }
                })
            }else{
                console.log('Usuario administrador ya existente');
            }
        }
    })
    
}

function CreateClient(req, res){
    var newUser = new User();

    var password = "client"

    newUser.name = "Cliente";
    newUser.surname = "Ejemplo";
    newUser.email = "cliente@clients.com";
    newUser.role = "CLIENT";
    
    bcrypt.hash(password, null, null, function(err, hash){
        if(err) res.status(500).send({message:'Error al encriptar la contraseña'});
        else{
            newUser.password = hash;

            User.findOne({email: newUser.email.toLowerCase()}, (err, user) => {
                if(err) res.status(500).send({message: 'Error al intentar verificar el usuario'});
                else{
                    if(!user){
                        newUser.save((err, userStored) => {
                            if(err) res.status(500).send({message: 'Error al intentar crear el cliente'});
                            else{
                                if(!userStored) console.log('Usuario cliente no creado');
                                else{ console.log('Usuario cliente creado', userStored)}
                            }
                        })
                    }else{
                        console.log('Cliente ya existente');
                    }
                }
            })
            
        }
    })
    
}

function CreatedDefaultCategory(req, res){
    Category.findOne({name: "Default"}, (err, cat) => {
        if(err){
            res.status(500).send({message: 'Error al crear la categoría'});
        }else{
            if(!cat){
                var def = new Category();
                def.name = "Default";
                def.description = "Categoría por defecto";
                def.save((err, storedCategory) => {
                    if(err){
                        res.status(500).send({message: 'Error al intentar agregar la categoría'});
                    }else{
                        if(!storedCategory){
                            console.log('INFORMACIÓN: No se ha creado la categoría por defecto');
                        }else{
                            console.log('INFORMACIÓN: Categoría por defecto creada');
                        }
                    }
                })
            }else{
                var id = cat._id;
                console.log('Categoría por defecto ya existente');
            }
        }
    })


}


function CreateDefaultProduct(req, res){
    var productN = new Product();
    productN.name = "Computadora Dell",
    productN.description = "16GB de RAM, 1TB SSD"
    productN.price = 9500
    productN.stock = 10;
    productN.category = "5c8369863a31ac1468174ec3";

    Product.find({}, (err, products) => {
        if(err) res.status(500).send({message: 'Error al intentar crear el producto'});
        else{
            if(products.length < 1){
                productN.save((error, stored) => {
                    if(error) {
                        console.log(error)
                    }
                    if(!stored){
                        console.log('Producto por defecto no creado');
                    }else{
                        console.log('Producto por defecto creado');
                    }
                })
            }else{
                console.log('Productos ya existentes');
            }
        }
    })


}

function DeleteCategory(req, res){
    var categoryId = req.params.id;

    if(req.user.role==="ADMIN"){
        Product.find({category: categoryId}, (err, products) => {
            if(err){
                res.status(500).send({message: 'Error al intentar eliminar la categoría'});
            }else{
                if(products.length < 1){
                    console.log('No hay productos para cambiar de categoría');
                    Category.findByIdAndDelete(categoryId, (err, categoryDeleted) => {
                        if(err){
                            res.status(500).send({message: 'Error al intentar eliminar la categoría'});
                        }else{
                            if(!categoryDeleted){
                                res.status(404).send({message: 'Categoría no eliminada'});
                            }else{
                                res.status(200).send({message: 'Categoría eliminada'});
                            }
                        }
                    })
                }else{
                    var defCatId;
                    Category.findOne({name: "Default"}, (err, cat) => {
                        if(err) res.status(500).send({message: 'Error al intentar obtener el ID de la categoría'});
                        else { defCatId = cat._id 
                            for(var i=0; i<products.length; i++){
                                Product.findByIdAndUpdate(products[i]._id, {category: defCatId}, (err, updated) => {
                                    if(err){
                                        res.status(500).send({message: 'Error al intentar mover los productos'});
                                    }else{
                                        if(!updated){
                                            res.status(404).send({message: 'No se ha podido mover los productos a DEFAULT'});
                                        }else{
                                            Category.findByIdAndDelete(categoryId, (err, categoryDeleted) => {
                                                if(err){
                                                    res.status(500).send({message: 'Error al intentar eliminar la categoría'});
                                                }else{
                                                    if(!categoryDeleted){
                                                        res.status(404).send({message: 'Categoría no eliminada'});
                                                    }else{
                                                        res.setHeader('Content-Type', 'application/json');
                                                        res.end(JSON.stringify({message: 'Categoría eliminada y producto(s) movidos a DEFAULT'}));
                                                    }
                                                }
                                            })
                                            
                                        }
                                    }
                                })
                            }
                        }
                    })

                }
            }
        })
    }else{
        res.status(404).send({message: 'No tiene permisos para eliminar categorías'});
    }

}

function updateUser(req, res){
    var userId = req.params.id;
    var update = req.body;
    if(req.user.role === "ADMIN"){
        User.findOne({_id: userId}, (err, getted) => {
            if(err) res.status(500).send({message: 'No se puede obtener el usuario'})
            else{
                if(getted.role === "CLIENT"){
                    User.findByIdAndUpdate(userId, update, (err, userUpdated) => {
                        if(err) res.status(500).send({message: 'Error al intentar actualizar el usuario'});
                        else{
                            if(!userUpdated) res.status(404).send({message: 'Usuario no actualizado'});
                            else res.status(200).send({update: userUpdated});
                        }
                    })
                }else{
                    res.status(404).send({message: 'No se puede actualizar un usuario administrador'});
                }
            }
        })

    }else{
        res.status(404).send({message: 'No tiene permisos para actualizar el usuario'});
    }
}

function AddBill(req, res){
    var bill = new Bill();
    var params = req.body;

    if(req.user.role === "ADMIN"){
        if(params.client){
            bill.client = params.client;
            bill.products = [];

            bill.save((err, billSaved) => {
                if(err){
                    res.status(500).send({message: 'Error al intentar agregar factura'});
                }else{
                    if(!billSaved){
                        res.status(404).send({message: 'Error, no se ha agregado la factura'});
                    }else{
                        res.status(200).send({savedBill: billSaved});
                    }
                }
            })
        }else{
            res.status(404).send({message: 'Ingrese los datos solicitados'});
        }

    }else{
        res.status(404).send({message: 'No tiene permisos para agregar facturas'});
    }
}

function AddProductToBill(req, res){
    var billId = req.params.id;
    var params = req.body;
    var update = { productID: params.product, units: params.units};

    if(req.user.role === "ADMIN"){

        Product.findOne({_id: params.product}, (err, product) => {
            if(err) res.status(500).send({message: 'Error al intentar encontrar el producto'});
            else{
                if(!product){
                    res.status(404).send({message: 'Error, producto no encontrado'});
                }else{
                    if(params.units > product.stock){
                        res.status(404).send({message: 'Error, unidades no disponibles para vender.'});
                    }else if(product.stock === 0){
                        res.status(404).send({message: 'Error, no hay unidades.'});
                    }else{
                        Bill.findByIdAndUpdate(billId, {$push: {products:  update}}, {new: true}, (err, added) => {
                            if(err) res.status(500).send({message: 'Error al intentar agregar los productos'});
                            else{
                                if(!added){
                                    res.status(404).send({message: 'Producto no agregado'});
                                }else{
                                    var newStock = product.stock - params.units;
                                    Product.findByIdAndUpdate(params.product, {stock: newStock}, (err, updated) => {
                                        if(err) res.status(500).send({message: 'Error al intentar actualizar el stock'});
                                        else{
                                            res.status(200).send({message: 'Producto agregado', bill: added});
                                        }
                                    })
                                }
                            }
                        })
                    }
                }
            }
        })

    }else{
        res.status(404).send({message: 'No tiene permisos para agregar productos a la factura'});
    }

    
}

function showUserBills(req, res){
    var userId = req.params.id;

    if(req.user.role==="ADMIN"){
        Bill.find({client: userId}, (err, bills) => {
            if(err) res.status(500).send({message: 'Error al intentar ver las facturas'});
            else{
                if(bills.length < 1){
                    res.status(404).send({message: 'El usuario no tiene facturas'});
                }else{
                    res.status(200).send({bills: bills})
                }
            }
        })
    }else{
        res.status(404).send({message: 'No tiene permisos para ver las facturas'});
    }


}

async function MostSaled(req, res){
    if(req.user.role === "ADMIN"){
        const saled = await Product.find().select('name categoria vendido').sort({'vendido': -1}).limit(5)
        return res.status(200).send({saled: saled});
        
    }else{
        res.status(404).send({message: 'No tiene permisos para ver el reporte'});
    }
}


function showBillProducts(req, res){
    var billId = req.params.id;

    if(req.user.role==="ADMIN"){
        Bill.findOne({_id: billId}, (err, bill) => {
            if(err) res.status(500).send({message: 'Error al intentar mostrar los productos'});
            else{
                if(!bill){
                    res.status(404).send({message: 'Error al intentar mostrar los productos'});
                }else{
                    res.status(200).send({products: bill.products})
                }
            }
        })
    }else{
        res.status(404).send({message: 'Error, no tiene permisos para mostrar los productos de la factura'});
    }


}

function ListCategories(req, res){
    if(req.user.role !== "ADMIN"){
        res.status(404).send({message: 'No tiene permisos para listar las categorías'});
    }else{
        Category.find({}, (err, categories) => {
            if(err) res.status(500).send({message: 'Error al intentar listar las categorías'});
            else{
                if(categories.length < 1){ res.status(200).send({message: 'No hay categorías'})}
                else{
                    res.status(200).send({categories: categories});
                }
            }
        })
    }
}



module.exports = {
 Login,
 Register,
 AddProduct,
 UpdateProduct,
 DeleteProduct,
 AddCategory,
 UpdateCategory,
 DeleteCategory,
 CreatedDefaultCategory,
 AddBill,
 AddProductToBill,
 showUserBills,
 showBillProducts,
 CreateAdminUser,
 CreateClient,
 ListCategories,
 updateUser,
 MostSaled,
 CreateDefaultProduct
}