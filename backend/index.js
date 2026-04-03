const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Dummy login route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const dummyUser = {
    email: 'test@example.com',
    password: '123456'
  };

  // Match credentials
  if (email === dummyUser.email && password === dummyUser.password) {
    return res.json({
      success: true,
      message: 'Login successful',
      token: 'fake-jwt-token'
    });
  }

  // Invalid credentials
  return res.status(401).json({
    success: false,
    message: 'Invalid email or password'
  });
});

// Optional: test root route
app.get('/', (req, res) => {
  res.send('Backend is running ✅');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
