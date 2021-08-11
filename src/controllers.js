const wrap = require('express-async-wrap').default;
const debug = require('debug');
const { resourcify } = require('./utils');

const log = debug('objection-crud');

class ModelController {
  /**
   * @constructor
   * @param {typeof import('objection').Model} model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   *
   * @param {import('express').Request<{id:string}>} request
   * @param {*} response
   * @param {*} next
   */
  async getOne(request, response, next) {
    const instance = await this.model
      .query()
      .findById(request.params.id)
      .throwIfNotFound();

    response.json(instance);
  }

  async getAll(request, response, next) {
    const instances = await this.model.query().select().throwIfNotFound();
    response.json(instances);
  }

  toRouter() {
    // eslint-disable-next-line global-require
    const express = require('express');
    const router = express.Router();
    const resource = resourcify(this.model.name);
    router.get(`/${resource}/:id`, wrap(this.getOne));
    return router;
  }
}

module.exports = ModelController;
