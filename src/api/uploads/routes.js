const path = require('path');

const routes = (handler) => [
  {
    method: 'POST',
    path: '/uploads/image',
    handler: handler.postUploadImagesHandler,
    options: {
      payload: {
        allow: 'multipart/form-data',
        multipart: true,
        output: 'stream',
      },
    },
  },
  {
    method: 'GET',
    path: '/uploads/{param*}',
    handler: {
      directory: {
        path: path.resolve(__dirname, 'files'),
      },
    },
  },
];

module.exports = routes;
