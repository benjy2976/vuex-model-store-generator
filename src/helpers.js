export function normalizeRelations(data, relations) {
    return {
        ...data,
        ...relations.reduce(
            (prev, relation) => ({
                ...prev,
                [relation.attribute]: Array.isArray(data[relation.attribute]) ?
                    data[relation.attribute].map(x => x.id) : data[relation.attribute].id
            }), {}
        )
    };
}

export function resolveRelations(data, state, rootGetters) {
    return {
        ...data,
        ...state.relations.reduce(
            (prev, relation) => {
                let alias = relation.alias != undefined ? relation.alias : relation.attribute
                return ({
                    ...prev,
                    [alias]: relationLinck(data, alias, relation, state.key, rootGetters)
                })
            }, {}
        )
    };
}

function relationLinck(data, alias, relation, key, rootGetters) {
    if (relation.hasMany === undefined || relation.hasMany === false) {
        return Array.isArray(data[relation.attribute]) ?
            data[relation.attribute].map(x => rootGetters[`${relation.module}/find`](x)) :
            rootGetters[`${relation.module}/find`](data[relation.attribute])
    } else {
        return rootGetters[`${relation.module}/filter`](d => d[relation.attribute] === data[key])
    }
}

export function exportRelations(data, state, dispatch, rootGetters) {
    if(data.pivot!==undefined){
        delete data.pivot
      }
    return {
        ...data,
        ...state.relations.reduce(
            (prev, relation) => {
                let attr = data[relation.attribute]
                if (attr !== undefined && Array.isArray(attr) && attr.length > 0 && typeof attr[0] === 'object') {
                    dispatch(`${relation.module}/syncItems`, attr, { root: true })
                    return ({
                        ...prev,
                        [relation.attribute]: data[relation.attribute].map(obj => obj[rootGetters[`${relation.module}/key`]])
                    })
                }
                else {
                    return { ...prev }
                }
            }, {}
        )
    };
    /* for (const index in state.relations) {
        let relation = state.relations[index]
        let attr = data[relation.attribute]
        if (attr !== undefined && Array.isArray(attr) && attr.length > 0 && typeof attr[0] === 'object') {
            dispatch(`${relation.module}/syncItems`, attr, {root: true})
            data[relation.attribute] = data[relation.attribute].map(obj => obj[rootGetters[`${relation.module}/key`]])
        }
    } */
    /* state.relations.forEach(relation => {
        let attr = data[relation.attribute]
        if (attr !== undefined && Array.isArray(attr) && attr.length > 0 && typeof attr[0] === 'object') {
            dispatch(`${relation.module}/syncItems`, attr, { root: true })
            data[relation.attribute] = data[relation.attribute].map(obj => obj[rootGetters[`${relation.module}/key`]])
        }
    });
    return data */
}
