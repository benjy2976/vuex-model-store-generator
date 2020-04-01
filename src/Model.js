import {md5}         from 'pure-md5'
import StoreDefault  from "./StoreDefault"

export default class Model {

  constructor(config) {
    let defaultValues = {
      alias     : null,
      route     : null,
      hash      : false,
      store     : false,
      methods   : null, //config for storeDefault
      singular  : null,
      plural    : null,
      key       : 'id',
      name      : 'name',
      selectable: false,
      default   : {}
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
    this.selectable = defaultValues.selectable
    this.default    = defaultValues.default
  }

  //funcion para obtener el listado de Objetos de la base de datos
  getAll(params = null) {
    return axios.get(this.route, {
      params: params,
    })
  }

  //funcion para creat un objeto en la base de datos
  create(d) {
    return axios.post(this.route, d)
  }

  //funcion para mostrar un objeto de la base de datos
  show(id) {
    return axios.get(this.route + '/' + id)
  }

  //funcion para actualizar un objeto en la base de datos
  update(d) {
    return axios.put(this.route + '/' + d[this.key], d)
  }

  //funcion para eliminar un objeto de la base de datos
  delete(d) {
    return axios.delete(this.route + '/' + d[this.key])
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

  //funcion para obtener lo almacenado en el localsotrage
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
    if (!!localStorage.getItem(this.alias) && hashMd5[this.alias] !== md5(localStorage.getItem(this.alias))) {
      localStorage.removeItem(this.alias)
    }
  }

  //getter para obtener el store por defecto para el modelo
  getStore(state = {}, getters = {}, actions = {}, mutations = {}) {
    return new StoreDefault(this, state, getters, actions, mutations)
  }

  //getter para obtener todos los parametros de configuracion de el modelo
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

  //funcion para obtener los parametros de configuracion necesarios para el StoreDefault
  getConfigForStore() {
    return {
      singular: this.singular,
      plural  : this.plural,
      key     : this.key,
    }
  }

  //getter para saber si se puede seleccionar un objeto de la lista de objetos
  isSelectable() {
    return this.selectable
  }

  //getter para obtener el valor ppor default de el objeto
  getDefault() {
    return this.default
  }

  //getter para obtener el nombre del atributo que hace referencia al nombre del Objeto
  getNameAttribute() {
    return this.name
  }
}

