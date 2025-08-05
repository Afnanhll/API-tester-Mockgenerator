const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Utility functions
const randomId = () => Math.floor(1000 + Math.random() * 9000);
const randomSimId = () => "SIM-" + Math.floor(100000 + Math.random() * 900000);
const randomName = () => {
  const names = ["Fatma", "Ali", "Salim", "Aisha", "Huda", "Mohammed"];
  const surnames = ["Al-Maskari", "Al-Busaidi", "Al-Harthy", "Al-Lawati"];
  return `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
};
const randomEmail = (name) => `${name.toLowerCase().replace(" ", ".")}@omantel.om`;
const randomPhone = () => `+9689${Math.floor(1000000 + Math.random() * 9000000)}`;
const randomDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * 14 + 1));
  return date.toISOString().split('T')[0];
};

// ✅ 1. SIM Info (Dynamic)
app.get('/api/sim-info', (req, res) => {
  res.json({
    simId: randomSimId(),
    status: "Activated",
    activatedAt: new Date().toISOString()
  });
});

// ✅ 2. Registration (Dynamic)
app.post('/api/register', (req, res) => {
  const name = req.body.name || randomName();
  const email = req.body.email || randomEmail(name);
  const phone = req.body.phone || randomPhone();

  res.json({
    message: "User registered successfully",
    user: {
      id: "OMT" + randomId(),
      name,
      email,
      phone
    }
  });
});

// ✅ 3. Billing Info (Dynamic)
app.get('/api/billing', (req, res) => {
  res.json({
    accountNumber: "OM-BILL-" + randomId(),
    billingMonth: "August 2025",
    amountDue: (5 + Math.random() * 20).toFixed(3) + " OMR",
    dueDate: randomDueDate()
  });
});

// ✅ AI-generated Mock API (Dynamic based on description)
app.get('/api/generate-mock', (req, res) => {
  res.json({
    message: "Generic Omantel Mock Response",
    timestamp: new Date().toISOString()
  });
});

app.post('/api/generate-mock', (req, res) => {
  const description = req.body.description?.toLowerCase() || '';
  let mock;

  // ✅ Extract name from description (e.g., "Huda", "Salim Al-Maskari")
  const nameMatch = req.body.description?.match(/for\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const extractedName = nameMatch ? nameMatch[1] : randomName();
  const email = randomEmail(extractedName);
  const phone = randomPhone();

  // ✅ Match keywords flexibly using regex
  if (/create.*(user|account)|register.*(user|account)/i.test(description)) {
    mock = {
      userId: "omantel" + randomId(),
      name: extractedName,
      email,
      phone,
      registeredAt: new Date().toISOString()
    };
  } else if (/sim.*(activation|info|status)/i.test(description)) {
    mock = {
      simId: "SIM" + randomId(),
      status: "Activated",
      activatedAt: new Date().toISOString()
    };
  } else if (/billing.*(info|details|amount|due)/i.test(description)) {
    mock = {
      accountNumber: "ACC-" + randomId(),
      amountDue: (8 + Math.random() * 5).toFixed(3) + " OMR",
      dueDate: randomDueDate(),
      billingMonth: "August 2025"
    };
  } else if (/complaint|issue|problem|report/i.test(description)) {
    mock = {
      complaintId: "CMP" + randomId(),
      status: "Open",
      message: "Thank you. Your issue has been logged. We'll get back to you."
    };
  } else {
    // ✅ Fallback: still use extracted name if available
    mock = {
      message: `Hello${nameMatch ? `, ${extractedName}` : ""}. This is a generic mock response.`,
      timestamp: new Date().toISOString()
    };
  }

  res.json(mock);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
