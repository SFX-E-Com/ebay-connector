import {
  db,
  Collections,
  User,
  UserRoles,
  getDoc,
  queryDocs,
  createDoc,
  updateDoc,
  deleteDoc,
  getAllDocs,
  generateId
} from './firestore';
import type { UserRole } from './firestore';
import { PasswordService } from './auth';

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
}

export class UserService {

  static async findUserByEmail(email: string): Promise<(User & { password: string }) | null> {
    const users = await queryDocs<User>(
      Collections.USERS,
      [{ field: 'email', op: '==', value: email }]
    );

    if (users.length === 0) return null;

    return users[0] as User & { password: string };
  }

  static async findUserById(id: string): Promise<UserResponse | null> {
    const user = await getDoc<User>(Collections.USERS, id);

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name || null,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  static async getUserWithPassword(id: string): Promise<{ id: string; email: string; password: string } | null> {
    const user = await getDoc<User>(Collections.USERS, id);

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      password: user.password,
    };
  }

  static async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await updateDoc<User>(Collections.USERS, userId, {
      password: hashedPassword,
    });
  }

  // CRUD Methods for User Management
  static async getAllUsers(): Promise<UserResponse[]> {
    const users = await getAllDocs<User>(Collections.USERS, {
      orderBy: { field: 'createdAt', direction: 'desc' }
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || null,
      role: user.role,
      createdAt: user.createdAt,
    }));
  }

  static async getUserById(id: string): Promise<UserResponse | null> {
    return this.findUserById(id);
  }

  static async createUser(data: CreateUserData): Promise<UserResponse> {
    const { email, password, name, role = 'USER' as UserRole } = data;

    // Validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Validate role
    const validRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'USER'];
    if (!validRoles.includes(role)) {
      throw new Error('Invalid role specified');
    }

    // Check if user already exists
    const existingUser = await this.findUserByEmail(email);

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await PasswordService.hashPassword(password);

    // Create user
    const newUser = await createDoc<User>(Collections.USERS, {
      id: generateId(),
      email,
      password: hashedPassword,
      name: name || undefined,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name || null,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  }

  static async updateUser(id: string, data: Partial<{
    email: string;
    name: string;
    role: UserRole;
  }>): Promise<UserResponse | null> {
    // Check if user exists
    const existingUser = await getDoc<User>(Collections.USERS, id);

    if (!existingUser) {
      return null;
    }

    // If email is being updated, check for duplicates
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await this.findUserByEmail(data.email);

      if (emailExists) {
        throw new Error('User with this email already exists');
      }
    }

    await updateDoc<User>(Collections.USERS, id, data);

    const updatedUser = await getDoc<User>(Collections.USERS, id);

    if (!updatedUser) return null;

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name || null,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
    };
  }

  static async deleteUser(id: string): Promise<UserResponse | null> {
    // Check if user exists
    const existingUser = await getDoc<User>(Collections.USERS, id);

    if (!existingUser) {
      return null;
    }

    const response: UserResponse = {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name || null,
      role: existingUser.role,
      createdAt: existingUser.createdAt,
    };

    await deleteDoc(Collections.USERS, id);

    return response;
  }
}

// Re-export UserRole for compatibility
export { UserRole };

export const userService = UserService;