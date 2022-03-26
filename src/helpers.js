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

export function resolveRelations(data, state, rootGetters, level=1) {
    return {
        ...data,
        ...state.relations.reduce(
            (prev, relation) => {
                let alias = relation.alias != undefined ? relation.alias : relation.attribute

                if(state.maxRelationsResolve>=level){
                    return ({
                        ...prev,
                        [alias]: relationLinck(data, alias, relation, state.key, rootGetters, level+1)
                    })
                }
                else{
                    console.log('Max relation resolve exceded ' +JSON.stringify(state))
                    return ({
                        ...prev,
                        ['errorResolve']: 'Max relation resolve exceded '+JSON.stringify(state)
                    })
                }

            }, {}
        )
    };
}

function relationLinck(data, alias, relation, key, rootGetters, level) {
    if (relation.hasMany === false) {
        return Array.isArray(data[relation.alias]) ?
            data[relation.alias].map(x => rootGetters[`${relation.module}/find`](x, level)) :
            rootGetters[`${relation.module}/find`](data[relation.attribute], level)
    } else {
        return rootGetters[`${relation.module}/filter`](d => d[relation.attribute] === data[key], level)
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
