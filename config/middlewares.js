module.exports = [
  'strapi::logger',
  'strapi::errors',
    {
      name: 'strapi::cors',
      config: {
        enabled: true,
        origin: ['http://localhost:5173', 'https://www.themilie.com'],
        headers: '*',
        methods: ['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'],
      },
    },
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
