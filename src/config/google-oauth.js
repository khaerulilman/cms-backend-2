import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';

import AuthRepository from '../modules/auth/auth.repository.js';
import logger from '../utils/logger.js';

import { config } from './env.js';

const authRepository = new AuthRepository();

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // Find or create user
        let user = await authRepository.findUserByEmail(email);

        if (!user) {
          // Create new user with a random password for OAuth users
          user = await authRepository.createUser({
            id: uuidv4(),
            email,
            name,
            password: uuidv4(), // Random password for OAuth users
          });
          logger.info({ email }, 'New user created via Google OAuth');
        } else {
          logger.debug({ email }, 'Existing user logged in via Google OAuth');
        }

        return done(null, user);
      } catch (error) {
        logger.error({ err: error }, 'Google OAuth authentication failed');
        return done(error, null);
      }
    },
  ),
);

logger.info('Google OAuth strategy initialized');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await authRepository.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
