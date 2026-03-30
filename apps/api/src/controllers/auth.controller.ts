import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { readUsers, writeUsers } from "../db/db.js";
import type { User } from "../db/schema.js";
import { createError } from "../middleware/error.middleware.js";

const SALT_ROUNDS = 10;

function getSecret(): string {
  return process.env.JWT_SECRET || "streamlocal-dev-secret";
}

function generateToken(user: User): string {
  return jwt.sign(
    { userId: user.id, email: user.email },
    getSecret(),
    { expiresIn: "7d" }
  );
}

function sanitizeUser(user: User): Omit<User, "passwordHash"> {
  const { passwordHash, ...rest } = user;
  return rest;
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      throw createError(400, "Username, email, and password are required");
    }

    if (password.length < 6) {
      throw createError(400, "Password must be at least 6 characters");
    }

    const users = readUsers();

    if (users.find((u) => u.email === email)) {
      throw createError(409, "Email already registered");
    }

    if (users.find((u) => u.username === username)) {
      throw createError(409, "Username already taken");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser: User = {
      id: uuidv4(),
      username,
      email,
      passwordHash,
      avatarUrl: "",
      bio: "",
      plan: "free",
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    const token = generateToken(newUser);

    res.status(201).json({
      user: sanitizeUser(newUser),
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError(400, "Email and password are required");
    }

    const users = readUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      throw createError(401, "Invalid email or password");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw createError(401, "Invalid email or password");
    }

    const token = generateToken(user);

    res.json({
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    next(err);
  }
}

export function logout(
  _req: Request,
  res: Response
): void {
  res.json({ message: "Logged out successfully" });
}

export function me(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw createError(401, "Authentication required");
    }

    const users = readUsers();
    const user = users.find((u) => u.id === req.user!.userId);

    if (!user) {
      throw createError(404, "User not found");
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}
