const crypto = require('crypto');

/**
 * Verify an HMAC-SHA256 webhook signature.
 * Accepts both plain hex and "sha256=<hex>" formats.
 * Returns false (never throws) on malformed input.
 */
function verifySignature(rawBody, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const incoming = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  if (incoming.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(incoming, 'hex'));
  } catch {
    return false;
  }
}

module.exports = { verifySignature };
