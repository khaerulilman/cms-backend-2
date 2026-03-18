import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  ConflictError,
  AuthenticationError,
  NotFoundError,
} from "../../../utils/errors.js";
import HashUtil from "../../../utils/hash.js";
import JwtUtil from "../../../utils/jwt.js";
import { AuthService } from "../auth.service.js";

// Mock uuid
vi.mock("uuid", () => ({
  v4: vi.fn(() => "mocked-uuid-123"),
}));

// Mock dependencies
vi.mock("../../../utils/hash.js", () => ({
  default: {
    hashPassword: vi.fn(),
    comparePassword: vi.fn(),
  },
}));

vi.mock("../../../utils/jwt.js", () => ({
  default: {
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    verifyToken: vi.fn(),
  },
}));

vi.mock("../auth.repository.js", () => ({
  default: class MockAuthRepository {
    findUserByEmail = vi.fn();
    createUser = vi.fn();
    findUserById = vi.fn();
    updateUser = vi.fn();
    createRefreshToken = vi.fn();
    findRefreshToken = vi.fn();
    revokeRefreshToken = vi.fn();
    revokeAllUserTokens = vi.fn();
    getUserActiveTokens = vi.fn();
    deleteExpiredTokens = vi.fn();
  },
}));

describe("AuthService", () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      findUserByEmail: vi.fn(),
      createUser: vi.fn(),
      findUserById: vi.fn(),
      updateUser: vi.fn(),
      createRefreshToken: vi.fn(),
      findRefreshToken: vi.fn(),
      revokeRefreshToken: vi.fn(),
      revokeAllUserTokens: vi.fn(),
      getUserActiveTokens: vi.fn(),
      deleteExpiredTokens: vi.fn(),
    };

    service = new AuthService();
    service.repository = mockRepository;
  });

  describe("register", () => {
    it("should successfully register a new user", async () => {
      const email = "newuser@example.com";
      const password = "securepassword123";
      const name = "New User";

      const mockCreatedUser = {
        id: "mocked-uuid-123",
        email,
        password: "hashed_password",
        name,
        createdAt: new Date("2025-01-15"),
      };

      mockRepository.findUserByEmail.mockResolvedValue(null);
      HashUtil.hashPassword.mockResolvedValue("hashed_password");
      mockRepository.createUser.mockResolvedValue(mockCreatedUser);
      JwtUtil.generateAccessToken.mockReturnValue("access_token");
      JwtUtil.generateRefreshToken.mockReturnValue("refresh_token");
      JwtUtil.verifyToken.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 86400,
      });
      mockRepository.createRefreshToken.mockResolvedValue({});

      const result = await service.register(email, password, name);

      expect(mockRepository.findUserByEmail).toHaveBeenCalledWith(email);
      expect(HashUtil.hashPassword).toHaveBeenCalledWith(password);
      expect(mockRepository.createUser).toHaveBeenCalledWith({
        id: expect.any(String),
        email,
        password: "hashed_password",
        name,
      });
      expect(JwtUtil.generateAccessToken).toHaveBeenCalledWith(
        "mocked-uuid-123",
        email,
      );
      expect(JwtUtil.generateRefreshToken).toHaveBeenCalledWith(
        "mocked-uuid-123",
        email,
      );
      expect(result).toEqual({
        user: {
          id: "mocked-uuid-123",
          email,
          name,
          createdAt: new Date("2025-01-15"),
        },
        accessToken: "access_token",
        refreshToken: "refresh_token",
      });
    });

    it("should throw ConflictError if user already exists", async () => {
      const email = "existing@example.com";
      const existingUser = { id: "user-456", email };

      mockRepository.findUserByEmail.mockResolvedValue(existingUser);

      await expect(
        service.register(email, "password123", "User"),
      ).rejects.toThrow(ConflictError);

      expect(mockRepository.findUserByEmail).toHaveBeenCalledWith(email);
      expect(mockRepository.createUser).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should successfully login with valid credentials", async () => {
      const email = "test@example.com";
      const password = "securepassword123";

      const mockUser = {
        id: "user-123",
        email,
        password: "hashed_password",
        name: "Test User",
        createdAt: new Date("2025-01-15"),
      };

      mockRepository.findUserByEmail.mockResolvedValue(mockUser);
      HashUtil.comparePassword.mockResolvedValue(true);
      JwtUtil.generateAccessToken.mockReturnValue("access_token");
      JwtUtil.generateRefreshToken.mockReturnValue("refresh_token");
      JwtUtil.verifyToken.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 86400,
      });
      mockRepository.createRefreshToken.mockResolvedValue({});

      const result = await service.login(email, password);

      expect(mockRepository.findUserByEmail).toHaveBeenCalledWith(email);
      expect(HashUtil.comparePassword).toHaveBeenCalledWith(
        password,
        "hashed_password",
      );
      expect(JwtUtil.generateAccessToken).toHaveBeenCalledWith(
        "user-123",
        email,
      );
      expect(JwtUtil.generateRefreshToken).toHaveBeenCalledWith(
        "user-123",
        email,
      );
      expect(result).toEqual({
        user: {
          id: "user-123",
          email,
          name: "Test User",
          createdAt: new Date("2025-01-15"),
        },
        accessToken: "access_token",
        refreshToken: "refresh_token",
      });
    });

    it("should throw AuthenticationError if user not found", async () => {
      const email = "nonexistent@example.com";
      mockRepository.findUserByEmail.mockResolvedValue(null);

      await expect(service.login(email, "password")).rejects.toThrow(
        AuthenticationError,
      );

      expect(mockRepository.findUserByEmail).toHaveBeenCalledWith(email);
    });

    it("should throw AuthenticationError if password is incorrect", async () => {
      const email = "test@example.com";
      const password = "wrongpassword";

      const mockUser = {
        id: "user-123",
        email,
        password: "hashed_password",
        name: "Test User",
      };

      mockRepository.findUserByEmail.mockResolvedValue(mockUser);
      HashUtil.comparePassword.mockResolvedValue(false);

      await expect(service.login(email, password)).rejects.toThrow(
        AuthenticationError,
      );

      expect(HashUtil.comparePassword).toHaveBeenCalledWith(
        password,
        "hashed_password",
      );
    });
  });

  describe("refreshToken", () => {
    it("should generate new tokens with valid refresh token", async () => {
      const refreshToken = "valid_refresh_token";

      const decodedToken = {
        id: "user-123",
        email: "test@example.com",
        type: "refresh",
        exp: Math.floor(Date.now() / 1000) + 86400,
      };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        name: "Test User",
      };

      const mockStoredToken = {
        id: "token-123",
        token: refreshToken,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
      };

      JwtUtil.verifyToken.mockReturnValue(decodedToken);
      mockRepository.findRefreshToken.mockResolvedValue(mockStoredToken);
      mockRepository.findUserById.mockResolvedValue(mockUser);
      mockRepository.revokeRefreshToken.mockResolvedValue({});
      JwtUtil.generateAccessToken.mockReturnValue("new_access");
      JwtUtil.generateRefreshToken.mockReturnValue("new_refresh");
      mockRepository.createRefreshToken.mockResolvedValue({});

      const result = await service.refreshToken(refreshToken);

      expect(JwtUtil.verifyToken).toHaveBeenCalledWith(refreshToken);
      expect(mockRepository.findRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
      expect(mockRepository.findUserById).toHaveBeenCalledWith("user-123");
      expect(mockRepository.revokeRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
      expect(JwtUtil.generateAccessToken).toHaveBeenCalledWith(
        "user-123",
        "test@example.com",
      );
      expect(JwtUtil.generateRefreshToken).toHaveBeenCalledWith(
        "user-123",
        "test@example.com",
      );
      expect(result).toEqual({
        accessToken: "new_access",
        refreshToken: "new_refresh",
      });
    });

    it("should throw AuthenticationError if refresh token is invalid", async () => {
      const refreshToken = "invalid_token";
      JwtUtil.verifyToken.mockReturnValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        AuthenticationError,
      );
    });

    it("should throw AuthenticationError if token type is not refresh", async () => {
      const refreshToken = "access_token";
      const decodedToken = {
        id: "user-123",
        type: "access",
      };

      JwtUtil.verifyToken.mockReturnValue(decodedToken);
      mockRepository.findRefreshToken.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        AuthenticationError,
      );
    });

    it("should throw NotFoundError if user not found", async () => {
      const refreshToken = "valid_refresh_token";
      const decodedToken = {
        id: "user-123",
        type: "refresh",
        exp: Math.floor(Date.now() / 1000) + 86400,
      };

      const mockStoredToken = {
        id: "token-123",
        token: refreshToken,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
      };

      JwtUtil.verifyToken.mockReturnValue(decodedToken);
      mockRepository.findRefreshToken.mockResolvedValue(mockStoredToken);
      mockRepository.findUserById.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("should throw AuthenticationError if refresh token is empty", async () => {
      await expect(service.refreshToken("")).rejects.toThrow(
        AuthenticationError,
      );
    });
  });

  describe("getProfile", () => {
    it("should return user profile successfully", async () => {
      const userId = "user-123";
      const mockUser = {
        id: userId,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      };

      mockRepository.findUserById.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(mockRepository.findUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        id: userId,
        email: "test@example.com",
        name: "Test User",
        createdAt: new Date("2025-01-15"),
        updatedAt: new Date("2025-01-15"),
      });
    });

    it("should throw NotFoundError if user not found", async () => {
      const userId = "non-existent-user";
      mockRepository.findUserById.mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(NotFoundError);

      expect(mockRepository.findUserById).toHaveBeenCalledWith(userId);
    });
  });
});
