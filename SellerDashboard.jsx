import React, { useState } from 'react';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export default function SellerDashboard() {
const user = JSON.parse(localStorage.getItem('spyro_user') || '{}');
const token = localStorage.getItem('spyro_token');
const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
const [price, setPrice] = useState('');
const [stock, setStock] = useState('');
const [imageUrl, setImageUrl] = useState('');

if (user.role !== 'seller') {
return <div className="text-red-500">Access Denied. Only Sellers can view this page.</div>;
}

async function handleSubmit(e) {
e.preventDefault();
if (!token) return alert('Please login again.');

try {
const productData = { title, description, price: parseFloat(price), stock: parseInt(stock), imageUrl };

await axios.post(API_URL + '/products', productData, {
headers: { Authorization: 'Bearer ' + token }
});

alert('Product created successfully! Check home page to see it.');
setTitle(''); setDescription(''); setPrice(''); setStock(''); setImageUrl('');
} catch (err) {
alert('Error creating product: ' + (err.response?.data?.error || err.message));
}
}

return (
<div className="max-w-lg mx-auto">
<h2 className="text-2xl font-bold mb-6">Seller Dashboard: Add New Product</h2>

<form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg shadow-md">
<input
value={title} onChange={e => setTitle(e.target.value)}
placeholder="Product Title" required
className="w-full p-2 border rounded"
/>
<textarea
value={description} onChange={e => setDescription(e.target.value)}
placeholder="Description" required
className="w-full p-2 border rounded h-24"
/>
<div className="flex space-x-4">
<input
value={price} onChange={e => setPrice(e.target.value)}
placeholder="Price (₹)" type="number" step="0.01" required
className="w-1/2 p-2 border rounded"
/>
<input
value={stock} onChange={e => setStock(e.target.value)}
placeholder="Stock Quantity" type="number" required
className="w-1/2 p-2 border rounded"
/>
</div>
<input
value={imageUrl} onChange={e => setImageUrl(e.target.value)}
placeholder="Image URL (Placeholder for now)"
className="w-full p-2 border rounded"
/>
<button
type="submit"
className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-300"
>
Add Product to SPYRO BAZAAR
</button>
</form>

<p className="mt-4 text-sm text-gray-500">Note: Full product management (editing/deleting) will be added later.</p>
</div>
);
}