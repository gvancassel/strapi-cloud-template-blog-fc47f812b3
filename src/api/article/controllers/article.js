'use strict';

/**
 *  article controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::article.article', ({ strapi }) => ({
  async find(ctx) {
    // Preserve user's pagination if provided, otherwise set defaults
    const page = ctx.query?.pagination?.page 
      ? Number(ctx.query.pagination.page) 
      : 1;
    const pageSize = ctx.query?.pagination?.pageSize 
      ? Math.min(Number(ctx.query.pagination.pageSize), 50) 
      : 10;

    ctx.query = {
      ...ctx.query,
      // Only limit fields if not explicitly requested by user
      fields: ctx.query?.fields || ['title', 'description', 'slug', 'publishedAt'],
      pagination: { page, pageSize },
      populate: {
        ...ctx.query?.populate,
        category: ctx.query?.populate?.category || { fields: ['name', 'slug'] },
        author: ctx.query?.populate?.author || { 
          fields: ['name'],
          populate: {
            avatar: { fields: ['url', 'alternativeText', 'width', 'height'] },
          },
        },
        thumbnail: ctx.query?.populate?.thumbnail !== false 
          ? { fields: ['url', 'alternativeText', 'width', 'height'] }
          : false,
        cover: ctx.query?.populate?.cover !== false
          ? { fields: ['url', 'alternativeText', 'width', 'height'] }
          : false,
      },
      // Only set publicationState if not explicitly provided
      publicationState: ctx.query?.publicationState || 'live',
    };

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  async findOne(ctx) {
    ctx.query = {
      ...ctx.query,
      populate: {
        ...ctx.query?.populate,
        category: ctx.query?.populate?.category || { fields: ['name', 'slug', 'description'] },
        author: ctx.query?.populate?.author || { 
          fields: ['name', 'email'],
          populate: {
            avatar: { fields: ['url', 'alternativeText', 'width', 'height'] },
          },
        },
        cover: ctx.query?.populate?.cover !== false
          ? { fields: ['url', 'alternativeText', 'width', 'height', 'mime', 'size'] }
          : false,
        thumbnail: ctx.query?.populate?.thumbnail !== false
          ? { fields: ['url', 'alternativeText', 'width', 'height', 'mime', 'size'] }
          : false,
        blocks: ctx.query?.populate?.blocks !== false ? {
          populate: {
            'shared.rich-text': { fields: ['body'] },
            'shared.quote': { fields: ['title', 'body'] },
            'shared.media': {
              fields: [],
              populate: {
                file: { fields: ['url', 'alternativeText', 'width', 'height', 'mime', 'size'] },
              },
            },
            'shared.slider': {
              populate: {
                files: { fields: ['url', 'alternativeText', 'width', 'height', 'mime', 'size'] },
              },
            },
            'shared.video-embed': { fields: ['url', 'title'] },
          },
        } : false,
      },
      // Only set publicationState if not explicitly provided
      publicationState: ctx.query?.publicationState || 'live',
    };

    const { data, meta } = await super.findOne(ctx);
    return { data, meta };
  },
}));
