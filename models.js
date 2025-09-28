const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: './spyro.sqlite' });

const User = sequelize.define('User', {
name: { type: DataTypes.STRING, allowNull: false },
email: { type: DataTypes.STRING, unique: true, allowNull: false },
passwordHash: { type: DataTypes.STRING, allowNull: false },
role: { type: DataTypes.ENUM('customer','seller','admin'), defaultValue: 'customer' },
approved: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const Product = sequelize.define('Product', {
title: { type: DataTypes.STRING, allowNull: false },
description: { type: DataTypes.TEXT },
price: { type: DataTypes.FLOAT, allowNull: false },
stock: { type: DataTypes.INTEGER, defaultValue: 0 },
imageUrl: { type: DataTypes.STRING }
});

const Cart = sequelize.define('Cart', {});
const CartItem = sequelize.define('CartItem', { qty: { type: DataTypes.INTEGER, defaultValue: 1 }, priceAtAdd: { type: DataTypes.FLOAT } });

const Order = sequelize.define('Order', { orderNumber: { type: DataTypes.STRING, unique: true }, total: { type: DataTypes.FLOAT }, status: { type: DataTypes.ENUM('pending','paid','shipped','delivered','cancelled'), defaultValue: 'pending' }, paymentMethod: { type: DataTypes.STRING } });
const OrderItem = sequelize.define('OrderItem', { qty: DataTypes.INTEGER, price: DataTypes.FLOAT, productTitle: DataTypes.STRING, productSnapshot: DataTypes.JSON });

// relations
User.hasOne(Cart, { foreignKey: 'userId' }); Cart.belongsTo(User, { foreignKey: 'userId' });
Cart.hasMany(CartItem, { foreignKey: 'cartId' }); CartItem.belongsTo(Cart, { foreignKey: 'cartId' });

User.hasMany(Product, { foreignKey: 'sellerId' }); Product.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });

User.hasMany(Order, { foreignKey: 'customerId' }); Order.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
Order.hasMany(OrderItem, { foreignKey: 'orderId' }); OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
Product.hasMany(OrderItem, { foreignKey: 'productId' }); OrderItem.belongsTo(Product, { foreignKey: 'productId' });

Order.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });

module.exports = { sequelize, User, Product, Cart, CartItem, Order, OrderItem };