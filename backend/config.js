module.exports = {
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/project-manager',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || 'user@example.com',
    password: process.env.EMAIL_PASSWORD || 'password'
  }
};
