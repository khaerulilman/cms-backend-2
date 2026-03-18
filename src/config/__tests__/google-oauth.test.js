import { describe, it, expect, vi, beforeAll } from 'vitest';

const mockUse = vi.fn();
const mockSerializeUser = vi.fn();
const mockDeserializeUser = vi.fn();
const mockGoogleStrategy = vi.fn();

// Mock dependencies
vi.mock('passport', () => ({
  default: {
    use: mockUse,
    serializeUser: mockSerializeUser,
    deserializeUser: mockDeserializeUser,
  },
}));

vi.mock('passport-google-oauth20', () => ({
  Strategy: mockGoogleStrategy,
}));

vi.mock('../env.js', () => ({
  config: {
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
  },
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mocked-uuid-123'),
}));

const mockFindUserByEmail = vi.fn();
const mockFindUserById = vi.fn();
const mockCreateUser = vi.fn();

vi.mock('../../modules/auth/auth.repository.js', () => ({
  default: class MockAuthRepository {
    constructor() {
      this.findUserByEmail = mockFindUserByEmail;
      this.findUserById = mockFindUserById;
      this.createUser = mockCreateUser;
    }
  },
}));

describe('Google OAuth Configuration', () => {
  let googleStrategyCallback;
  let serializeUserCallback;
  let deserializeUserCallback;

  beforeAll(async () => {
    // Import the config file to trigger the setup
    await import('../google-oauth.js');

    // Get the callback from GoogleStrategy
    googleStrategyCallback = mockGoogleStrategy.mock.calls[0][1];

    // Get serialize/deserialize callbacks
    serializeUserCallback = mockSerializeUser.mock.calls[0][0];
    deserializeUserCallback = mockDeserializeUser.mock.calls[0][0];
  });

  describe('GoogleStrategy Configuration', () => {
    it('should configure passport with GoogleStrategy', () => {
      expect(mockUse).toHaveBeenCalled();
      expect(mockGoogleStrategy).toHaveBeenCalledWith(
        expect.objectContaining({
          clientID: 'test-client-id',
          clientSecret: 'test-client-secret',
          callbackURL: 'http://localhost:3000/auth/google/callback',
        }),
        expect.any(Function),
      );
    });

    it('should have correct OAuth credentials', () => {
      const callArgs = mockGoogleStrategy.mock.calls[0];
      const config = callArgs[0];

      expect(config.clientID).toBe('test-client-id');
      expect(config.clientSecret).toBe('test-client-secret');
      expect(config.callbackURL).toBe(
        'http://localhost:3000/auth/google/callback',
      );
    });
  });

  describe('Google OAuth Callback', () => {
    it('should find existing user by email', async () => {
      vi.clearAllMocks();

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const profile = {
        emails: [{ value: 'test@example.com' }],
        displayName: 'Test User',
      };

      mockFindUserByEmail.mockResolvedValue(mockUser);

      const done = vi.fn();

      await googleStrategyCallback(
        'access-token',
        'refresh-token',
        profile,
        done,
      );

      expect(mockFindUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });

    it('should create new user if not found', async () => {
      vi.clearAllMocks();

      const profile = {
        emails: [{ value: 'newuser@example.com' }],
        displayName: 'New User',
      };

      const newUser = {
        id: 'mocked-uuid-123',
        email: 'newuser@example.com',
        name: 'New User',
      };

      mockFindUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(newUser);

      const done = vi.fn();

      await googleStrategyCallback(
        'access-token',
        'refresh-token',
        profile,
        done,
      );

      expect(mockFindUserByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(mockCreateUser).toHaveBeenCalledWith({
        id: 'mocked-uuid-123',
        email: 'newuser@example.com',
        name: 'New User',
        password: 'mocked-uuid-123',
      });
      expect(done).toHaveBeenCalledWith(null, newUser);
    });

    it('should handle errors during authentication', async () => {
      vi.clearAllMocks();

      const profile = {
        emails: [{ value: 'test@example.com' }],
        displayName: 'Test User',
      };

      const error = new Error('Database error');
      mockFindUserByEmail.mockRejectedValue(error);

      const done = vi.fn();

      await googleStrategyCallback(
        'access-token',
        'refresh-token',
        profile,
        done,
      );

      expect(done).toHaveBeenCalledWith(error, null);
    });

    it('should extract email from profile', async () => {
      vi.clearAllMocks();

      const profile = {
        emails: [
          { value: 'primary@example.com' },
          { value: 'secondary@example.com' },
        ],
        displayName: 'Test User',
      };

      mockFindUserByEmail.mockResolvedValue({
        id: '123',
        email: 'primary@example.com',
        name: 'Test User',
      });

      const done = vi.fn();

      await googleStrategyCallback(
        'access-token',
        'refresh-token',
        profile,
        done,
      );

      expect(mockFindUserByEmail).toHaveBeenCalledWith('primary@example.com');
    });
  });

  describe('Serialize/Deserialize User', () => {
    it('should serialize user by id', () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      const done = vi.fn();

      serializeUserCallback(user, done);

      expect(done).toHaveBeenCalledWith(null, 'user-123');
    });

    it('should deserialize user by id', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockFindUserById.mockResolvedValue(mockUser);

      const done = vi.fn();

      await deserializeUserCallback('user-123', done);

      expect(mockFindUserById).toHaveBeenCalledWith('user-123');
      expect(done).toHaveBeenCalledWith(null, mockUser);
    });

    it('should handle deserialization errors', async () => {
      const error = new Error('User not found');

      mockFindUserById.mockRejectedValue(error);

      const done = vi.fn();

      await deserializeUserCallback('invalid-id', done);

      expect(done).toHaveBeenCalledWith(error, null);
    });
  });
});
