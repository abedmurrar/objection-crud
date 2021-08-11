const pluralize = require('pluralize');
const kebabCase = require('kebab-case');

/**
 *
 * @param {string} string
 * @returns string
 */
exports.lowerFirstLetter = (string) => string.charAt(0).toLowerCase() + string.substring(1);

/**
 *
 * @param {string} modelName
 * @returns string
 */
exports.resourcify = (modelName) => pluralize(kebabCase(this.lowerFirstLetter(modelName)));
