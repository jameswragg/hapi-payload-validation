const Hapi = require('@hapi/hapi');
const Nunjucks = require('nunjucks');
const Vision = require('@hapi/vision');
const home = require('./home');
const signup = require('./signup');

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  await server.register(Vision);

  server.views({
    engines: {
      njk: {
        compile: (src, options) => {
          const template = Nunjucks.compile(src, options.environment);

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
    relativeTo: __dirname,
    path: '../templates',
    isCached: false, //! process.env.NODE_ENV !== "production"
  });

  await server.register(home);
  await server.register(signup);

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
