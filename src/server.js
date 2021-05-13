const Hapi = require('@hapi/hapi');
const routes = require('./routes');

const serverPort = process.env.PORT || 5000;
const serverHost = process.env.HOST || '0.0.0.0';

const init = async () => {
  const server = Hapi.server({
    port: serverPort,
    host: serverHost,
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
