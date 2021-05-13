const Hapi = require('@hapi/hapi');
const routes = require('./routes');

const appPort = process.env.PORT || process.argv[2] || 5000;

const init = async () => {
  const server = Hapi.server({
    port: appPort,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  server.route(routes);

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
