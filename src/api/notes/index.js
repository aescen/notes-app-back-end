const NotesHandler = require('./handler.js');
const routes = require('./routes.js');

module.exports = {
  name: 'notes',
  version: '1.0.0',
  register: async (server, { service }) => {
    const notesHandler = new NotesHandler(service);
    server.route(routes(notesHandler));
  },
};
