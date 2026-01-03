import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '../../../lib/services/userService';
import { TokenService } from '../../../lib/services/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role = 'USER' } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must be at least 6 characters',
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['USER', 'ADMIN', 'SUPER_ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid role specified',
          validRoles,
        },
        { status: 400 }
      );
    }

    try {
      // Create user using UserService (handles duplicate check internally)
      const user = await UserService.createUser({
        email,
        password,
        name,
        role: role as 'USER' | 'ADMIN' | 'SUPER_ADMIN',
      });

      // Generate token
      const token = TokenService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Create response
      const response = NextResponse.json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      });

      // Set HTTP-only cookie
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
      });

      return response;
    } catch (createError) {
      // Handle duplicate email error
      if (createError instanceof Error && createError.message.includes('already exists')) {
        return NextResponse.json(
          {
            success: false,
            message: 'User with this email already exists',
          },
          { status: 409 }
        );
      }
      throw createError;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}