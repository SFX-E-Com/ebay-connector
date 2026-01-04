import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserService } from '../../app/lib/services/userService';
import { db, Collections } from '../../app/lib/services/firestore';

describe('UserService Integration Tests', () => {
  // Clean up users collection before each test
  beforeEach(async () => {
    const snapshot = await db.collection(Collections.USERS).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  });

  // Clean up after each test
  afterEach(async () => {
    const snapshot = await db.collection(Collections.USERS).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  });

  describe('createUser', () => {
    it('creates a new user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const user = await UserService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.role).toBe('USER');
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('throws error if email already exists', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
      };

      await UserService.createUser(userData);

      await expect(UserService.createUser(userData)).rejects.toThrow(
        'User with this email already exists'
      );
    });

    it('throws error for invalid password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Too short
      };

      await expect(UserService.createUser(userData)).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    it('throws error for invalid role', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'INVALID_ROLE' as 'USER',
      };

      await expect(UserService.createUser(userData)).rejects.toThrow(
        'Invalid role specified'
      );
    });
  });

  describe('findUserByEmail', () => {
    it('finds an existing user by email', async () => {
      await UserService.createUser({
        email: 'find@example.com',
        password: 'password123',
        name: 'Find Me',
      });

      const user = await UserService.findUserByEmail('find@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('find@example.com');
      expect(user?.password).toBeDefined(); // Should include hashed password
    });

    it('returns null for non-existent email', async () => {
      const user = await UserService.findUserByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('findUserById', () => {
    it('finds an existing user by ID', async () => {
      const created = await UserService.createUser({
        email: 'findbyid@example.com',
        password: 'password123',
      });

      const user = await UserService.findUserById(created.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(created.id);
      expect(user?.email).toBe('findbyid@example.com');
    });

    it('returns null for non-existent ID', async () => {
      const user = await UserService.findUserById('nonexistent-id');

      expect(user).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('updates user fields', async () => {
      const created = await UserService.createUser({
        email: 'update@example.com',
        password: 'password123',
        name: 'Original Name',
      });

      const updated = await UserService.updateUser(created.id, {
        name: 'Updated Name',
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.email).toBe('update@example.com');
    });

    it('prevents duplicate email on update', async () => {
      await UserService.createUser({
        email: 'first@example.com',
        password: 'password123',
      });

      const second = await UserService.createUser({
        email: 'second@example.com',
        password: 'password123',
      });

      await expect(
        UserService.updateUser(second.id, { email: 'first@example.com' })
      ).rejects.toThrow('User with this email already exists');
    });

    it('returns null for non-existent user', async () => {
      const result = await UserService.updateUser('nonexistent-id', {
        name: 'New Name',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('deletes an existing user', async () => {
      const created = await UserService.createUser({
        email: 'delete@example.com',
        password: 'password123',
      });

      const deleted = await UserService.deleteUser(created.id);

      expect(deleted).toBeDefined();
      expect(deleted?.id).toBe(created.id);

      // Verify user is deleted
      const found = await UserService.findUserById(created.id);
      expect(found).toBeNull();
    });

    it('returns null for non-existent user', async () => {
      const result = await UserService.deleteUser('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    it('returns all users', async () => {
      await UserService.createUser({
        email: 'user1@example.com',
        password: 'password123',
      });

      await UserService.createUser({
        email: 'user2@example.com',
        password: 'password123',
      });

      const users = await UserService.getAllUsers();

      expect(users).toHaveLength(2);
      expect(users.map((u) => u.email)).toContain('user1@example.com');
      expect(users.map((u) => u.email)).toContain('user2@example.com');
    });

    it('returns empty array when no users exist', async () => {
      const users = await UserService.getAllUsers();

      expect(users).toHaveLength(0);
    });
  });
});
