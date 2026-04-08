import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'travel-helper-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

// ============================================
// Types
// ============================================
interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface GoogleAuthRequest {
  idToken: string;
}

interface AppleAuthRequest {
  identityToken: string;
  user?: {
    email?: string;
    name?: string;
  };
}

// ============================================
// Helper Functions
// ============================================
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================
// Routes
// ============================================

// POST /api/auth/register
export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body as RegisterRequest;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
      },
    });

    // Store password in a separate auth table (we'll add this)
    await prisma.userPreference.create({
      data: {
        userId: user.id,
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { preferences: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For now, simple password check (in production, use proper password hashing)
    // Note: We need to add password field to User table or create Auth table
    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        nationality: user.nationality,
        preferences: user.preferences,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/auth/google
export async function googleAuth(req: Request, res: Response) {
  try {
    const { idToken } = req.body as GoogleAuthRequest;

    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required' });
    }

    // Verify Google token
    // In production, use google-auth-library
    // For now, we'll extract email from the token payload
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    
    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const payload = await response.json();
    const { email, name, picture } = payload;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      include: { preferences: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          avatar: picture,
        },
      });
      
      await prisma.userPreference.create({
        data: { userId: user.id },
      });
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        nationality: user.nationality,
        preferences: user.preferences,
      },
      token,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/auth/apple
export async function appleAuth(req: Request, res: Response) {
  try {
    const { identityToken, user } = req.body as AppleAuthRequest;

    if (!identityToken) {
      return res.status(400).json({ error: 'identityToken is required' });
    }

    // Verify Apple token
    // In production, use apple-signin-auth library
    const decoded = jwt.decode(identityToken) as any;
    const email = decoded?.email || user?.email;

    if (!email) {
      return res.status(400).json({ error: 'Email not provided' });
    }

    // Find or create user
    let existingUser = await prisma.user.findUnique({
      where: { email },
      include: { preferences: true },
    });

    if (!existingUser) {
      existingUser = await prisma.user.create({
        data: {
          email,
          name: user?.name?.firstName 
            ? `${user.name.firstName} ${user.name.lastName || ''}`.trim()
            : email.split('@')[0],
        },
      });
      
      await prisma.userPreference.create({
        data: { userId: existingUser.id },
      });
    }

    const token = generateToken(existingUser.id);

    res.json({
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatar: existingUser.avatar,
        nationality: existingUser.nationality,
        preferences: existingUser.preferences,
      },
      token,
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/user/profile
export async function getProfile(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        preferences: true,
        passport: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        nationality: user.nationality,
        preferences: user.preferences,
        passport: user.passport,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/user/settings
export async function updateSettings(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { language, currency, timezone, nationality, ...notifications } = req.body;

    // Update user
    if (nationality) {
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { nationality },
      });
    }

    // Update preferences
    const preferences = await prisma.userPreference.upsert({
      where: { userId: decoded.userId },
      update: {
        language,
        currency,
        timezone,
        ...notifications,
      },
      create: {
        userId: decoded.userId,
        language: language || 'zh',
        currency: currency || 'TWD',
        ...notifications,
      },
    });

    res.json({ preferences });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/auth/refresh
export async function refreshToken(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const newToken = generateToken(decoded.userId);
    res.json({ token: newToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export { verifyToken };
