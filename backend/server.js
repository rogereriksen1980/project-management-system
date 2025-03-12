const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const debug = require('./middleware/debug'); // Add this line
const path = require('path');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const memberRoutes = require('./routes/memberRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const taskRoutes = require('./routes/taskRoutes');
const reportRoutes = require('./routes/reportRoutes');
const app = express();

// Debug middleware
app.use(debug); // Add this line

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/tasks', taskRoutes);


try {
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/meetings', meetingRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/reports', reportRoutes);
} catch (err) {
  console.error('Error setting up routes:', err.message);
}
// Add error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Server error', 
    error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message 
  });
});


// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve from multiple possible locations
  const fs = require('fs');
  
  // Try serving from backend/public first (our copied build files)
  if (fs.existsSync(path.join(__dirname, 'public', 'index.html'))) {
    console.log('Serving static files from backend/public');
    app.use(express.static(path.join(__dirname, 'public')));
  } 
  // Then try frontend/build
  else if (fs.existsSync(path.join(__dirname, '../frontend/build', 'index.html'))) {
    console.log('Serving static files from frontend/build');
    app.use(express.static(path.join(__dirname, '../frontend/build')));
  }
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    if (fs.existsSync(path.join(__dirname, 'public', 'index.html'))) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else if (fs.existsSync(path.join(__dirname, '../frontend/build', 'index.html'))) {
      res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    } else {
      res.status(404).send('No frontend build found');
    }
  });
}

// Connect to MongoDB
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB Connected');
  
  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
