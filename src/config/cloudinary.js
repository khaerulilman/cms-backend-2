import cloudinary from 'cloudinary';

import logger from '../utils/logger.js';

import { config as env } from './env.js';

cloudinary.v2.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

logger.info('Cloudinary configured successfully');

export default cloudinary.v2;
