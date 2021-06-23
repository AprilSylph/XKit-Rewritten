/**
 * @param {...Array} arrays - one or more arrays
 * @returns {Array[]} The Cartesian product of the arrays
 */
export const cartesian = (...arrays) => {
  let product = arrays.shift().map(x => [x]);

  for (const currentArray of arrays) {
    const newProduct = [];

    for (const currentValue of currentArray) {
      for (const x of product) {
        newProduct.push([...x, currentValue]);
      }
    }

    product = newProduct;
  }

  return product;
};
