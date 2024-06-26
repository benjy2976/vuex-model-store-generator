# vuex-model-store-generator
This is a powerful package to consume data from webservices and use it as a model, centralizing the control of routes and
 making the call to data from the server much more friendly.

este es un paquete potente para consumir datos de webservices y utilizarlo como modelo, centralizado el control de las 
rutas y haciendo mucha mas amable la llamada a los datos desde el servidor

It also provides a tool that creates a template with the main actions for state control with Vuex.

tambien provee de una herramienta que crea una plantilla con las principales acciones para el control de estados con Vuex

## Installing

Using npm:

```bash
$ npm install vuex-model-store-generator
```


## Example
NOTE: if you use a md5 validation and the store functionality you can download the resource from the server once,
an re download only if the data was changed.

you can create a core/product.js file and put the next code

```js
export default {
    alias     : 'product' ,//alias utilizado para almacenar en el localstorage
    route     : '/api/auth/product',//ruta donde se encuentra el resource
    hash      : false,//la condicional si se va a validar el md5
    store     : false,//la condicional que define si se guardara en el localstorage
    methods   : null, //define los métodos adicionales utilizados por el modelo

    /*config for storeDefault*/
    key       : 'id',//define el primary key que se usara para acceder al objeto
    name      : 'name',//nombre del atributo name en la base de datos
    maxRelationsResolve: 1//la cantidad de veces que resolvera la relacion default 1
    relations : [// Relaciones con otros models
        {
            attribute: 'brand_id',
            alias: 'brand',//si no se define se asume le mismo nombre que attribute
            module: 'brands',
            hasMany: false// si no se define se asumen como falso
        },
    ],
    selectable: false,//condicional para definir si el objeto es seleccionable
    default   : {
        id:null,
        brand_id:null,
        name:null
    },//valor del objeto por defecto,
    params    : {modeljs: true}//aquí se configuran parámetros adicionales a enviar en los request
   
}

```

you can create a core/category.js file and put the next code

```js
export default {
    alias     : 'brand' ,//alias utilizado para almacenar en el localstorage
    route     : '/api/auth/brand',//ruta donde se encuentra el resource
    hash      : false,//la condicional si se va a validar el md5
    store     : false,//la condicional que define si se guardara en el localstorage
    methods   : null, //define los métodos adicionales utilizados por el modelo

    /*config for storeDefault*/
    key       : 'id',//define el primary key que se usara para acceder al objeto
    name      : 'name',//nombre del atributo name en la base de datos
    maxRelationsResolve: 1//la cantidad de veces que resolvera la relacion default 1
    relations : [// Relaciones con otros models
        {
          attribute : 'brand_id',
          alias     : 'products',
          module    : 'products',
          hasMany   : true//se pone false para que busque a traves del pivot
        },
    ],
    selectable: false,//condicional para definir si el objeto es seleccionable
    default   : {
        id:null,
        name:null
    },//valor del objeto por defecto,
    params    : {modeljs: true}//aquí se configuran parámetros adicionales a enviar en los request
   
}

```
create core/index.js

```js
import Model from 'vuex-model-store-generator'
import axios from '../../plugins/client'

import configProduct from './product'
import configBrand from './brand'
export const Producto = new Model(configProduct, axios)
export const Brand = new Model(configBrand, axios)

```

so where ever you are you can call the product Model

```js
import {Producto} from './core'

Producto.show(1)
//this code create a request to the server an return a request to the object with the id Nr 1
```

if you are using Vuex you can create the storeDefault
crating the next structure
```js
/store
/store/modules
```
into /store/modules you can create a products.js file
```js
//import {Product} from '../../models' //import if necessary


const state = {
    //here you can redefine or define new states
    //by default its going to create the next stores
    /
    itemSelected:{},
    items:Array[],
    keysAsinc: [],
    keysTemp: [],
    key: config.key,
    moduleAlias: config.moduleAlias,
    maxRelationsResolve: config.maxRelationsResolve,
    relations: config.relations,
    syncStatus: config.sync,//here you define whether sync() or setItems() will be used
    selectedStatus: false,
    timeOutAsinc:null

     
    //you do not need to define it, it is going to create automatically 
}

const getters = {
    //here you can redefine or define new getters
    //by default its going to create the next getters
    
    key: 'id',
    // Getter para obtener el nombre del objeto seleccionado
    name: (id) => {...},
    // Getter para obtener el objeto seleccionado
    find: (id) => {...},
    // Getter para obtener la lista de objetos
    list: [...],
    // Getter para obtener la lista de objetos filtrados
    filter: (filter) => [...],
    // Getter para obtener el objeto seleccionado
    selected: {...}
    // Getter para resolver las relaciones 
    //** se debe de sobrecargar este metodo si se quiere poner funciones personalizadas***
    resolve: {...}
    
   
    // Getter para obtener el indice de la tabla
    //you do not need to define it, it is going to create automatically 
    //also you can create other getters if you need
}

const actions = {
    //here you can redefine or define new actions
    //by default its going to create the next actions
    /* esta accion almacena todos los keys que con los que se le invoca en un periodo de 100ms para realizar una peticion al servicor con los datos de todas esas keys */
    checkAsinc ({ state, getters, dispatch, commit }, key )//this action stores all the keys with which it is invoked in a period of 100ms to make a request to the service with the data of all those keys
    /* esta accion invoca a  show del modelo y almacena la respuesta */
    show ({ dispatch })//this action invoque at the show fron the model and store the response into the state.items
    //*** esta acción invoca getAll(params) del modelo y almacena la respuesta en state.items. ***
    get(params)//this action invoque at the getAll(params) from the model and store the response into a state.items 
    //*** esta acción se invoca después de que se envía el get, puede redefinirlo si lo necesita ***
    afterGet()//this action is called after the get is dispatched, you yo can redefine it if you need
    //*** esta acción crea un nuevo item, llama a create(item) desde el modelo y agrega la respuesta ***
    create(item)//this action create a new item, call to the create(item) from the model and add the response 
    //at the state.items list
    //*** esta acción modifica un  item, llama a update(item) desde el modelo y agrega la respuesta ***
    update(item)//this action update a item, call to the update(item) from the model and add the response 
    //at the state.items list
    //*** esta acción elimina un nuevo elemento, llama a eliminar (elemento) del modelo y agrega la respuesta ***
    delete(item)//this action delete a new item, call to the delete(item) from the model and add the response 
    //*** action para llamar SET_ITEMS mutacion, para reemplazar todo el state.items ***
    setItems(items)//action to call SET_ITEMS mutation, to replace all the state.items
    //*** esta accion setea state.syncStatus ****
    setSyncStatus(syncStatus)//this action set the state.syncStatus
    //*** action para determinar si se actualizara un objeto o varios de acuerdo al formato de llegada de la data ***
    sync(item/items)//action to determine if one object or several is updated according to the data arrival format
    //*** action para sincronizar objetos (items) con los objetos almacenado en el store ***
    syncItems(items)//action to synchronize objects (items) with the objects stored in the store
    //*** action para sincronizar un objeto (item) con un objeto almacenado en el store ***
    syncItem(item)//action to synchronize an object (item) with an object stored in the store
    //at the state.items list
    //*** estas acciones seleccionan un elemento de la lista de elementos y ponen el valor en un estado. ***
    selectItem(id)//this actions select one item from the list of items and put the value into a state.item
    //*** esta acción se llama después de que se envía el artículo seleccionado, puede redefinirlo si lo necesita ***
    afterSelect()//this action is called after the selectItem is dispatched, you yo can redefine it if you need
    //*** esta accion de seleccioan el itemSelected ***
    deselect()//this action deselect the itemSelected
    
    //you do not need to define it, it is going to create automatically 
    //also you can create other getters if you need
}

const mutations = {
//here you can redefine or define new mutations
//by default its going to create the next mutations
ADD_KEYS_ASINC (state, keys)
SET_KEYS_ASINC (state, keys)
ADD_KEYS_TEMP (state, key)
SET_KEYS_TEMP (state, keys)
SET_TIMEOUT(state, fTime)
SET_ITEMS({ items, dispatch, rootGetters })
SET_SYNC_STATUS(syncStatus)
// Mutation para setear el listado de objetos
SYNC_ITEMS({ items, dispatch, rootGetters })
CREATE(item)
UPDATE(item)
DELETE(item)
SET_SELECTED(item)
CLEAR_SELECTED()

}
export default {
  state,
  getters,
  actions,
  mutations
}


```
you need to create a file index.js into a /store folder you have two ways to declare the state

````js
import Vue              from 'vue'
import Vuex             from 'vuex'
import stateProduct     from './modules/product'
import {Product, Brand} from "../core"

Vue.use(Vuex)
const debug = process.env.NODE_ENV !== 'production'

export default new Vuex.Store({
                                modules: {
                                  products: Product.setStore(stateProduct).getStore(),
                                  brands: Brand.getStore(),
                                },
                                strict : debug,
                              })
````
in your plugin client.js 
````js

//import Routes  from '../routes.js'
import axios from 'axios';
import auth    from "../core/auth"

const instance = axios.create();
instance.interceptors.request.use(function (config) {
  //config.url=process.env.MIX_ASSET_URL+config.url
  config.headers.Authorization= 'Bearer ' + auth.getToken()
  return config;
}, function (error) {
  // Do something with request error
  return Promise.reject(error);
});

instance.interceptors.response.use(function (response) {
  return response
}, function (error) {
  if (error.response) {
    if (error.response.status === 401) {
      auth.destroyToken()
      //Routes.push({name: 'login'})
    }
  } else {
    // Something happened in setting up the request that triggered an Error
    console.log('Error', error.message);
  }
  return Promise.reject(error)
})

export default instance

````
in your core/auth.js 
````js
import axios from '../plugins/client.js'
export default {
    registerUser(userData) {
      return axios.post('/app/register', {
          email      : userData.email,
          name       : userData.name,
          password   : userData.password,
          password_c : userData.password_c
      });
    },

    loginUser(userData) {
      return axios.post('/api/auth/login', {
          email       : userData.email,
          password    : userData.password,
          remember_me : userData.remember_me,
      });
    },
    logoutUser() {
      return axios.get('/api/auth/logout', {
          headers: {'Authorization': 'Bearer ' + this.getToken()}
      });
    },
    getUser() {
      return axios.get('/app/user',
        {headers: {'Authorization': 'Bearer ' + this.getToken()}});
    },


    loggedIn() {
      return !!localStorage.getItem('token');
    },

    setToken(token) {
      localStorage.setItem('token', token)
    },

    destroyToken() {
      localStorage.removeItem('token')
    },

    getToken() {
      return localStorage.getItem('token');
    }

}

````
in your app.js you can invoque like this
````js

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
            store.dispatch('products/get')
            store.dispatch('categories/get')
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