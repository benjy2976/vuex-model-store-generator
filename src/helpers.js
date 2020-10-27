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
        return Array.isArray(data[alias]) ?
            data[relation.attribute].map(x => rootGetters[`${relation.module}/find`](x)) :
            rootGetters[`${relation.module}/find`](data[relation.attribute])
    } else {
        return rootGetters[`${relation.module}/list`].filter(d => d[relation.attribute] === data[key])
    }
}

export function exportRelations(data, relations, dispatch) {
    console.log(dispatch)
    for (const index in relations) {
        let relation = relations[index]
        let attr = data[relation.attribute]
        console.log(attr)
        if (attr !== undefined && Array.isArray(attr) && attr.length > 0 && typeof attr[0] === 'object') {
            dispatch(`${relation.module}/syncItems`, attr, {
                root: true
            })
            delete data[relation.attribute]
        }
    }
    return data
}
