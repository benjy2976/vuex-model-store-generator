export function normalizeRelations(data, relations) {
  return {
    ...data,
    ...relations.reduce(
      (prev, relation) => ({
        ...prev,
        [relation.attribute] : Array.isArray(data[relation.attribute]) ?
          data[relation.attribute].map(x => x.id) : data[relation.attribute].id
      }), {}
    )
  };
}

export function resolveRelations(data, state, rootGetters, level=1) {
  if(state.relations.length==0){
    return data
  }else{
    return {
      ...data,
      ...state.relations.reduce(
        (prev, relation) => {
          let alias = relation.alias != undefined ? relation.alias : relation.attribute

          if(state.maxRelationsResolve>=level){
            return ({
              ...prev,
              [alias] : relationLinck(data, alias, relation, state.key, rootGetters, level+1)
            })
          }
          else{
            return ({
              ...prev,
              ['errorResolve'] : 'Max relation resolve exceded: resolved '+level+' times'
            })
          }

        }, {}
      )
    };
  }
}

function relationLinck(data, alias, relation, key, rootGetters, level) {
  if (relation.hasMany === false) {
    return Array.isArray(data[relation.alias]) ?
      data[relation.alias].map(x => {return {...rootGetters[`${relation.module}/find`](x, level),pivot_id: x}}) :
      {...rootGetters[`${relation.module}/find`](data[relation.attribute], level),pivot_id: data[relation.attribute]}
  } else {
    return rootGetters[`${relation.module}/filter`](d => d[relation.attribute] === data[key], level)
  }
}

//esta funcion se usa para exportar las relaciones de un arreglo de objetos
export function globalExportRelations(items, state, dispatch, rootGetters) {

  let relations=state.relations.map(d=>{return {...d,pivot: []}})
  if(state.relations.length==0){
    return items
  }
  items=items.map(item => {
    if(item.pivot!==undefined){
      delete item.pivot
    }
    return {
      ...item,
      ...relations.reduce(
        (prev, relation, currentIndex) => {
          let attr = item[relation.alias]
          if (attr !== undefined) {
            if(Array.isArray(attr)){
              prev[relation.alias]= attr.map(obj => obj[rootGetters[`${relation.module}/key`]])
              relations[currentIndex].pivot = relations[currentIndex].pivot.concat(attr)
            }
            else{
              delete prev[relation.attribute]
              relations[currentIndex].pivot.push(attr)
            }
            return ({
              ...prev
            })
          }
          else {
            return { ...prev }
          }
        }, {}
      )
    };
  })
  relations.forEach( (relation) =>{
    if(relation.pivot.length>0){
      dispatch(`${relation.module}/sync`, relation.pivot, { root: true })
    }
  })
  return items
}

//esta funcion se usa para exportar las relaciones de un objeto
export function exportRelations(data, state, dispatch, rootGetters) {
  if(data.pivot!==undefined){
    delete data.pivot
  }
  if(state.relations.length==0){
    return data
  }else
    return {
      ...data,
      ...state.relations.reduce(
        (prev, relation) => {
          let attr = data[relation.alias]
          if (attr !== undefined) {
            if(Array.isArray(attr)){
              prev[relation.alias]= attr.map(obj => obj[rootGetters[`${relation.module}/key`]])
            }
            else{
              delete prev[relation.attribute]
            }
            dispatch(`${relation.module}/sync`, attr, { root: true })
            return ({
              ...prev
            })
          }
          else {
            return { ...prev }
          }
        }, {}
      )
    };
}
