export function normalizeRelations(data, fields) {
  return {
    ...data,
    ...fields.reduce(
      (prev, field) => ({
        ...prev,
        [field.attribute]: Array.isArray(data[field.attribute])
          ? data[field.attribute].map(x => x.id)
          : data[field.attribute].id
      }),
      {}
    )
  };
}

export function resolveRelations(data, fields, rootGetters) {
  return {
    ...data,
    ...fields.reduce(
      (prev, field) => {
        let alias = field.alias!=undefined?field.alias:field.attribute
        return ({
          ...prev,
          [alias]: Array.isArray(data[alias])
            ? data[field.attribute].map(x => rootGetters[`${field.module}/find`](x))
            : rootGetters[`${field.module}/find`](data[field.attribute])
        })},
      {}
    )
  };
}

export function exportRelations(data, fields, dispatch) {
  console.log(dispatch)
  for(const index in fields){
    let field = fields[index]
    let attr = data[field.attribute]
    console.log(attr)
    if(attr!==undefined&&Array.isArray(attr) && attr.length>0 && typeof attr[0]=== 'object'){
      dispatch(`${field.module}/syncItems`, attr, { root: true })
      delete data[field.attribute]
    }
  }
  return data
}