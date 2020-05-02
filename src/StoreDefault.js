export default class StoreDefault {
  constructor(model, state = {}, getters = {}, actions = {}, mutations = {}) {
    let defData                                               = {
      singular: null,
      plural  : null,
      key     : 'id',
    }
    let config                                                = Object.assign(defData, model.getConfigForStore())
    config.singularCapital                                    = config.singular[0].toUpperCase() + config.singular.slice(1)
    config.pluralCapital                                      = config.plural[0].toUpperCase() + config.plural.slice(1)
    this.namespaced                                                = true
    this.state                                                = config
    this.getters                                              = {}
    this.actions                                              = {}
    this.mutations                                            = {}
    this.state['itemSelected']                               = Object.assign({loading: false}, model.getDefault())
    this.state['items']                                 = []
    //getter para obtenner el objeto seleccionado
    this.getters['find']              = (state) => (id) => {
      let c = [...state.items]
      c     = c.filter(d => d[state.key] === id)
      if (c.length === 1) {
        return c[0]
      } else {
        return model.getDefault()
      }
    }
    //getter para obtener el nombre de el objeto seleccionado
    this.getters['name']                    = (state) => (id) => {
      let c = [...state.items]
      c     = c.filter(d => d[state.key] === id)
      if (c.length === 1) {
        return c[0][model.getNameAttribute()]
      } else {
        return null
      }

    }
    //getter para optener la lista de objetos
    this.getters['list']                = (state) => {
      return state.items
    }
    //getter para obtener el objeto seleccionado
    this.getters['getSelected']         = (state) => {
      return state.itemSelected
    }

    //action para objeter la lista de objetos de el servidor
    this.actions['get']      = ({state, commit, dispatch}, params = {}) => {
      //var commit = store.commit
      if (!model.saved()) {
        return new Promise((resolve, reject) => {
          model.getAll(params).then(response => {
            commit('SET_ITEMS', response.data)
            dispatch('afterGet')
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        })
      } else {
        commit('SET_ITEMS', model.getStored())
        dispatch('afterGet')
      }
    }
    //action que se ejecuta despues de obtener la lista de objetos
    this.actions['afterGet'] = (dispatch) => {
      //
    }
    //action para crear un objeto en la base de datos y en la lista de objetos
    this.actions['create'] = ({state, commit}, data) => {
      return new Promise((resolve, reject) => {
        model.create(data).then(response => {
          commit('CREATE', response.data)
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      })
    }
    //action para actualizar un objeto en la base de datos y en la lista de objetos
    this.actions['update'] = ({state, commit}, data) => {
      return new Promise((resolve, reject) => {
        model.update(data).then(response => {
          commit('UPDATE', response.data)
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      })
    }
    //action para eliminar un objeto de la base de datos y de la lista de objetos
    this.actions['delete'] = ({state, commit}, data) => {
      return new Promise((resolve, reject) => {
        model.delete(data).then(response => {
          commit('DELETE', data)
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      })
    }
    if (model.isSelectable()) {
      //action para saleccionar un objeto * busca en la lista de objetos y si no lo encuenta hace un request
      this.actions['selectItem']      = ({state, commit, dispatch}, id) => {
        return new Promise((resolve, reject) => {
          if (state.itemSelected[state.key] !== parseInt(id)) {
            commit('SET_SELECTED', Object.assign(model.getDefault(), {loading: true}))
            let d = state.items.filter(d => parseInt(d[state.key]) === parseInt(id))
            if (d.length === 1) {
              d[0].loaded = true
              commit('SET_SELECTED', Object.assign(d[0], {loading: false}))
              dispatch('afterSelect')
              resolve({
                        status: true,
                        data  : d[0]
                      })
            } else {
              model.show(id).then(response => {
                commit('SET_SELECTED', Object.assign(response.data, {loading: false}))
                dispatch('afterSelect')
                resolve(response)
              }).catch(error => {
                reject(error)
              })
            }
          } else {
            resolve({
                      status: true,
                      data  : state.itemSelected
                    })
          }
        })
      }
      //action que se ejecuta despues de seleccionar un Objeto
      this.actions['afterSelect'] = (store) => {
        //
      }

      this.actions['deselect'] = ({state, commit}) => {
        commit('CLEAR_SELECTED')
      }
    }
    //mutacion para setear el listado de objetos
    this.mutations['SET_ITEMS']      = (state, data) => {
      state.items= data
      model.save(state.items)
    }
    //mutacion para agretar un objeto a la lista de objetos
    this.mutations['CREATE'] = (state, data) => {
      state.items.push(data)
    }
    //mutacion para actualizar un objeto de la lista de objetos
    this.mutations['UPDATE'] = (state, data) => {
      let index                  = state.items.findIndex(d => d[state.key] === data[state.key])
      state.items[index] = Object.assign(state.items[index], data)
      //Vue.set(state.items, index, data)
    }
    //mutacion para actualizar un objeto de la lista de objetos
    this.mutations['DELETE'] = (state, data) => {
      let index                  = state.items.findIndex(d => d[state.key] === data[state.key])
      state.items[index] = state.items.splice(index, 1)
    }
    if (model.isSelectable()) {
      //mutacion para seleccionar un Objeto
      this.mutations['SET_SELECTED']   = (state, data) => {
        state.itemSelected = Object.assign(model.getDefault(), data)
      }
      //mutacion para seleccionar un Objeto
      this.mutations['CLEAR_SELECTED'] = (state, data) => {
        state.itemSelected = model.getDefault()
      }
    }
    this.state     = Object.assign(this.state, state)
    this.getters   = Object.assign(this.getters, getters)
    this.actions   = Object.assign(this.actions, actions)
    this.mutations = Object.assign(this.mutations, mutations)


  }
}
