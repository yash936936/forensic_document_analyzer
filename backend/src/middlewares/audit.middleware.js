exports.auditMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const agent = req.user ? req.user.badgeId : 'UNAUTHORIZED';
  console.log(`[AUDIT] ${timestamp} | AGENT: ${agent} | ACTION: ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
  next();
};
