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

createRoot(document.getElementById('root')).render(<App />)