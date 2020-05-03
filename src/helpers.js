export function normalizeRelations(data, fields) {
  return {
    ...data,
    ...fields.reduce(
      (prev, field) => ({
        ...prev,
        [field.atribute]: Array.isArray(data[field.atribute])
          ? data[field.atribute].map(x => x.id)
          : data[field.atribute].id
      }),
      {}
    )
  };
}

export function resolveRelations(data, fields, rootGetters) {
  return {
    ...data,
    ...fields.reduce(
      (prev, field) => ({
        ...prev,
        [field.atribute]: Array.isArray(data[field.atribute])
          ? data[field.atribute].map(x => rootGetters[`${field.module}/find`](x))
          : rootGetters[`${field.module}/find`](data[field.atribute])
      }),
      {}
    )
  };
}