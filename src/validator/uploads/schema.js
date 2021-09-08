const Joi = require('joi');

const ImageHeaderSchema = Joi.object({
  'content-type': Joi.string().valid(
    'image/apng',
    'image/avif',
    'image/bmp',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/tiff',
    'image/webp',
    'image/x-icon',
  ).required(),
}).unknown();

module.exports = { ImageHeaderSchema };
