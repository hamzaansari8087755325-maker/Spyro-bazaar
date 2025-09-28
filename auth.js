const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SECRET = process.env.JWT_SECRET || 'spyro_secret_change_this';

function signToken(user) { return jwt.sign({ id: user.id, role: user.role, email: user.email }, SECRET, { expiresIn: '7d' }); }
async function hashPassword(plain) { return await bcrypt.hash(plain, 10); }
async function comparePassword(plain, hash) { return await bcrypt.compare(plain, hash); }

function authMiddleware(requiredRoles = []) {
return (req, res, next) => {
const auth = req.headers.authorization;
if (!auth) return res.status(401).json({ error: 'No token' });
const token = auth.split(' ')[1];
try {
const payload = jwt.verify(token, SECRET);
if (requiredRoles.length && !requiredRoles.includes(payload.role)) return res.status(403).json({ error: 'Forbidden' });
req.user = payload; next();
} catch (err) { return res.status(401).json({ error: 'Invalid token' }); }
}
}

module.exports = { signToken, hashPassword, comparePassword, authMiddleware };