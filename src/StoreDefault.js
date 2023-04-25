import { resolveRelations, exportRelations } from "./helpers"
import Vue from 'vue'

export default class StoreDefault {
  constructor(model, state = {}, getters = {}, actions = {}, mutations = {}) {
    const defData = {
      key : 'id',
    }
    const config = Object.assign(defData, model.getStoreConfig())

    this.namespaced = true
    this.state = {
      itemSelected        : { loading: false, ...model.getDefault() },
      items               : [],
      keysAsinc           : [],
      keysTemp            : [],
      key                 : config.key,
      moduleAlias         : config.moduleAlias,
      maxRelationsResolve : config.maxRelationsResolve,
      relations           : config.relations,
      syncStatus          : config.sync,
      selectedStatus      : false,
      timeOutAsinc        : null
    }
    this.getters = {
      // Getter para obtener el indice de la tabla
      key     : (state) => { return state.key },
      // Getter para obtener el indice de la tabla
      default : () => { return model.getDefault() },
      // Getter para obtener el nombre del objeto seleccionado
      name    : ({ items, key }) => (id) => {
        const item = items.find(d => d[key] === id)
        return item ? `${item[model.getNameAttribute()]}` : null
      },

      // Getter para obtener el objeto seleccionado
      find : ({ items, key }, getters) => (id, level = 1) => {
        const item = items.find(d => d[key] === id)
        return item ? getters.resolve(item, level):model.getDefault()
      },

      // Getter para obtener la lista de objetos
      list : ({items}, { resolve }) => {
        return items.map(resolve)
      },
      // Getter para obtener la lista de objetos filtrados
      filter : ({items}, {resolve}) => (filter, level = 1) => {
        return items.filter(filter).map(item => resolve(item, level))
      },

      // Getter para obtener el objeto seleccionado o falso si no hay seleccion
      selected : ({ itemSelected, selectedStatus }, { resolve }) => {
        return selectedStatus ? resolve(itemSelected) : selectedStatus
      },
      // Getter para resolver las relaciones
      resolve : ({ maxRelationsResolve, key, relations }, _, __, rootGetters) => (item, level = 1) => {
        item = Object.assign(model.getDefault(), item)
        return resolveRelations(item, { maxRelationsResolve, key, relations }, rootGetters, level)
      }
    }

    this.actions = {
      
      checkAsinc : ({ state, getters, dispatch, commit }, key ) => {
        
        return new Promise((resolve) => {
          const ftime = () => {
            let keys=[]
            keys=keys.concat(state.keysTemp)
            commit('ADD_KEYS_ASINC', state.keysTemp)
            commit('SET_KEYS_TEMP', [])
            if(state.keysAsinc.length==1){
              dispatch('show', keys)
            }else{
              let params={}
              params[state.key]=['IN'].concat(keys)
              dispatch('get', params)
            }
            commit('CLEAR_TIMEOUT')
          }
          if (Array.isArray(key)) {
            let keys=key
            key.forEach((d,i)=>{
              if((state.items.findIndex(d1=>(d1[state.key]==d))!=-1)||(state.keysAsinc.indexOf(d)!=-1)||(state.keysTemp.indexOf(d)!=-1))
              {
                keys.splice(i,1)
              }
            })
            if(keys.length>0){
              commit('ADD_KEYS_TEMP', keys)
            }
            if(state.timeOutAsinc == null){
              commit('SET_TIMEOUT', ftime)
            }
            resolve( keys)
          }
          else{
            const item = getters.find(key)
            if(item[state.key]==null){
              if(!state.keysAsinc.find(d=>d==key)&&!state.keysTemp.find(d=>d==key)){
                commit('ADD_KEY_TEMP', key)
              }
              if(state.timeOutAsinc == null){
                commit('SET_TIMEOUT', ftime)
              }
            } 
            resolve(item)
          }
        })
      },
      // Action para obtener un registro por el (key) del servicor
      show : ({ dispatch }, id) => {
        //var commit = store.commit
        return new Promise((resolve, reject) => {
          model.show(id).then(response => {
            dispatch('syncItem', response.data)
            resolve(response);
          }).catch(reject);
        })
      },
      // Action para obtener la lista de objetos de el servidor
      get : ({ state, dispatch }, params = {}) => {
        //var commit = store.commit
        if (!model.saved()) {
          return new Promise((resolve, reject) => {
            model.getAll(params).then(response => {
              model.save(response.data);
              const action = state.syncStatus ? 'sync' : 'setItems';
              dispatch(action, response.data);
              dispatch('afterGet');
              resolve(response);
            }).catch(reject);
          })
        } else {
          dispatch('sync', model.getFromLocalStorage());
          dispatch('afterGet');
        }
      },

      // Action que se ejecuta después de obtener la lista de objetos
      afterGet : () => {
        //
      },

      // Action para crear un objeto en la base de datos y en la lista de objetos
      create : ({ state, dispatch, rootGetters }, data) => {
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
      update : ({ state, dispatch, rootGetters }, data) => {
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
      delete : ({ commit }, data) => {
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
      setItems : ({ commit, dispatch, rootGetters }, items) => {
        let a = { items, dispatch, rootGetters }
        commit('SET_ITEMS', a)
      },
      /*
      ***** action para setear el syncStatus ***
      */
      setSyncStatus : ({ commit }, syncStatus) => {
        commit('SET_SYNC_STATUS', syncStatus)
      },
      /*
      ***** action para determinar si se actualizara un objeto o varios de acuerdo al formato de llegada de la data ***
      */
      sync : ({ dispatch }, data) => {
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
      syncItems : ({ commit, dispatch, rootGetters }, items) => {
        let a = { items, dispatch, rootGetters }
        commit('SYNC_ITEMS', a)
      },
      /*
      ***** action para sincronizar un objeto (item) con un objeto almacenado en el store ***
      */
      syncItem : ({ state, commit, getters, dispatch, rootGetters }, item) => {
        if (getters.find(item[state.key])[state.key] !== null && getters.find(item[state.key])[state.key] !== undefined) {
          commit('UPDATE', exportRelations(item, state, dispatch, rootGetters))
        } else {
          commit('CREATE', exportRelations(item, state, dispatch, rootGetters))
        }
      },
    }
    this.mutations = {
      // 
      ADD_KEYS_ASINC : (state, keys) => {
        if (Array.isArray(keys)) { 
          state.keysAsinc = state.keysAsinc.concat(keys)
        } else {
          state.keysAsinc.push(keys)
        }
      },
      // 
      SET_KEYS_ASINC : (state, keys) => {
        state.keysAsinc=keys
      },
      // 
      ADD_KEY_TEMP : (state, key) => {
        state.keysTemp.push(key)
      },
      // 
      ADD_KEYS_TEMP : (state, keys) => {
        state.keysTemp=state.keysTemp.concat(keys)
      },
      // 
      SET_KEYS_TEMP : (state, keys) => {
        state.keysTemp=keys
      },
      SET_TIMEOUT : (state, fTime)=>{
        state.timeOutAsinc = setTimeout(fTime, 100)
      },
      CLEAR_TIMEOUT : (state)=>{
        state.timeOutAsinc = null
      },
      // Mutation para setear el syncStatus
      SET_SYNC_STATUS : (state, syncStatus) => {
        state.syncStatus = syncStatus
      },
      // Mutation para setear el listado de objetos
      SET_ITEMS : (state, { items, dispatch, rootGetters }) => {
        if(state.relations.length>0){
          items = items.map(item => exportRelations(item, state, dispatch, rootGetters))
        }
        state.items = items
      },
       
      ADD_ITEMS : (state, items) => {
        if (Array.isArray(items)) { 
          state.items = state.items.concat(items)
        } else {
          state.items.push(items)
        }
      },
      // Mutation para setear el listado de objetos
      SYNC_ITEMS : (state, { items, dispatch, rootGetters }) => {/////esto hace lenta la carga
        items = items.map(item => exportRelations(item, state, dispatch, rootGetters))
        let insert = items
        items.forEach( (item,index) =>{
          let i = state.items.findIndex(d => d[state.key] === item[state.key])
          if (i !== -1) {
            state.items[i] = Object.assign(state.items[i], item)
            insert.splice(index, 1)
            //Vue.set(state.items, i, exportRelations(items[index], state, dispatch, rootGetters))
          }

        });
        state.items = state.items.concat(insert)
      },

      // Mutation para agregar un objeto a la lista de objetos
      CREATE : (state, data) => {
        state.items.push(data)
      },

      // Mutation para actualizar un objeto de la lista de objetos
      UPDATE : (state, data) => {
        let index = state.items.findIndex(d => d[state.key] === data[state.key])
        state.items[index] = Object.assign(state.items[index], data)
        //Vue.set(state.items, index, data)
      },

      // Mutation para actualizar un objeto de la lista de objetos
      DELETE : (state, data) => {
        let index = state.items.findIndex(d => d[state.key] === data[state.key])
        state.items.splice(index, 1)
      }
    }

    const actionSelectable={
      selectItem : ({ state, commit, dispatch }, val) => {
        let parameters={
          id           : val,
          forceRequest : false
        }
        if (val instanceof Object){
          parameters=Object.assign(parameters, val)
        }
        return new Promise((resolve, reject) => {
          if (state.itemSelected[state.key] !== parseInt(parameters.id)) {
            commit('SET_SELECTED', Object.assign(model.getDefault(), { loading: true }))
            let d = state.items.filter(d => parseInt(d[state.key]) === parseInt(parameters.id))
            if (d.length === 1 && !parameters.forceRequest) {
              commit('SET_SELECTED', Object.assign(d[0], { loading: false }))
              dispatch('afterSelect')
              resolve({
                status : true,
                data   : d[0]
              })
            } else {
              dispatch('show',parameters.id).then(response => {
                commit('SET_SELECTED', Object.assign(response.data, { loading: false }))
                dispatch('afterSelect')
                resolve(response)
              }).catch(error => {
                reject(error)
              })
            }
          } else {
            resolve({
              status : true,
              data   : state.itemSelected
            })
          }
        })
      },
    
      // Action que se ejecuta después de seleccionar un Objeto
      afterSelect : () => {
        //
      },
    
      deselect : ({ commit }) => {
        commit('CLEAR_SELECTED')
      }
    }
    const mutationsSelectable={
      // Mutation para seleccionar un Objeto
      SET_SELECTED : (state, data) => {
        Vue.set(state, 'selectedStatus', true)
        Vue.set(state, 'itemSelected', data)
        //state.itemSelected = Object.assign(model.getDefault(), data)
      },

      // Mutation para seleccionar un Objeto
      CLEAR_SELECTED : (state) => {
        Vue.set(state, 'selectedStatus', false)
        state.itemSelected = model.getDefault()
      }
    }
    if (model.isSelectable()) {
      this.actions=Object.assign(this.actions, actionSelectable)
      this.mutations=Object.assign(this.mutations, mutationsSelectable)
    }
    this.state = Object.assign(this.state, state)
    this.getters = Object.assign(this.getters, getters)
    this.actions = Object.assign(this.actions, actions)
    this.mutations = Object.assign(this.mutations, mutations)
  }
}
