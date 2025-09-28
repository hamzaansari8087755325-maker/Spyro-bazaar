import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import CartPage from './pages/Cart'
import SellerDashboard from './pages/SellerDashboard'
import OrdersPage from './pages/OrdersPage'

function App(){
const user = JSON.parse(localStorage.getItem('spyro_user') || '{}');
const token = localStorage.getItem('spyro_token');

function handleLogout() {
localStorage.removeItem('spyro_token');
localStorage.removeItem('spyro_user');
window.location.href = '/';
}

return (
<BrowserRouter>
<div className="max-w-4xl mx-auto p-4">
<header className="flex justify-between items-center mb-6 border-b pb-4">
<Link to="/" className="text-3xl font-extrabold text-blue-600">SPYRO BAZAAR</Link>
<nav className="space-x-4 flex items-center">

{user.role === 'seller' && <Link to="/seller" className="text-sm font-medium hover:text-blue-600">Seller Dashboard</Link>}

{token && <Link to="/orders" className="text-sm font-medium hover:text-blue-600">My Orders</Link>}

<Link to="/cart" className="text-sm font-medium hover:text-blue-600">Cart</Link>

{!token ? (
<>
<Link to="/login" className="text-sm font-medium hover:text-blue-600">Login</Link>
<Link to="/register" className="text-sm font-medium bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Register</Link>
</>
) : (
<button onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-700">Logout ({user.name})</button>
)}

</nav>
</header>
<Routes>
<Route path="/" element={<Home/>} />
<Route path="/login" element={<Login/>} />
<Route path="/register" element={<Register/>} />
<Route path="/cart" element={<CartPage/>} />
<Route path="/seller" element={<SellerDashboard />} />
<Route path="/orders" element={<OrdersPage />} />
</Routes>
</div>
</BrowserRouter>
)
}

createRoot(document.getElementById('root')).render(<App />)import React, { useEffect, useState } from 'react'
import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL;

export default function Home(){
const [items, setItems] = useState([])
const [q, setQ] = useState('')
useEffect(()=>{ fetchItems(); }, [])
async function fetchItems(){
const res = await axios.get(API_URL + '/products')
setItems(res.data)
}

async function handleSearch() {
const res = await axios.get(API_URL + '/products?q=' + q)
setItems(res.data)
}

return (
<div>
<div className="mb-4 flex">
<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search" className="border p-2 flex-1" />
<button onClick={handleSearch} className="ml-2 px-4 py-2 bg-blue-600 text-white">Search</button>
</div>
<div className="grid grid-cols-3 gap-4">
{items.map(it=> (
<div key={it.id} className="border p-3 rounded">
<img src={it.imageUrl || 'https://via.placeholder.com/150'} alt="" className="mb-2 w-full h-32 object-cover"/>
<h3 className="font-semibold">{it.title}</h3>
<p className="text-sm">₹ {it.price}</p>
<AddToCartBtn product={it} />
</div>
))}
</div>
</div>
)
}

function AddToCartBtn({ product }){
const token = localStorage.getItem('spyro_token')
const API_URL = import.meta.env.VITE_API_URL;
async function add(){
if(!token){ alert('Please login as customer to add to cart'); return }
try{
await axios.post(API_URL + '/cart/add', { productId: product.id, qty: 1 }, { headers: { Authorization: 'Bearer '+token } });
alert('Added to cart')
}catch(e){
alert(e.response?.data?.error || 'Error adding to cart')
}
}
return <button onClick={add} className="mt-2 bg-green-500 text-white px-3 py-1 rounded">Add</button>
}