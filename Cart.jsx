import React, { useEffect, useState } from 'react'
import axios from 'axios'

function loadRazorpayScript(src) {
return new Promise((resolve) => {
const script = document.createElement('script');
script.src = src;
script.onload = () => resolve(true);
script.onerror = () => resolve(false);
document.body.appendChild(script);
});
}
const API_URL = import.meta.env.VITE_API_URL;

export default function CartPage(){
const [cart, setCart] = useState(null)
const [loading, setLoading] = useState(false)
const token = localStorage.getItem('spyro_token')
const user = JSON.parse(localStorage.getItem('spyro_user') || '{}');

useEffect(()=>{ fetchCart() }, [])

async function fetchCart(){
if(!token) return;
setLoading(true);
try {
const res = await axios.get(API_URL + '/cart', { headers: { Authorization: 'Bearer '+token } });
setCart(res.data);
} catch(e) {
alert("Failed to fetch cart");
} finally {
setLoading(false);
}
}

async function checkoutCOD(){
if(!token){ alert('Please Login'); return }
try{
await axios.post(API_URL + '/checkout-cod', {}, { headers: { Authorization: 'Bearer '+token } });
alert('Order placed successfully via COD!');
setCart({ CartItems: [] })
}catch(e){
alert('Error: '+(e.response?.data?.error||e.message))
}
}

async function checkoutRazorpay(){
if(!token) { alert('Please Login'); return }

const rzpRes = await axios.post(API_URL + '/checkout-razorpay', {}, {
headers: { Authorization: 'Bearer '+token }
});
const rzpOrder = rzpRes.data.rzpOrder;
const finalAmount = rzpRes.data.amount;

const res = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
if(!res) { alert('Razorpay SDK failed to load'); return; }

const options = {
key: 'rzp_test_XXXXXXXXXXXXXXXX', // 🛑 REPLACE THIS with your KEY_ID 🛑
amount: rzpOrder.amount,
currency: rzpOrder.currency,
name: 'SPYRO BAZAAR',
description: 'Order Payment',
order_id: rzpOrder.id,
handler: async function (response){
try {
await axios.post(API_URL + '/checkout-success', {
razorpay_payment_id: response.razorpay_payment_id,
razorpay_order_id: response.razorpay_order_id,
razorpay_signature: response.razorpay_signature
}, { headers: { Authorization: 'Bearer '+token } });

alert('Payment successful and Order placed!');
setCart({ CartItems: [] })

} catch(e) {
alert('Order Finalization Failed: '+(e.response?.data?.error||e.message))
}
},
prefill: {
name: user.name || 'Guest User',
email: user.email || 'guest@spyrobazaar.com',
},
theme: { color: '#3B82F6' }
};

const paymentObject = new window.Razorpay(options);
paymentObject.open();
}

if (loading) return <p>Loading Cart...</p>;

const totalAmount = cart?.CartItems?.reduce((acc, ci) => acc + (ci.priceAtAdd * ci.qty), 0) || 0;

return (
<div>
<h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>
{!cart || !cart.CartItems || cart.CartItems.length===0 ? <p className="text-gray-500">Your cart is empty.</p> : (
<div>
{cart.CartItems.map(ci=> (
<div key={ci.id} className="flex justify-between items-center p-3 border-b hover:bg-gray-50">
<div className="flex-1">
<div className="font-semibold text-lg">{ci.Product?.title || 'Loading...'}</div>
<div className="text-sm text-gray-600">Qty: {ci.qty} @ ₹{ci.priceAtAdd}</div>
</div>
<div className="text-xl font-bold">₹ {ci.priceAtAdd * ci.qty}</div>
</div>
))}

<div className="text-right mt-6 border-t pt-4">
<h3 className="text-2xl font-bold">Total: ₹ {totalAmount.toFixed(2)}</h3>
<p className="text-sm text-gray-500 mb-4">Taxes and Shipping not calculated yet.</p>

<button onClick={checkoutRazorpay} className="mt-2 w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300">
Pay Now with Razorpay
</button>

<button onClick={checkoutCOD} className="mt-2 w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-300">
Checkout (Cash On Delivery)
</button>
</div>
</div>
)}
</div>
)
}