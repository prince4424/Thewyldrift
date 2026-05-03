const recentRequests = new Map();
const ttlMs = 30_000;

function preventDuplicateSubmissions(req, res, next) {
  if (!["POST", "PUT", "DELETE"].includes(req.method)) {
    return next();
  }

  const key = req.get("Idempotency-Key");

  if (!key) {
    return next();
  }

  const now = Date.now();
  const existing = recentRequests.get(key);

  if (existing && now - existing < ttlMs) {
    return res.status(409).json({ success: false, message: "Duplicate submission ignored" });
  }

  recentRequests.set(key, now);

  for (const [storedKey, storedAt] of recentRequests.entries()) {
    if (now - storedAt > ttlMs) {
      recentRequests.delete(storedKey);
    }
  }

  return next();
}

module.exports = preventDuplicateSubmissions;
