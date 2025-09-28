import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function OrdersPage() {
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);
const user = JSON.parse(localStorage.getItem('spyro_user') || '{}');
const token = localStorage.getItem('spyro_token');
const navigate = useNavigate();

const endpoint = user.role === 'seller' ? API_URL + '/seller/orders' : API_URL + '/orders';
const title = user.role === 'seller' ? 'My Sales Orders' : 'My Purchase History';
const isSeller = user.role === 'seller';

useEffect(() => {
if (!token) {
navigate('/login');
return;
}

async function fetchOrders() {
try {
const res = await axios.get(endpoint, {
headers: { Authorization: `Bearer ${token}` }
});
setOrders(res.data);
} catch (err) {
alert('Failed to fetch orders: ' + (err.response?.data?.error || err.message));
} finally {
setLoading(false);
}
}

fetchOrders();
}, [token, navigate, endpoint]);

if (loading) return <div className="text-center p-8">Loading Orders...</div>;

if (orders.length === 0) return <div className="text-center p-8 text-gray-500">No orders found.</div>;

return (
<div>
<h2 className="text-2xl font-bold mb-6">{title}</h2>

<div className="space-y-6">
{orders.map(order => (
<div key={order.id} className="border p-4 rounded-lg shadow-md bg-white">
<div className="flex justify-between items-center border-b pb-2 mb-3">
<div>
<h3 className="text-xl font-semibold text-blue-600">{order.orderNumber}</h3>
<p className="text-sm text-gray-500">
Placed on: {new Date(order.createdAt).toLocaleDateString()}
</p>
</div>
<div className={`px-3 py-1 text-sm font-bold rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
Status: {order.status.toUpperCase()}
</div>
</div>

{isSeller && (
<div className="mb-3 p-2 bg-gray-50 rounded">
<p className="text-sm font-medium">Customer: {order.customer?.name} ({order.customer?.email})</p>
</div>
)}

<p className="font-semibold mb-2">Total Amount: ₹{order.total.toFixed(2)} ({order.paymentMethod})</p>

<ul className="space-y-2">
{order.OrderItems.map(item => (
<li key={item.id} className="text-sm flex justify-between border-l-4 border-gray-300 pl-2">
<span className="font-medium">{item.productTitle}</span>
<span className="text-gray-600">Qty: {item.qty} @ ₹{item.price}</span>
</li>
))}
</ul>
</div>
))}
</div>
</div>
);
}