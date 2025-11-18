// Vercel Serverless Function - Health Check
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'API Digiautomatiza en Vercel',
    timestamp: new Date().toISOString()
  });
}

