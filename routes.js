const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { sequelize, User, Product, Cart, CartItem, Order, OrderItem } = require('./models');
const { signToken, hashPassword, comparePassword, authMiddleware } = require('./auth');
const Razorpay = require('razorpay');

// 🛑 ZAROORI: Apni Razorpay keys daalo
const razorpay = new Razorpay({
key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXXXX', // REPLACE THIS with your KEY_ID
key_secret: process.env.RAZORPAY_KEY_SECRET || 'XXXXXXXXXXXXXXXXXXXXXXXXXXXX', // REPLACE THIS with your KEY_SECRET
});

// register
router.post('/auth/register', async (req,res)=>{
try{
const { name, email, password, role } = req.body;
if(!name||!email||!password) return res.status(400).json({ error: 'Missing fields' });
const passwordHash = await hashPassword(password);
const user = await User.create({ name, email, passwordHash, role: role||'customer', approved: role==='seller' ? false : true });
if (user.role === 'customer') await Cart.create({ userId: user.id });
const token = signToken(user);
res.json({ user: { id: user.id, name: user.name, role: user.role, email: user.email }, token });
}catch(err){ console.error(err); res.status(400).json({ error: err.message }); }
});

// login
router.post('/auth/login', async (req,res)=>{
try{
const { email, password } = req.body;
const user = await User.findOne({ where: { email } });
if(!user) return res.status(400).json({ error: 'Invalid credentials' });
const ok = await comparePassword(password, user.passwordHash);
if(!ok) return res.status(400).json({ error: 'Invalid credentials' });
if(user.role==='seller' && !user.approved) return res.status(403).json({ error: 'Seller not approved' });
const token = signToken(user);
res.json({ user: { id: user.id, name: user.name, role: user.role, email: user.email }, token });
}catch(err){ console.error(err); res.status(500).json({ error: err.message }); }
});

// create product (seller)
router.post('/products', authMiddleware(['seller']), async (req,res)=>{
try{
const { title, description, price, stock, imageUrl } = req.body;
const product = await Product.create({ title, description, price, stock, imageUrl, sellerId: req.user.id });
res.json(product);
}catch(err){ res.status(500).json({ error: err.message }); }
});

// public products
router.get('/products', async (req,res)=>{
const q = req.query.q || '';
const items = await Product.findAll({ where: { title: sequelize.where(sequelize.fn('lower', sequelize.col('title')), 'LIKE', `%${q.toLowerCase()}%`) } });
res.json(items);
});

// cart (FIXED: Includes Product model for Cart Page)
router.get('/cart', authMiddleware(['customer']), async (req,res)=>{
const cart = await Cart.findOne({
where: { userId: req.user.id },
include: [{
model: CartItem,
include: [Product]
}]
});
res.json(cart || { CartItems: [] });
});

router.post('/cart/add', authMiddleware(['customer']), async (req,res)=>{
const { productId, qty = 1 } = req.body;
const cart = await Cart.findOne({ where: { userId: req.user.id } });
const prod = await Product.findByPk(productId);
if(!prod) return res.status(404).json({ error: 'Product not found' });
if(prod.stock < qty) return res.status(400).json({ error: 'Insufficient stock' });
let item = await CartItem.findOne({ where: { cartId: cart.id, productId } });
if(item){ item.qty += qty; await item.save(); } else { item = await CartItem.create({ cartId: cart.id, productId, qty, priceAtAdd: prod.price }); }
res.json({ success: true, item });
});

// Helper function to process Order creation and stock update
async function processOrder(customerId, cartItems, t, paymentMethod = 'COD', paymentDetails = {}) {
let total = 0;
for(const ci of cartItems){
if(ci.Product.stock < ci.qty){ throw new Error('Insufficient stock'); }
total += ci.priceAtAdd * ci.qty;
}
const orderNumber = 'SPYRO-' + uuidv4().split('-')[0];

const order = await Order.create({
orderNumber,
customerId: customerId,
total,
status: paymentMethod === 'COD' ? 'pending' : 'paid',
paymentMethod,
...paymentDetails
}, { transaction: t });

for(const ci of cartItems){
await OrderItem.create({
orderId: order.id,
productId: ci.productId,
qty: ci.qty,
price: ci.priceAtAdd,
productTitle: ci.Product.title,
productSnapshot: { title: ci.Product.title, price: ci.Product.price }
}, { transaction: t });
ci.Product.stock -= ci.qty;
await ci.Product.save({ transaction: t });
}

const cart = await Cart.findOne({ where: { userId: customerId } });
await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });

return order;
}

// checkout (COD)
router.post('/checkout-cod', authMiddleware(['customer']), async (req,res)=>{
const t = await sequelize.transaction();
try{
const cart = await Cart.findOne({ where: { userId: req.user.id }, include: [{ model: CartItem, include: [Product] }] });
if(!cart || !cart.CartItems || cart.CartItems.length===0) { await t.rollback(); return res.status(400).json({ error: 'Cart empty' }); }

const order = await processOrder(req.user.id, cart.CartItems, t, 'COD');
await t.commit();
res.json({ success: true, order });
}catch(err){ await t.rollback(); console.error(err); res.status(500).json({ error: err.message }); }
});

// Razorpay Order Creation (Step 1)
router.post('/checkout-razorpay', authMiddleware(['customer']), async (req, res) => {
try {
const cart = await Cart.findOne({ where: { userId: req.user.id }, include: [{ model: CartItem, include: [Product] }] });
if(!cart || !cart.CartItems || cart.CartItems.length===0) return res.status(400).json({ error: 'Cart empty' });

let amount = 0;
for(const ci of cart.CartItems){ amount += ci.priceAtAdd * ci.qty; }

const options = {
amount: Math.round(amount * 100),
currency: 'INR',
receipt: 'receipt#' + uuidv4().split('-')[0],
};
const rzpOrder = await razorpay.orders.create(options);

res.json({ rzpOrder, amount: options.amount / 100 });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'Razorpay order creation failed' });
}
});

// Razorpay Payment Success (Step 2)
router.post('/checkout-success', authMiddleware(['customer']), async (req, res) => {
const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

if (!razorpay_payment_id) return res.status(400).json({ error: 'Payment failed' });

const t = await sequelize.transaction();
try {
const cart = await Cart.findOne({ where: { userId: req.user.id }, include: [{ model: CartItem, include: [Product] }] });
if(!cart || !cart.CartItems || cart.CartItems.length===0) { await t.rollback(); return res.status(400).json({ error: 'Cart empty' }); }

const order = await processOrder(req.user.id, cart.CartItems, t, 'Razorpay', {
rzpOrderId: razorpay_order_id,
rzpPaymentId: razorpay_payment_id
});

await t.commit();
res.json({ success: true, order });
} catch (err) {
await t.rollback();
console.error(err);
res.status(500).json({ error: err.message });
}
});

// Customer Orders History
router.get('/orders', authMiddleware(['customer']), async (req,res)=>{
const orders = await Order.findAll({
where: { customerId: req.user.id },
include: [{ model: OrderItem }],
order: [['createdAt', 'DESC']]
});
res.json(orders);
});

// Seller Orders History (Items only relevant to the seller)
router.get('/seller/orders', authMiddleware(['seller']), async (req,res)=>{
const sellerProducts = await Product.findAll({
where: { sellerId: req.user.id },
attributes: ['id']
});
const productIds = sellerProducts.map(p => p.id);

const sellerOrderItems = await OrderItem.findAll({
where: { productId: productIds },
include: [{
model: Order,
attributes: ['id', 'orderNumber', 'total', 'status', 'createdAt', 'paymentMethod'],
include: [{ model: User, as: 'customer', attributes: ['name', 'email'] }]
}],
order: [[Order, 'createdAt', 'DESC']]
});

const ordersMap = new Map();
sellerOrderItems.forEach(item => {
const orderId = item.Order.id;
if (!ordersMap.has(orderId)) {
ordersMap.set(orderId, {
...item.Order.toJSON(),
OrderItems: []
});
}
ordersMap.get(orderId).OrderItems.push(item);
});

res.json(Array.from(ordersMap.values()));
});

module.exports = router;