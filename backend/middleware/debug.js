// Debug middleware
module.exports = function(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  
  // Track response
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[${new Date().toISOString()}] Response status:`, res.statusCode);
    // If it's an error response, log it
    if (res.statusCode >= 400) {
      console.log('Error response:', body);
    }
    return originalSend.call(this, body);
  };
  
  next();
};
