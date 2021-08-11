const express = require('express');
const pluralize = require('pluralize');
const kebabCase = require('kebab-case');
const wrap = require('express-async-wrap').default;
const { Model } = require('objection');
const debug = require('debug');

const log = debug('objection-crud');

const router = express.Router();

/**
 *
 * @param {string} string
 * @returns string
 */
const lowerFirstLetter = (string) => string.charAt(0).toLowerCase() + string.substring(1);

/**
 *
 * @param {string} modelName
 * @returns string
 */
const resourcify = (modelName) => pluralize(kebabCase(lowerFirstLetter(modelName)));

/**
 *
 * @param {typeof Model} model
 * @param {object} options
 * @param {boolean} options.includeRelations
 * @returns {express.Router}
 */
const crud = (model, { includeRelations = false }) => {
  const resource = resourcify(model.name);

  const subRouter = express.Router();

  log(`create route GET /${resource}/:id`);
  subRouter.get(
    '/:id',
    // eslint-disable-next-line no-unused-vars
    wrap(async (request, response, _next) => {
      const instance = await model
        .query()
        .findById(request.params.id)
        .throwIfNotFound();

      response.json(instance);
    }),
  );

  log(`create route GET /${resource}`);
  subRouter.get(
    '/',
    wrap(async (_request, response, _next) => {
      const instances = await model.query().select().throwIfNotFound();
      response.json(instances);
    }),
  );

  log(`create route PATCH /${resource}/:id`);
  subRouter.patch(
    '/:id',
    // @ts-ignore
    wrap(async (request, response, _next) => {
      const instance = await model.query().findById(request.params.id);
      instance.$query().patch(request.body);
      response.json(instance);
    }),
  );

  log(`create route POST /${resource}`);
  subRouter.post(
    '/',
    // @ts-ignore
    wrap(async (request, response, _next) => {
      const createdInstance = await model
        .query()
        .insertGraphAndFetch(request.body);

      response.json(createdInstance);
    }),
  );

  log(`create route DELETE /${resource}/:id`);
  subRouter.delete(
    '/:id',
    // @ts-ignore
    wrap(async (request, response, _next) => {
      const isDeleted = await model
        .query()
        .deleteById(request.params.id)
        .throwIfNotFound();

      response.sendStatus(isDeleted ? 204 : 400);
    }),
  );

  if (includeRelations) {
    const relations = Object.entries(model.getRelations()).map(
      ([graphName, relation]) => {
        // @ts-ignore
        const relationResourceName = '';

        return [
          graphName,
          relation instanceof Model.HasOneRelation
          || relation instanceof Model.BelongsToOneRelation
          || relation instanceof Model.HasOneThroughRelation
            ? pluralize.singular(kebabCase(lowerFirstLetter(graphName)))
            : pluralize(kebabCase(lowerFirstLetter(graphName))),
        ];
      },
    );

    for (const [relationName, relationalResource] of relations) {
      if (pluralize.isPlural(relationalResource)) {
        log(
          `create route GET /${resource}/:id/${relationalResource}/:relation_id`,
        );

        subRouter.get(
          `/:parentId/${relationalResource}/:id`,
          // @ts-ignore
          wrap(async (request, response, _next) => {
            const instance = await model
              .relatedQuery(relationName)
              .for(request.params.parentId)
              .findById(request.params.id)
              .throwIfNotFound();

            response.json(instance);
          }),
        );
      }

      log(`create route GET /${resource}/:id/${relationalResource}`);

      subRouter.get(
        `/:parentId/${relationalResource}`,
        // @ts-ignore
        wrap(async (request, response, _next) => {
          const query = model
            .relatedQuery(relationName)
            .for(request.params.parentId)
            .throwIfNotFound();

          if (pluralize.isSingular(relationalResource)) {
            query.first();
          }
          const instances = await query;
          response.json(instances);
        }),
      );

      log(
        `create route PATCH /${resource}/:id/${relationalResource}/:relation_id`,
      );

      subRouter.patch(
        `/:parentId/${relationalResource}/:id`,
        // @ts-ignore
        wrap(async (request, response, _next) => {
          const instance = await model
            .relatedQuery(relationName)
            .for(request.params.parentId)
            .findById(request.params.id)
            .throwIfNotFound();
          instance.$query().patch(request.body);
          response.json(instance);
        }),
      );

      log(`create route POST /${resource}/:id/${relationalResource}`);

      subRouter.post(
        `/:parentId/${relationalResource}`,
        // @ts-ignore
        wrap(async (request, response, _next) => {
          const createdInstance = await model
            .relatedQuery(relationName)
            .for(request.params.parentId)
            .insertAndFetch(request.body);

          response.json(createdInstance);
        }),
      );

      log(`create route DELETE /${resource}/:id/${relationalResource}/:id`);
      subRouter.delete(
        `/:parentId/${relationalResource}/:id`,
        // @ts-ignore
        wrap(async (request, response, _next) => {
          const isDeleted = await model
            .relatedQuery(relationName)
            .for(request.params.parentId)
            .deleteById(request.params.id)
            .throwIfNotFound();

          response.sendStatus(isDeleted ? 204 : 400);
        }),
      );
    }
  }

  router.use(`/${resource}`, subRouter);

  return router;
};

module.exports = crud;
