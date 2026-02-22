import express from "express";

const app = express();

// Static WHO-aligned disease data
const DISEASES = [
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

const HEALTH_TIPS = [
  "Drink at least 8 glasses of water daily to stay hydrated.",
  "Wash your hands with soap for at least 20 seconds before eating.",
  "Include seasonal fruits and vegetables in your diet for better immunity.",
  "Get at least 7-8 hours of sleep to help your body recover and stay healthy.",
  "Exercise for at least 30 minutes a day to improve cardiovascular health."
];

app.use(express.json());

app.get("/api/diseases", (req, res) => {
  res.json(DISEASES);
});

app.get("/api/diseases/:name", (req, res) => {
  const name = req.params.name.toLowerCase();
  const data = DISEASES.find(d => d.name.toLowerCase().includes(name));
  if (data) res.json(data);
  else res.status(404).json({ error: "Disease not found" });
});

app.get("/api/health-tips", (req, res) => {
  const tip = HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)];
  res.json({ tip });
});

export default app;
