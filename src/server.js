require('dotenv').config();

const Hapi = require('@hapi/hapi');
const notes = require('./api/notes');
const NotesService = require('./services/postgres/NotesService');
const NotesValidator = require('./validator/notes');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || (process.env.NODE_ENV !== 'prod' ? process.env.PORT_DEV : process.env.PORT_PROD),
    host: process.env.HOST || (process.env.NODE_ENV !== 'prod' ? process.env.HOST_DEV : process.env.HOST_PROD),
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  const notesService = new NotesService();
  await server.register({
    plugin: notes,
    options: {
      service: notesService,
      validator: NotesValidator,
    },
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
