'use strict';

/**
 *  article controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: {
        cover: true,
        thumbnail: true,
        category: true,
        author: { populate: '*' },
        blocks: { populate: '*' },
      },
    };

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  async findOne(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: {
        cover: true,
        thumbnail: true,
        category: true,
        author: { populate: '*' },
        blocks: { populate: '*' },
      },
    };

    const { data, meta } = await super.findOne(ctx);
    return { data, meta };
  },
}));
