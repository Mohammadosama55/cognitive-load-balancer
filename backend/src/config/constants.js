const config = {
  development: {
    db: process.env.MONGO_URI || 'mongodb://admin:admin123@localhost:27017/cognitive-load?authSource=admin',
    flaskServiceUrl: process.env.FLASK_SERVICE_URL || 'http://localhost:5001',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    jwtExpire: '7d',
    nodeEnv: 'development'
  },
  production: {
    db: process.env.MONGO_URI,
    flaskServiceUrl: process.env.FLASK_SERVICE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: '30d',
    nodeEnv: 'production'
  }
};

module.exports = config[process.env.NODE_ENV || 'development'];
