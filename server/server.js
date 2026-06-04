const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'issues.json');
const NOTES_FILE = path.join(__dirname, 'notes.txt');

app.use(cors());
app.use(bodyParser.json());

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Initialize files if they don't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(NOTES_FILE)) {
  fs.writeFileSync(NOTES_FILE, '');
}

// GET /api/issues - Retrieve all issues
app.get('/api/issues', (req, res) => {
  try {
    console.log('Reading issues database...');
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    console.log(`Issues read successfully. Active tabs: ${parsed.tabs?.length || 0}, Trash count: ${parsed.trash?.length || 0}`);
    res.json(parsed);
  } catch (error) {
    console.error('Error reading issues file:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// POST /api/issues - Update the entire issues tree
app.post('/api/issues', (req, res) => {
  try {
    const issues = req.body;
    console.log(`Synchronizing issues database. Incoming tabs count: ${issues.tabs?.length || 0}, Workspace items: ${issues.workspaceIds?.length || 0}`);
    fs.writeFileSync(DATA_FILE, JSON.stringify(issues, null, 2));
    console.log('Issues synchronized successfully and written to disk.');
    res.json({ message: 'Issues synchronized successfully' });
  } catch (error) {
    console.error('Error writing issues file:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// GET /api/notes - Retrieve notes
app.get('/api/notes', (req, res) => {
  try {
    console.log('Reading notes file...');
    const data = fs.readFileSync(NOTES_FILE, 'utf8');
    console.log(`Notes read successfully. Content length: ${data.length} characters.`);
    res.json({ content: data });
  } catch (error) {
    console.error('Error reading notes file:', error);
    res.status(500).json({ error: 'Failed to read notes' });
  }
});

// POST /api/notes - Update notes
app.post('/api/notes', (req, res) => {
  try {
    const { content } = req.body;
    const length = content ? content.length : 0;
    console.log(`Synchronizing notes. Content length: ${length} characters.`);
    fs.writeFileSync(NOTES_FILE, content || '');
    console.log('Notes synchronized successfully and written to disk.');
    res.json({ message: 'Notes synchronized successfully' });
  } catch (error) {
    console.error('Error writing notes file:', error);
    res.status(500).json({ error: 'Failed to save notes' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
