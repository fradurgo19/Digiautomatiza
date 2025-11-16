// Vercel Serverless Function - Health Check
module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API Digiautomatiza en Vercel',
    timestamp: new Date().toISOString()
  });
};

