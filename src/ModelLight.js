import {md5}        from 'pure-md5'

export default class Model {

  constructor(config) {
    let defaultValues = {
      alias     : null,//alias utilizado para almacenar en el localstorage
      route     : null,//ruta donde se encuentra el resource
      hash      : false,//la condicional si se va a validar el md5
      store     : false,//la condicional que define si se guardara en el localstorage
      methods   : null, //define los métodos adicionales utilizados por el modelo
      /*config for storeDefault*/
      key       : 'id',//define el primary key que se usara para acceder al objeto
      name      : 'name',//nombre del atributo name en la base de datos
      relations : [],//relaciones con otros models
      selectable: false,//condicional para definir si el objeto es seleccionable
      default   : {},//valor del objeto por defecto,
      params    : {modeljs: true}//aquí se configuran parámetros adicionales a enviar en los request excepto DELETE
    }
    defaultValues     = Object.assign(defaultValues, config)
    this.alias        = defaultValues.alias
    this.route        = defaultValues.route
    this.hash         = defaultValues.hash
    this.store        = defaultValues.store
    for (const prop in defaultValues.methods) {
      this[prop] = defaultValues.methods[prop]
    }
    this.singular   = defaultValues.singular
    this.plural     = defaultValues.plural
    this.key        = defaultValues.key
    this.name       = defaultValues.name
    this.relations  = defaultValues.relations
    this.selectable = defaultValues.selectable
    this.default    = defaultValues.default
    this.params     = defaultValues.params
  }

  get(url = '', params = {}) {
    params = Object.assign(params, this.params)
    url    = this.route + '/' + url
    return axios.get(url, {
      params: params,
    })
  }

  post(url = '', params = {}) {
    params = Object.assign(params, this.params)
    url    = this.route + '/' + url
    return axios.post(url, params)
  }

  //funcion para obtener el listado de Objetos de la base de datos
  getAll(params = {}) {
    params = Object.assign(params, this.params)
    return axios.get(this.route, {
      params: params,
    })
  }

  //funcion para crear un objeto en la base de datos
  create(d) {
    d = Object.assign(d, this.params)
    return axios.post(this.route, d)
  }

  //funcion para mostrar un objeto de la base de datos
  show(id) {
    return axios.get(this.route + '/' + id, {
      params: this.params,
    })
  }

  //funcion para actualizar un objeto en la base de datos
  update(d) {
    d = Object.assign(d, this.params)
    return axios.put(this.route + '/' + d[this.key], d)
  }

  //funcion para eliminar un objeto de la base de datos
  delete(d) {
    return axios.delete(this.route + '/' + d[this.key], {
      params: this.params,
    })
  }

  //funcion para verificar si la lista esta guardada en el local storage
  saved() {
    if (this.hash) {
      this.verificarHash()
    }
    return !!localStorage.getItem(this.alias)
  }

  //funciona para almacenar la lisa en el localstorage
  save(p) {
    if (this.store) {
      localStorage.setItem(this.alias, JSON.stringify(p))
    }
  }

  //funcion para obtener lo almacenado en el localStorage
  getStored() {
    return JSON.parse(localStorage.getItem(this.alias))
  }

  //funcion para eliminar lo  almacenado en el localstorage
  destroy() {
    localStorage.removeItem(this.alias)
  }

//funcion para verificar si el hash coincide con el que viene en la vista
  verificarHash() {
    if ((hashMd5[this.alias] === undefined && !!localStorage.getItem(this.alias))) {
      localStorage.removeItem(this.alias)
    }
    /*console.log(this.alias )
    console.log(hashMd5[this.alias] )
    if (!!localStorage.getItem(this.alias)) {
      console.log(md5(localStorage.getItem(this.alias)))
    }*/
    if (!!localStorage.getItem(this.alias) && hashMd5[this.alias] !== md5(localStorage.getItem(this.alias))) {
      localStorage.removeItem(this.alias)
    }
  }


  //getter para obtener todos los parámetros de configuración de el modelo
  getConfig() {
    return {
      alias     : this.alias,
      route     : this.route,
      hash      : this.hash,
      store     : this.store,
      methods   : this.methods,
      singular  : this.singular,
      plural    : this.plural,
      key       : this.key,
      name      : this.name,
      selectable: this.selectable,
      default   : this.default
    }
  }

  //funcion para obtener los parámetros de configuración necesarios para el StoreDefault
  getConfigForStore() {
    return {
      key      : this.key,
      relations: this.relations
    }
  }

  //getter para saber si se puede seleccionar un objeto de la lista de objetos
  isSelectable() {
    return this.selectable === true
  }

  //getter para obtener el valor por default de el objeto
  getDefault() {
    return JSON.parse(JSON.stringify(this.default))
  }

  //getter para obtener el nombre del atributo que hace referencia al nombre del Objeto
  getNameAttribute() {
    return this.name
  }
}

