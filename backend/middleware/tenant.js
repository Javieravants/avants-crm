/**
 * Middleware multi-tenant — añade req.tenantId a cada request
 * El tenant se obtiene del JWT del usuario (user.tenant_id)
 * Todos los datos actuales tienen tenant_id = 1 (Avants SL)
 */
function tenantMiddleware(req, res, next) {
  // Obtener tenant_id del JWT (ya viene del auth middleware)
  req.tenantId = req.user?.tenant_id || 1;
  next();
}

module.exports = tenantMiddleware;
