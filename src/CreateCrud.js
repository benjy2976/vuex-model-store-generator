import Model from "./Model";
import {
  normalizeRelations,
  resolveRelations,
  exportRelations,
} from "./helpers";
import Vue from "vue";

/**
 * @param {Model} model
 * @param {state, getters, mutations, actions} Object
 */
export default ({
  model,
  state = {},
  getters = {},
  mutations = {},
  actions = {},
}) => {
  let defData = {
    key: "id",
  };

  let config = Object.assign(defData, model.getStoreConfig());

  const crudState = {
    itemSelected: Object.assign({ loading: false }, model.getDefault()),
    items: [],
    key: config.key,
    relations: config.relations,
  };

  const crudGetters = {
    // Getter para obtener el nombre del objeto seleccionado
    name: (state) => (id) => {
      let c = [...state.items];
      c = c.find((d) => d[state.key] === id);
      if (c !== undefined) {
        return c[model.getNameAttribute()];
      } else {
        return null;
      }
    },

    // Getter para obtener el objeto seleccionado
    find: (state, _, __, rootGetters) => (id) => {
      let c = [...state.items];
      c = c.find((d) => d[state.key] === id);
      if (c !== undefined) {
        return resolveRelations(c, state.relations, rootGetters);
      } else {
        return model.getDefault();
      }
    },

    // Getter para obtener la lista de objetos
    list: (state, getters) => {
      return state.items.map((item) => getters.find(item[state.key]));
    },

    // Getter para obtener el objeto seleccionado
    selected: (state) => {
      return state.itemSelected;
    },
  };

  const crudMutations = {
    // Mutation para establecer el listado de objetos
    SET_ITEMS: (state, data) => {
      state.items = data;
      model.save(state.items);
    },

    // Mutation para establecer un objeto a la lista de objetos
    ADD: (state, data) => {
      state.items.push(data);
    },

    // Mutation para actualizar un objeto de la lista de objetos
    UPDATE: (state, data) => {
      let index = state.items.findIndex(
        (d) => d[state.key] === data[state.key]
      );
      //state.items[index] = Object.assign(state.items[index], data)
      Vue.set(state.items, index, data);
    },

    // Mutation para actualizar un objeto de la lista de objetos
    DELETE: (state, data) => {
      let index = state.items.findIndex(
        (d) => d[state.key] === data[state.key]
      );
      state.items[index] = state.items.splice(index, 1);
    },

    // Mutation para seleccionar un Objeto
    SET_SELECTED: (state, data) => {
      Vue.set(state, "itemSelected", data);
      //state.itemSelected = Object.assign(model.getDefault(), data)
    },

    // Mutation para seleccionar un Objeto
    CLEAR_SELECTED: (state, data) => {
      state.itemSelected = model.getDefault();
    },
  };

  const crudActions = {
    // Action para obtener la lista de objetos del servidor
    load: ({ commit, dispatch }, params = {}) => {
      if (!model.saved()) {
        return new Promise((resolve, reject) => {
          model
            .getAll(params)
            .then((response) => {
              commit("SET_ITEMS", response.data);
              dispatch("afterGet");
              resolve(response);
            })
            .catch((error) => {
              reject(error);
            });
        });
      } else {
        commit("SET_ITEMS", model.getFromLocalStorage());
        dispatch("afterGet");
      }
    },

    // Action que se ejecuta después de obtener la lista de objetos
    afterGet: (dispatch) => {
      //
    },

    // Action para crear un objeto en la base de datos y en la lista de objetos
    create: ({ state, commit, dispatch }, data) => {
      return new Promise((resolve, reject) => {
        model
          .create(data)
          .then((response) => {
            commit(
              "ADD",
              exportRelations(response.data, state.relations, dispatch)
            );
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    //action para actualizar un objeto en la base de datos y en la lista de objetos
    update: ({ commit }, data) => {
      return new Promise((resolve, reject) => {
        model
          .update(data)
          .then((response) => {
            commit("UPDATE", response.data);
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    //action para eliminar un objeto de la base de datos y de la lista de objetos
    delete: ({ commit }, data) => {
      return new Promise((resolve, reject) => {
        model
          .delete(data)
          .then((response) => {
            commit("DELETE", data);
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    sync: ({ dispatch }, data) => {
      if (typeof data === "object" && data !== null) {
        if (Array.isArray(data)) {
          dispatch("syncItems", data);
        } else {
          dispatch("syncItem", data);
        }
      }
    },

    syncItems: ({ dispatch }, items) => {
      for (let index in items) {
        dispatch("syncItem", items[index]);
      }
    },

    syncItem: ({ commit, getters }, item) => {
      if (getters.find(item.id).id !== null) {
        commit("UPDATE", item);
      } else {
        commit("ADD", item);
      }
    },

    //action que se ejecuta después de seleccionar un Objeto
    afterSelect: (store) => {
      //
    },

    deselect: ({ state, commit }) => {
      commit("CLEAR_SELECTED");
    },
  };

  if (model.isSelectable()) {
    //action para seleccionar un objeto * busca en la lista de objetos y si no lo encuentra hace un request
    this.actions["selectItem"] = ({ state, commit, dispatch }, id) => {
      return new Promise((resolve, reject) => {
        if (state.itemSelected[state.key] !== parseInt(id)) {
          commit(
            "SET_SELECTED",
            Object.assign(model.getDefault(), { loading: true })
          );
          let d = state.items.filter(
            (d) => parseInt(d[state.key]) === parseInt(id)
          );
          if (d.length === 1) {
            d[0].loaded = true;
            commit("SET_SELECTED", Object.assign(d[0], { loading: false }));
            dispatch("afterSelect");
            resolve({
              status: true,
              data: d[0],
            });
          } else {
            model
              .show(id)
              .then((response) => {
                commit(
                  "SET_SELECTED",
                  Object.assign(response.data, { loading: false })
                );
                dispatch("afterSelect");
                resolve(response);
              })
              .catch((error) => {
                reject(error);
              });
          }
        } else {
          resolve({
            status: true,
            data: state.itemSelected,
          });
        }
      });
    };
  }

  return {
    namespaced: true,
    state: Object.assign(crudState, state),
    getters: Object.assign(crudGetters, getters),
    actions: Object.assign(crudActions, actions),
    mutations: Object.assign(crudMutations, mutations),
  };
};
