const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'issues.json');

app.use(cors());
app.use(bodyParser.json());

// Initialize issues.json if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// GET /api/issues - Retrieve all issues
app.get('/api/issues', (req, res) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading issues file:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// POST /api/issues - Update the entire issues tree
app.post('/api/issues', (req, res) => {
  try {
    const issues = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(issues, null, 2));
    res.json({ message: 'Issues synchronized successfully' });
  } catch (error) {
    console.error('Error writing issues file:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
