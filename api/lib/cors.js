// Helper para configurar CORS de manera consistente
export function setCORSHeaders(req, res) {
  // Orígenes permitidos
  const allowedOrigins = [
    'https://www.digiautomatiza.co',
    'https://digiautomatiza.co',
    'https://digiautomatiza.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  // Obtener el origen de la petición
  const origin = req.headers.origin || 
                 req.headers.referer?.split('/').slice(0, 3).join('/') || 
                 '';
  
  // Determinar el origen permitido
  let allowedOrigin = allowedOrigins[0]; // Por defecto el primero
  if (origin) {
    // Buscar coincidencia exacta
    const matched = allowedOrigins.find(o => o === origin);
    if (matched) {
      allowedOrigin = matched;
    }
  }
  
  // Configurar headers CORS - SIEMPRE establecer todos los headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-usuario-id, x-usuario-rol'
  );
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas
  
  return allowedOrigin;
}

