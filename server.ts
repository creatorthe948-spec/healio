import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const db = new Database("healio.db");

  // Initialize Database with WHO-based disease info
  db.exec(`
    CREATE TABLE IF NOT EXISTS diseases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      description TEXT,
      causes TEXT,
      symptoms TEXT,
      precautions TEXT,
      home_care TEXT,
      when_to_consult TEXT,
      emergency_signs TEXT
    );

    CREATE TABLE IF NOT EXISTS health_tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tip TEXT
    );
  `);

  // Seed data (WHO-aligned)
  const diseases = [
    {
      name: "Fever",
      description: "A temporary increase in your body temperature, often due to an illness.",
      causes: "Infections (viral or bacterial), heat exhaustion, certain inflammatory conditions.",
      symptoms: "Sweating, chills, headache, muscle aches, loss of appetite, dehydration, general weakness.",
      precautions: "Drink plenty of fluids, rest, stay in a cool environment.",
      home_care: "Use light clothing, lukewarm sponge baths, stay hydrated with water or ORS.",
      when_to_consult: "If fever exceeds 103°F (39.4°C) or lasts more than 3 days.",
      emergency_signs: "Severe headache, stiff neck, skin rash, mental confusion, persistent vomiting."
    },
    {
      name: "Dengue",
      description: "A mosquito-borne viral infection common in tropical climates.",
      causes: "Dengue virus transmitted by Aedes aegypti mosquitoes.",
      symptoms: "High fever, severe headache, pain behind eyes, muscle/joint pains, nausea, rash.",
      precautions: "Prevent mosquito bites using nets/repellents, remove standing water around home.",
      home_care: "Rest, drink plenty of fluids (water, juice, soup), avoid aspirin/ibuprofen (use paracetamol only if advised).",
      when_to_consult: "Immediately if you live in a dengue-prone area and develop high fever.",
      emergency_signs: "Severe abdominal pain, persistent vomiting, bleeding gums, rapid breathing, fatigue/restlessness."
    },
    {
      name: "COVID-19",
      description: "An infectious disease caused by the SARS-CoV-2 virus.",
      causes: "SARS-CoV-2 virus spread through respiratory droplets.",
      symptoms: "Fever, cough, tiredness, loss of taste or smell, sore throat, headache.",
      precautions: "Wear masks in crowded places, maintain social distance, wash hands frequently, get vaccinated.",
      home_care: "Isolate in a well-ventilated room, monitor oxygen levels, stay hydrated, rest.",
      when_to_consult: "If symptoms worsen or persist beyond a week.",
      emergency_signs: "Difficulty breathing, chest pain, confusion, inability to wake or stay awake, pale/blue skin."
    }
  ];

  const insertDisease = db.prepare(`
    INSERT OR IGNORE INTO diseases (name, description, causes, symptoms, precautions, home_care, when_to_consult, emergency_signs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  diseases.forEach(d => {
    insertDisease.run(d.name, d.description, d.causes, d.symptoms, d.precautions, d.home_care, d.when_to_consult, d.emergency_signs);
  });

  const tips = [
    "Drink at least 8 glasses of water daily to stay hydrated.",
    "Wash your hands with soap for at least 20 seconds before eating.",
    "Include seasonal fruits and vegetables in your diet for better immunity.",
    "Get at least 7-8 hours of sleep to help your body recover and stay healthy.",
    "Exercise for at least 30 minutes a day to improve cardiovascular health."
  ];

  const insertTip = db.prepare("INSERT OR IGNORE INTO health_tips (tip) VALUES (?)");
  tips.forEach(t => insertTip.run(t));

  app.use(express.json());

  // API Routes
  app.get("/api/diseases", (req, res) => {
    const data = db.prepare("SELECT * FROM diseases").all();
    res.json(data);
  });

  app.get("/api/diseases/:name", (req, res) => {
    const data = db.prepare("SELECT * FROM diseases WHERE name LIKE ?").get(`%${req.params.name}%`);
    if (data) res.json(data);
    else res.status(404).json({ error: "Disease not found in local database" });
  });

  app.get("/api/health-tips", (req, res) => {
    const tip = db.prepare("SELECT tip FROM health_tips ORDER BY RANDOM() LIMIT 1").get();
    res.json(tip);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
