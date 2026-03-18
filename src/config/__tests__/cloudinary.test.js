import { describe, it, expect, vi, beforeAll } from 'vitest';

const mockConfig = vi.fn();

// Mock cloudinary before importing the config
vi.mock('cloudinary', () => ({
  default: {
    v2: {
      config: mockConfig,
    },
  },
}));

vi.mock('../env.js', () => ({
  config: {
    CLOUDINARY_CLOUD_NAME: 'test-cloud-name',
    CLOUDINARY_API_KEY: 'test-api-key',
    CLOUDINARY_API_SECRET: 'test-api-secret',
  },
}));

describe('Cloudinary Configuration', () => {
  beforeAll(async () => {
    // Import the config file to trigger the setup
    await import('../cloudinary.js');
  });

  describe('Configuration Setup', () => {
    it('should configure cloudinary with correct credentials', () => {
      expect(mockConfig).toHaveBeenCalledWith({
        cloud_name: 'test-cloud-name',
        api_key: 'test-api-key',
        api_secret: 'test-api-secret',
      });
    });

    it('should configure cloudinary exactly once', () => {
      expect(mockConfig).toHaveBeenCalledTimes(1);
    });

    it('should include all required cloudinary configuration fields', () => {
      const configCall = mockConfig.mock.calls[0][0];

      expect(configCall).toHaveProperty('cloud_name');
      expect(configCall).toHaveProperty('api_key');
      expect(configCall).toHaveProperty('api_secret');
    });

    it('should use environment variables for configuration', () => {
      const configCall = mockConfig.mock.calls[0][0];

      expect(configCall.cloud_name).toBe('test-cloud-name');
      expect(configCall.api_key).toBe('test-api-key');
      expect(configCall.api_secret).toBe('test-api-secret');
    });
  });

  describe('Environment Variables', () => {
    it('should use CLOUDINARY_CLOUD_NAME from env', () => {
      const configCall = mockConfig.mock.calls[0][0];
      expect(configCall.cloud_name).toBe('test-cloud-name');
    });

    it('should use CLOUDINARY_API_KEY from env', () => {
      const configCall = mockConfig.mock.calls[0][0];
      expect(configCall.api_key).toBe('test-api-key');
    });

    it('should use CLOUDINARY_API_SECRET from env', () => {
      const configCall = mockConfig.mock.calls[0][0];
      expect(configCall.api_secret).toBe('test-api-secret');
    });
  });

  describe('Configuration Object Structure', () => {
    it('should pass object with exactly 3 properties', () => {
      const configCall = mockConfig.mock.calls[0][0];
      expect(Object.keys(configCall)).toHaveLength(3);
    });

    it('should use snake_case for configuration keys', () => {
      const configCall = mockConfig.mock.calls[0][0];
      expect(configCall).toHaveProperty('cloud_name');
      expect(configCall).toHaveProperty('api_key');
      expect(configCall).toHaveProperty('api_secret');
    });

    it('should not include undefined values', () => {
      const configCall = mockConfig.mock.calls[0][0];
      expect(configCall.cloud_name).not.toBeUndefined();
      expect(configCall.api_key).not.toBeUndefined();
      expect(configCall.api_secret).not.toBeUndefined();
    });
  });
});
