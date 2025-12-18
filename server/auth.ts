import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { sendWelcomeEmail } from "./sendgrid";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

function sanitizeUser(user: SelectUser): Omit<SelectUser, 'password'> {
  const { password, ...safeUser } = user;
  return safeUser;
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "mindfulcoach-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Login accepts email OR username
  passport.use(
    new LocalStrategy(
      { usernameField: "identifier" },
      async (identifier, password, done) => {
        try {
          // Try to find user by email or username
          const user = await storage.getUserByEmailOrUsername(identifier);
          if (!user || !user.password) {
            return done(null, false);
          }
          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, username, name, role } = req.body;

      // Email and password are required
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Validate role (required and permanent)
      if (!role || (role !== "client" && role !== "coach")) {
        return res.status(400).json({ message: "Please select a role (Member or Coach)" });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      // If username provided, check if it's unique
      if (username) {
        const existingUsername = await storage.getUserByUsername(username);
        if (existingUsername) {
          return res.status(400).json({ message: "Username already taken" });
        }
      }

      const user = await storage.createUser({
        email,
        password: await hashPassword(password),
        username: username || undefined,
        name: name || username || email.split('@')[0],
        role: role as "client" | "coach",
      });

      // Send welcome email
      try {
        const displayName = name || username || email.split('@')[0];
        await sendWelcomeEmail(email, displayName, role as "client" | "coach");
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail registration if email fails
      }

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(sanitizeUser(user));
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    // Normalize: accept either "identifier" or legacy "username" field
    if (req.body.username && !req.body.identifier) {
      req.body.identifier = req.body.username;
    }

    passport.authenticate("local", (err: any, user: SelectUser | false) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid email/username or password" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        if (req.body.rememberMe && req.session) {
          req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        }
        res.status(200).json(sanitizeUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.json(null);
    }
    res.json(sanitizeUser(req.user));
  });
}
