const internals = {};

internals.Home = (request, h) => {
  return h.redirect('/signup');
  // return h.view("index", {
  //   title: "Hapi " + request.server.version,
  //   message: "Hello Nunjucks!",
  // });
};

exports.plugin = {
  name: 'home',
  once: true,
  register(server) {
    server.route({
      method: 'GET',
      path: '/',
      handler: internals.Home,
    });
  },
};
