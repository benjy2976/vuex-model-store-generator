# vuex-model-store-generator
This is a powerful package to consume data from webservices and use it as a model, centralizing the control of routes and making the call to data from the server much more friendly.

este es un paquete potente para consumir datos de webservices y utilizarlo como modelo, centralizado el control de las rutas y haciendo mucha mas amable la llamada a los datos desde el servidor

It also provides a tool that creates a template with the main actions for state control with Vuex.

tambien provee de una herramienta que crea una plantilla con las principales acciones para el control de estados con Vuex

## Installing

Using npm:

```bash
$ npm install vuex-model-store-generator
```


## Example
#### NOTE: if you use a md5 validation and the store functionality you can download the resource from the server once, an re download only if the data was changed
you can create a models.js file and put the next code

```js
import Model from 'vuex-model-store-generator'

const configProducts     = {
    alias     : 'product' ,//alias utilizado para almacenar en el localstorage
    route     : '/api/auth/product',//ruta donde se encuentra el resource
    hash      : false,//la condicional si se va a validar el md5
    store     : false,//la condicional que define si se guardara en el localstorage
    methods   : null, //define los métodos adicionales utilizados por el modelo

    /*config for storeDefault*/
    singular  : 'product',//alias para referirse al objeto de manera singular
    plural    : 'productS', //alias para referirse al objeto de manera plural
    key       : 'id',//define el primary key que se usara para acceder al objeto
    name      : 'name',//nombre del atributo name en la base de datos
    selectable: false,//condicional para definir si el objeto es seleccionable
    default   : {},//valor del objeto por defecto,
    params    : {modeljs: true}//aquí se configuran parámetros adicionales a enviar en los request excepto DELETE
   
}

export const Product     = new Model(configProducts)
```

so where ever you are you can call the product Model

```js
import Producto from './models.js'

Producto.show(1)
//this code create a request to the server an return a request to the objet whit the id Nr 1
```

if you are using Vuex you can create the storeDefault
crating the next structure
```js
/store
/store/modules
```
into /store/modules you can create a products.js file
```js
import {Product} from '../../models'


const state = {
//here you can redefine, or define new states
//by default its going to create the next stores
/*
key:"id"
plural:"products"
pluralCapital:"Products"
product:Object
products:Array[]
singular:"product"
singularCapital:"Product"
*/
//you do not need to define it, it is going to create automatically 
}

const getters = {
//here you can redefine, or define new getters
//by default its going to create the next getters
/*
productName(id)// getter used to access at the name of the product whit the id
allProducts()//getter used to access at the list os Products
selectedProduct()// getter used to access at te producto selected (only if is selectable)
*/
//you do not need to define it, it is going to create automatically 
//also you can create other getters if you need
}

const actions = {
//here you can redefine, or define new actions
//by default its going to create the next actions
/*
getProducts(params)//this action invoque at the getAll(params) from the model an store the response into a state.products list
afterGetProducts()//this action is called after the getProducts is dispatched, you yo can redefine it if you need
createProduct(product)//this action create a new producto, call to the create(product) from the model and add the response at the state.products list
updateProduct(product)//this action update a new producto, call to the update(product) from the model and add the response at the state.products list
deleteProduct(product)//this action delete a new producto, call to the delete(product) from the model and add the response at the state.products list
selectProduct(product)//this actions select one product from the list of products an put tha value into a state.product
afterSelectProduct()//this action is called after the selectProduct is dispatched, you yo can redefine it if you need
*/
//you do not need to define it, it is going to create automatically 
//also you can create other getters if you need
}

const mutations = {

//here you can redefine, or define new mutations
//by default its going to create the next stores
/*
setProducts(products)
createProducto(product)
updateProducto(product)
setProductSelected(product)
*/
}

export default Product.getStore(state, getters, actions, mutations)

```
you need to create a file index.js into a /store folder you have two ways to declare the state

````js
import Vue        from 'vue'
import Vuex       from 'vuex'
import product    from './modules/product'
import {Customer} from "../models"

Vue.use(Vuex)
const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
                                modules: {
                                  product,
                                  customer: Customer.getStore(),
                                },
                                strict : debug,
                              })
````
in your app.js you can invoque like this
````js

window.axios = require('axios')
axios.interceptors.request.use(function (config) {
    config.headers.Authorization= 'Bearer ' + auth.getToken()
    return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
});
axios.interceptors.response.use(function (response) {
    return response
}, function (error) {
    if (error.response.status === 401) {
        auth.destroyToken()
        Routes.push({name: 'login'})
    }
    return Promise.reject(error)
})
import Vue     from 'vue'
import Routes  from './routes.js'
import store   from './stores'
import App     from './views/App'

let fistLoad = true
Routes.beforeEach((to, from, next) => {
    if (auth.loggedIn()) {
        if (to.name === 'login') {
            next('/')
        } else {
            next()
        }
        if (fistLoad) {
            store.dispatch('getProducts')
            store.dispatch('getCustomers')
            fistLoad = false
        }
    } else {
        if (to.name === 'login') {
            next()
        } else {
            next('/login')
        }
    }
})
const app = new Vue({
                        el    : '#app',
                        store,
                        router: Routes,
                        render: h => h(App),
                    })
````