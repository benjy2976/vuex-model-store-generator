import { normalizeRelations, resolveRelations, exportRelations } from "./helpers"
import Vue from 'vue'

export default class StoreDefault {
  constructor(model, state = {}, getters = {}, actions = {}, mutations = {}) {
    let defData = {
      key: 'id',
    }
    let config = Object.assign(defData, model.getStoreConfig())

    this.namespaced = true
    this.state = {
      itemSelected: Object.assign({ loading: false }, model.getDefault()),
      items: [],
      key: config.key,
      moduleAlias: config.moduleAlias,
      maxRelationsResolve: config.maxRelationsResolve,
      relations: config.relations,
      syncStatus: config.sync,
      selectedStatus: false
    }
    this.getters = {
      // Getter para obtener el indice de la tabla
      key: (state) => { return state.key },
      // Getter para obtener el indice de la tabla
      default: () => { return model.getDefault() },
      // Getter para obtener el nombre del objeto seleccionado
      name: (state) => (id) => {
        let c = [...state.items]
        c = c.find(d => d[state.key] === id)
        if (c !== undefined) {
          return c[model.getNameAttribute()]
        } else {
          return null
        }

      },

      // Getter para obtener el objeto seleccionado
      find: (state, getters) => (id, level = 1) => {
        let c = [...state.items]
        c = c.find(d => d[state.key] === id)
        if (c !== undefined) {
          return getters.resolve(c, level)
        } else {
          return model.getDefault()
        }
      },

      // Getter para obtener la lista de objetos
      list: (state, getters) => {
        return state.items.map(item => getters.resolve(item))
      },

      // Getter para obtener la lista de objetos filtrados
      filter: (state, getters) => (filter, level = 1) => {
        return state.items.filter(filter).map(item => getters.resolve(item, level))
      },

      // Getter para obtener el objeto seleccionado o falso si no hay seleccion
      selected: (state, getters) => {
        if (state.selectedStatus)
          return getters.resolve(state.itemSelected)
        else
          return state.selectedStatus
      },
      // Getter para resolver las relaciones
      resolve: (state, _, __, rootGetters) => (item, level = 1) => {
        item = Object.assign(model.getDefault(), item)
        return resolveRelations(item, state, rootGetters, level)
      }
    }

    this.actions = {
      // Action para obtener la lista de objetos de el servidor
      get: ({ state, dispatch }, params = {}) => {
        //var commit = store.commit
        if (!model.saved()) {
          return new Promise((resolve, reject) => {
            model.getAll(params).then(response => {
              model.save(response.data)
              if (state.syncStatus) {
                dispatch('sync', response.data)
              } else {
                dispatch('setItems', response.data)
              }
              dispatch('afterGet')
              resolve(response)
            }).catch(error => {
              reject(error)
            })
          })
        } else {
          dispatch('sync', model.getFromLocalStorage())
          dispatch('afterGet')
        }
      },

      // Action que se ejecuta después de obtener la lista de objetos
      afterGet: (dispatch) => {
        //
      },

      // Action para crear un objeto en la base de datos y en la lista de objetos
      create: ({ state, dispatch, rootGetters }, data) => {
        return new Promise((resolve, reject) => {
          model.create(data).then(response => {
            dispatch('syncItem', exportRelations(response.data, state, dispatch, rootGetters))
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        })
      },

      // Action para actualizar un objeto en la base de datos y en la lista de objetos
      update: ({ state, dispatch, rootGetters }, data) => {
        return new Promise((resolve, reject) => {
          model.update(data).then(response => {
            dispatch('syncItem', exportRelations(response.data, state, dispatch, rootGetters))
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        })
      },

      // Action para eliminar un objeto de la base de datos y de la lista de objetos
      delete: ({ state, commit }, data) => {
        return new Promise((resolve, reject) => {
          model.delete(data).then(response => {
            commit('DELETE', data)
            resolve(response)
          }).catch(error => {
            reject(error)
          })
        })
      },
      /*
      ***** action para setear objetos (items)  en el store ***
      */
      setItems: ({ commit, dispatch, rootGetters }, items) => {
        let a = { items, dispatch, rootGetters }
        commit('SET_ITEMS', a)
      },
      /*
      ***** action para setear el syncStatus ***
      */
      setSyncStatus: ({ commit }, syncStatus) => {
        commit('SET_SYNC_STATUS', syncStatus)
      },
      /*
      ***** action para determinar si se actualizara un objeto o varios de acuerdo al formato de llegada de la data ***
      */
      sync: ({ state, commit, dispatch }, data) => {
        if (typeof data === 'object' && data !== null) {
          if (Array.isArray(data)) {
            dispatch('syncItems', data)
          } else {
            dispatch('syncItem', data)
          }
        }
      },
      /*
      ***** action para sincronizar objetos (items) con los objetos almacenado en el store ***
      */
      syncItems: ({ commit, dispatch, rootGetters }, items) => {
        let a = { items, dispatch, rootGetters }
        commit('SYNC_ITEMS', a)
      },
      /*
      ***** action para sincronizar un objeto (item) con un objeto almacenado en el store ***
      */
      syncItem: ({ state, commit, getters, dispatch, rootGetters }, item) => {
        console.log(item)
        console.log(model.getDefault())
        if (getters.find(item.id).id !== null && getters.find(item.id).id !== undefined) {
          commit('UPDATE', exportRelations(item, state, dispatch, rootGetters))
        } else {
          commit('CREATE', exportRelations(item, state, dispatch, rootGetters))
        }
      },
    }
    this.mutations = {
      // Mutation para setear el listado de objetos
      SET_ITEMS: (state, { items, dispatch, rootGetters }) => {
        items = items.map(item => exportRelations(item, state, dispatch, rootGetters))
        state.items = items
      },
      // Mutation para setear el syncStatus
      SET_SYNC_STATUS: (state, syncStatus) => {
        state.syncStatus = syncStatus
      },
      // Mutation para setear el listado de objetos
      SYNC_ITEMS: (state, { items, dispatch, rootGetters }) => {/////esto hace lenta la carga
        items = items.map(item => exportRelations(item, state, dispatch, rootGetters))
        items.forEach(function (item) {
          let i = state.items.findIndex(d => d[state.key] === item[state.key])
          if (i === -1) {
            state.items.push(item)
          } else {
            state.items[i] = Object.assign(state.items[i], item)
            //Vue.set(state.items, i, exportRelations(items[index], state, dispatch, rootGetters))
          }
        });
      },

      // Mutation para agregar un objeto a la lista de objetos
      CREATE: (state, data) => {
        state.items.push(data)
      },

      // Mutation para actualizar un objeto de la lista de objetos
      UPDATE: (state, data) => {
        let index = state.items.findIndex(d => d[state.key] === data[state.key])
        state.items[index] = Object.assign(state.items[index], data)
        //Vue.set(state.items, index, data)
      },

      // Mutation para actualizar un objeto de la lista de objetos
      DELETE: (state, data) => {
        let index = state.items.findIndex(d => d[state.key] === data[state.key])
        state.items.splice(index, 1)
      }
    }


    if (model.isSelectable()) {
      // Action para seleccionar un objeto * busca en la lista de objetos y si no lo encuentra hace un request
      this.actions['selectItem'] = ({ state, commit, dispatch }, id) => {
        return new Promise((resolve, reject) => {
          if (state.itemSelected[state.key] !== parseInt(id)) {
            commit('SET_SELECTED', Object.assign(model.getDefault(), { loading: true }))
            let d = state.items.filter(d => parseInt(d[state.key]) === parseInt(id))
            if (d.length === 1) {
              commit('SET_SELECTED', Object.assign(d[0], { loading: false }))
              dispatch('afterSelect')
              resolve({
                status: true,
                data: d[0]
              })
            } else {
              model.show(id).then(response => {
                dispatch('syncItem', response.data)
                commit('SET_SELECTED', Object.assign(response.data, { loading: false }))
                dispatch('afterSelect')
                resolve(response)
              }).catch(error => {
                reject(error)
              })
            }
          } else {
            resolve({
              status: true,
              data: state.itemSelected
            })
          }
        })
      }

      // Action que se ejecuta después de seleccionar un Objeto
      this.actions['afterSelect'] = (store) => {
        //
      }

      this.actions['deselect'] = ({ state, commit }) => {
        commit('CLEAR_SELECTED')
      }

      // Mutation para seleccionar un Objeto
      this.mutations['SET_SELECTED'] = (state, data) => {
        Vue.set(state, 'selectedStatus', true)
        Vue.set(state, 'itemSelected', data)
        //state.itemSelected = Object.assign(model.getDefault(), data)
      }

      // Mutation para seleccionar un Objeto
      this.mutations['CLEAR_SELECTED'] = (state) => {
        Vue.set(state, 'selectedStatus', false)
        state.itemSelected = model.getDefault()
      }
    }
    this.state = Object.assign(this.state, state)
    this.getters = Object.assign(this.getters, getters)
    this.actions = Object.assign(this.actions, actions)
    this.mutations = Object.assign(this.mutations, mutations)
  }
}
