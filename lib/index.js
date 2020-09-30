const Hapi = require('@hapi/hapi');
const Vision = require('@hapi/vision');
const Joi = require('joi');
const Nunjucks = require('nunjucks');

const Path = require('path');

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  server.validator(Joi);
  await server.register(Vision);

  server.views({
    engines: {
      njk: {
        compile: (src, options) => {
          const template = Nunjucks.compile(src, options.environment, options.filename);

          return (context) => {
            return template.render(context);
          };
        },

        prepare: (options, next) => {
          options.compileOptions.environment = Nunjucks.configure(options.path, { watch: false });
          return next();
        },
      },
    },
    path: `${__dirname}/../templates`,
    isCached: false,
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      // return "Hello World!";
      return h.view('index', { msg: 'Hello World!' });
    },
  });

  server.route({
    method: 'POST',
    path: '/',
    options: {
      payload: {
        multipart: true,
        output: 'stream',
        parse: true,
        maxBytes: 1048576, // 1mb
        failAction: (request, h, err) => {
          if (!request.app.payloadErrors) {
            request.app.payloadErrors = [];
          }

          request.app.payloadErrors.push(err);

          return h.continue;
        },
      },
      validate: {
        payload: Joi.object({
          name: Joi.string().min(1).max(140),
          file: Joi.object(),
        }),
        failAction: (request, h, err) => {
          if (!request.app.validationErrors) {
            request.app.validationErrors = [];
          }

          request.app.validationErrors.push(err.details.map((e) => e.message));

          return h.continue;
        },
        options: {
          abortEarly: false,
        },
      },
    },
    handler: (request, h) => {
      return h.view('index-post', { request, msg: 'POST' });
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
