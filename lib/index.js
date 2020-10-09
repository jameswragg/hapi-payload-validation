const Joi = require('@hapi/joi');

const internals = {};

internals.buildUsefulErrorObject = (errors) => {
  const usefulErrors = {};

  errors.forEach((error) => {
    const key = (error.context && error.context.label) || error.path.join('_');

    if (!usefulErrors.hasOwnProperty(key)) {
      usefulErrors[key] = {
        type: error.type,
        msg: `error.${key}.${error.type}`,
      };
    }
  });
  return usefulErrors;
};

internals.handlePayloadError = (request, h) => {
  const { response } = request;

  if (response.isBoom) {
    request.app.payloadError = true;

    return internals.SignUp(request, h);
  }

  return h.continue;
};

internals.failAction = (request, h, error) => {
  if (!request.app.validationErrors) {
    request.app.validationErrors = [];
  }

  request.app.validationErrors = request.app.validationErrors.concat(error.details || error);

  return h.continue;
};

internals.SignUp = (request, h) => {
  let errors = false;

  if (request.app.payloadError) {
    errors = internals.buildUsefulErrorObject([{ path: ['global'], type: 'payload' }]);
  }

  if (request.app.validationErrors) {
    errors = internals.buildUsefulErrorObject(request.app.validationErrors);
  }

  if (errors) {
    return h
      .view('signup', {
        errors, // error object used in html template
        values: request.payload, // (escaped) values displayed in form inputs
        headers: request.headers,
      })
      .takeover();
  }

  // validation requirements met
  if (request.method === 'post') {
    return h.redirect('/success');
  }

  // standard get request
  return h.view('signup');
};

internals.SignUpSuccess = (request, h) => {
  return h.view('success');
};

const oneMbInBytes = 1048576;

exports.plugin = {
  name: 'signup',
  once: true,
  register(server) {
    server.route({
      method: 'GET',
      path: '/signup',
      handler: internals.SignUp,
    });

    server.route({
      method: 'POST',
      path: '/signup',
      handler: internals.SignUp,
      options: {
        ext: {
          onPreResponse: {
            method: internals.handlePayloadError,
          },
        },
        payload: {
          output: 'stream',
          multipart: true,
        },
        validate: {
          payload: Joi.object({
            emailAddress: Joi.string().email().required(),
            password: Joi.string().min(3).required(),
            cv: Joi.object({
              hapi: Joi.object({
                filename: Joi.string().required().label('filename'),
              }).unknown(true),
              _data: Joi.binary()
                .max(oneMbInBytes * 2)
                .label('filename'),
            }).unknown(true),
          }).unknown(true),
          options: {
            abortEarly: false,
          },
          failAction: internals.failAction,
        },
      },
    });

    server.route({
      method: 'GET',
      path: '/success',
      handler: internals.SignUpSuccess,
    });
  },
};
