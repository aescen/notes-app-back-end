require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Jwt = require('@hapi/jwt');
const ClientError = require('./exceptions/ClientError');

// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsService = require('./services/postgres/CollaborationsService');
const CollaborationValidator = require('./validator/collaboration');
// notes
const notes = require('./api/notes');
const NotesService = require('./services/postgres/NotesService');
const NotesValidator = require('./validator/notes');
// users
const users = require('./api/users');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users');
// authentications
const authentications = require('./api/authentications');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const TokenManager = require('./tokenize/TokenManager');
const AuthenticationsValidator = require('./validator/authentications');
// exports
const _exports = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');
// uploads
const uploads = require('./api/uploads');
// const StorageService = require('./services/storage/StorageService');
const StorageService = require('./services/S3/S3Service');
const UploadsValidator = require('./validator/uploads');

const init = async () => {
  try {
    const collaborationsService = new CollaborationsService();
    const notesService = new NotesService(collaborationsService);
    const usersService = new UsersService();
    const authenticationsService = new AuthenticationsService();
    const storageService = new StorageService();

    const server = Hapi.server({
      port: process.env.PORT,
      host: process.env.HOST,
      routes: {
        cors: {
          origin: ['*'],
        },
      },
    });

    // 3rd party plugin
    await server.register([
      {
        plugin: Jwt,
      },
      {
        plugin: Inert,
      },
    ]);

    // Auth strategies
    server.auth.strategy('notesapp_jwt', 'jwt', {
      keys: process.env.ACCESS_TOKEN_KEY,
      verify: {
        aud: false,
        iss: false,
        sub: false,
        maxAgeSec: process.env.ACCESS_TOKEN_AGE,
      },
      validate: (artifacts) => ({
        isValid: true,
        credentials: {
          id: artifacts.decoded.payload.id,
        },
      }),
    });

    // server.auth.default('notesapp_jwt');

    await server.register([
      {
        plugin: collaborations,
        options: {
          collaborationsService,
          notesService,
          validator: CollaborationValidator,
        },
      },
      {
        plugin: notes,
        options: {
          service: notesService,
          validator: NotesValidator,
        },
      },
      {
        plugin: users,
        options: {
          service: usersService,
          validator: UsersValidator,
        },
      },
      {
        plugin: authentications,
        options: {
          authenticationsService,
          usersService,
          tokenManager: TokenManager,
          validator: AuthenticationsValidator,
        },
      },
      {
        plugin: _exports,
        options: {
          service: ProducerService,
          validator: ExportsValidator,
        },
      },
      {
        plugin: uploads,
        options: {
          service: storageService,
          validator: UploadsValidator,
        },
      },
    ]);

    server.ext('onPreResponse', (request, h) => {
      const { response } = request;

      if (response instanceof (ClientError)) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      // Server Error
      if (response instanceof (Error) && response.isServer) {
        console.error(response.stack);
        const newResponse = h.response({
          status: 'error',
          message: 'Maaf, terjadi kegagalan pada server kami.',
        });
        newResponse.code(500);
        return newResponse;
      }

      return response.continue || response;
    });

    await server.start();
    console.log(`Server berjalan pada ${server.info.uri}`);
  } catch (error) {
    console.error(error);
  }
};

init();
