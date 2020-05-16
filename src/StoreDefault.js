import {normalizeRelations, resolveRelations, exportRelations} from "./helpers"
import Vue from 'vue'

export default class StoreDefault {
  constructor(model, state = {}, getters = {}, actions = {}, mutations = {}) {
    let defData = {
      key: 'id',
    }
    let config  = Object.assign(defData, model.getConfigForStore())

    this.namespaced = true
    this.state      = {
      itemSelected: Object.assign({loading: false}, model.getDefault()),
      items       : [],
      key         : config.key,
      relations   : config.relations
    }
    this.getters    = {
      //getter para obtenner el nombre del objeto seleccionado
      name    : (state) => (id) => {
        let c = [...state.items]
        c     = c.find(d => d[state.key] === id)
        if (c !== undefined) {
          return c[model.getNameAttribute()]
        } else {
          return null
        }

      },//getter para obtenner el objeto seleccionado
      find    : (state, _, __, rootGetters) => (id) => {
        let c = [...state.items]
        c     = c.find(d => d[state.key] === id)
        if (c !== undefined) {
          return resolveRelations(c, state.relations, rootGetters)
        } else {
          return model.getDefault()
        }
      }, //getter para optener la lista de objetos
      list    : (state, getters) => {
        return state.items.map(item => getters.find(item[state.key]))
      }, //getter para obtener el objeto seleccionado
      selected: (state) => {
        return state.itemSelected
      }
    }

    this.actions   = {
      //action para objeter la lista de objetos de el servidor
      get     : ({commit, dispatch}, params = {}) => {
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
      }, //action que se ejecuta despues de obtener la lista de objetos
      afterGet: (dispatch) => {
        //
      }, //action para crear un objeto en la base de datos y en la lista de objetos
      create  : ({state, commit, dispatch}, data) => {
        return new Promise((resolve, reject) => {
          model.create(data).then(response => {
            commit('CREATE', exportRelations(response.data, state.relations, dispatch))
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        })
      }, //action para actualizar un objeto en la base de datos y en la lista de objetos
      update  : ({commit}, data) => {
        return new Promise((resolve, reject) => {
          model.update(data).then(response => {
            commit('UPDATE', response.data)
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        })
      }, //action para eliminar un objeto de la base de datos y de la lista de objetos
      delete  : ({commit}, data) => {
        return new Promise((resolve, reject) => {
          model.delete(data).then(response => {
            commit('DELETE', data)
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        })
      },
      syncItems: ({ dispatch }, items) => {
        for (let index in items) {
          dispatch('syncItem', items[index])
        }
      },
      syncItem: ({ commit, getters }, item) => {
        if (getters.find(item.id).id !== null) {
          commit('UPDATE', item)
        } else {
          commit('CREATE', item)
        }
      },
    }
    this.mutations = {
      //mutacion para setear el listado de objetos
      SET_ITEMS: (state, data) => {
        state.items = data
        model.save(state.items)
      }, //mutacion para agretar un objeto a la lista de objetos
      CREATE   : (state, data) => {
        state.items.push(data)
      }, //mutacion para actualizar un objeto de la lista de objetos
      UPDATE   : (state, data) => {
        let index          = state.items.findIndex(d => d[state.key] === data[state.key])
        //state.items[index] = Object.assign(state.items[index], data)
        Vue.set(state.items, index, data)
      }, //mutacion para actualizar un objeto de la lista de objetos
      DELETE   : (state, data) => {
        let index          = state.items.findIndex(d => d[state.key] === data[state.key])
        state.items[index] = state.items.splice(index, 1)
      }
    }


    if (model.isSelectable()) {
      //action para saleccionar un objeto * busca en la lista de objetos y si no lo encuenta hace un request
      this.actions['selectItem']  = ({state, commit, dispatch}, id) => {
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

      this.actions['deselect']         = ({state, commit}) => {
        commit('CLEAR_SELECTED')
      }
      //mutacion para seleccionar un Objeto
      this.mutations['SET_SELECTED']   = (state, data) => {
        Vue.set(state, 'itemSelected', data)
        //state.itemSelected = Object.assign(model.getDefault(), data)
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
