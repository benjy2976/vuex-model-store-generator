export default class StoreDefault {
  constructor(model, state = {}, getters = {}, actions = {}, mutations = {}) {
    let defData                 = {
      singular  : null,
      plural    : null,
      key       : 'id',
    }
    let config                  = Object.assign(defData, model.getConfigForStore())
    config.singularCapital      = config.singular[0].toUpperCase() + config.singular.slice(1)
    config.pluralCapital        = config.plural[0].toUpperCase() + config.plural.slice(1)
    this.state                  = config
    this.getters                = {}
    this.actions                = {}
    this.mutations              = {}
    this.state[config.singular] = Object.assign({}, model.getDefault())
    this.state[config.plural]   = []
    //getter para obtenner el objeto seleccionado
    this.getters['get' + config.singularCapital]      = (state) => (id) => {
      let c = [...state[state.plural]]
      c     = c.filter(d => d[state.key] === id)
      if (c.length === 1) {
        return c[0]
      } else {
        return model.getDefault()
      }
    }
    //getter para obtener el nombre de el objeto seleccionado
    this.getters[config.singular + 'Name']            = (state) => (id) => {
      let c = [...state[state.plural]]
      c     = c.filter(d => d[state.key] === id)
      if (c.length === 1) {
        return c[0][model.getNameAttribute()]
      } else {
        return null
      }

    }
    //getter para optener la lista de objetos
    this.getters['all' + config.pluralCapital]        = (state) => {
      return state[state.plural]
    }
    //getter para obtener el objeto seleccionado
    this.getters['selected' + config.singularCapital] = (state) => {
      return state[state.singular]
    }

    //action para objeter la lista de objetos de el servidor
    this.actions['get' + config.pluralCapital]      = ({state, commit, dispatch}, params = {}) => {
      //var commit = store.commit
      if (!model.saved()) {
        return new Promise((resolve, reject) => {
          model.getAll(params).then(response => {
            commit('set' + state.pluralCapital, response.data)
            dispatch('afterGet' + state.pluralCapital)
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        })
      } else {
        commit('set' + state.pluralCapital, model.getStored())
        dispatch('afterGet' + state.pluralCapital)
      }
    }
    //action que se ejecuta despues de obtener la lista de objetos
    this.actions['afterGet' + config.pluralCapital] = (dispatch) => {
      /*if (state.select) {
          dispatch('select' + config.singularCapital)
      }*/
    }
    //action para crear un objeto en la base de datos y en la lista de objetos
    this.actions['create' + config.singularCapital] = ({state, commit}, data) => {
      return new Promise((resolve, reject) => {
        model.create(data).then(response => {
          commit('create' + state.singularCapital, response.data)
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      })
    }
    //action para actualizar un objeto en la base de datos y en la lista de objetos
    this.actions['update' + config.singularCapital] = ({state, commit}, data) => {
      return new Promise((resolve, reject) => {
        model.update(data).then(response => {
          commit('update' + state.singularCapital, response.data)
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      })
    }
    //action para eliminar un objeto de la base de datos y de la lista de objetos
    this.actions['delete' + config.singularCapital] = ({state, commit}, data) => {
      return new Promise((resolve, reject) => {
        model.delete(data).then(response => {
          commit('delete' + state.singularCapital, data)
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      })
    }
    if (model.isSelectable()) {
      //action para saleccionar un objeto * busca en la lista de objetos y si no lo encuenta hace un request
      this.actions['select' + config.singularCapital]      = ({state, commit, dispatch}, id) => {
        return new Promise((resolve, reject) => {
          if (state[state.singular][state.key] !== parseInt(id)) {
            commit('set' + state.singularCapital + 'Selected', model.getDefault())
            let d = state[state.plural].filter(d => parseInt(d[state.key]) === parseInt(id))
            if (d.length === 1) {
              d[0].loaded = true
              commit('set' + state.singularCapital + 'Selected', d[0])
              dispatch('afterSelect' + state.singularCapital)
              resolve({
                        status: true,
                        data  : d[0]
                      })
            } else {
              model.show(id).then(response => {
                commit('set' + state.singularCapital + 'Selected', response.data)
                dispatch('afterSelect' + state.singularCapital)
                resolve(response)
              }).catch(error => {
                reject(error)
              })
            }
          } else {
            resolve({
                      status: true,
                      data  : state[state.singular]
                    })
          }
        })
      }
      //action que se ejecuta despues de seleccionar un Objeto
      this.actions['afterSelect' + config.singularCapital] = (store) => {

      }
    }
    //mutacion para setear el listado de objetos
    this.mutations['set' + config.pluralCapital]      = (state, data) => {
      state[state.plural] = data
      model.save(state[state.plural])
    }
    //mutacion para agretar un objeto a la lista de objetos
    this.mutations['create' + config.singularCapital] = (state, data) => {
      state[state.plural].push(data)
    }
    //mutacion para actualizar un objeto de la lista de objetos
    this.mutations['update' + config.singularCapital] = (state, data) => {
      let index = state[state.plural].findIndex(d => d[state.key] === data[state.key])
      state[state.plural][index]=Object.assign(state[state.plural][index], data)
      //Vue.set(state[state.plural], index, data)
    }
    if (model.isSelectable()) {
      //mutacion para seleccionar un Objeto
      this.mutations['set' + config.singularCapital + 'Selected'] = (state, data) => {
        state[state.singular] = Object.assign(state[state.singular], data)
      }
    }

    this.state     = Object.assign(this.state, state)
    this.getters   = Object.assign(this.getters, getters)
    this.actions   = Object.assign(this.actions, actions)
    this.mutations = Object.assign(this.mutations, mutations)


  }
}
