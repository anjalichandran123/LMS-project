import express from "express";
import cors from "cors";
import { Connection } from "./postgres/postgres.js";
import router from "./routes/userRoute.js";
import dotenv from 'dotenv';
import adminrouter from "./routes/adminRoute.js";
import superAdminRouter from "./routes/superadminRoute.js";
import { Sequelize } from "sequelize";
import studentRouter from "./routes/studentRoute.js";
import teacherrouter from "./routes/teacherRoute.js";
import cookieParser from "cookie-parser";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pkg from 'pg';  // Import the entire 'pg' package
const { Pool } = pkg;  // Destructure Pool from the package

dotenv.config();
const app = express();
const PORT = 8000;



const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,  
  dialect: 'postgres',
  port: process.env.DB_PORT
  });


// Create a PostgreSQL pool
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT || 5432,
});

// Set up session store with PostgreSQL
const PgSession = pgSession(session);

app.use(
  session({
    store: new PgSession({
      pool: pool, // Use PostgreSQL pool for session storage
      tableName: 'sessions', // Table to store sessions
    }),
    secret: process.env.SESSION_SECRET || 'your_secret_key', // Session secret key
    resave: false, // Don't resave session if not modified
    saveUninitialized: false, // Don't save uninitialized sessions
    cookie: {
      secure: false, // Set to true if using https
      maxAge: 1000 * 60 * 60, // Session expiration time (1 hour)
    },
  })
); 

// Middleware
app.use(cors());
app.use(express.json());
app.set("sequelize", sequelize);
app.use(cookieParser());

// Routes
app.use("/api", router);
app.use("/api/admin", adminrouter);
app.use("/api/superadmin", superAdminRouter);
app.use("/api/student", studentRouter);
app.use("/api/teacher", teacherrouter);

// Sample route to demonstrate session usage
app.get('/current-page', (req, res) => {
  // Example: Store the current page in the session
  if (req.session) {
    req.session.currentPage = req.originalUrl; // Store current page URL
  }
  res.send("Current page stored in session.");
});

// Route to continue from the last page the user visited
app.get('/continue', (req, res) => {
  const lastPage = req.session.currentPage || '/'; // Default to '/' if no page is stored
  res.redirect(lastPage);
});

const startServer = async () => {
  try {
    await Connection(); // Establish database connection
    app.listen(PORT, () => {
      console.log(`The server is running at PORT ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
};

startServer();
