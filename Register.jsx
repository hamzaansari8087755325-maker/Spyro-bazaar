import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
const API_URL = import.meta.env.VITE_API_URL;

export default function Register(){
const [name,setName]=useState('')
const [email,setEmail]=useState('')
const [password,setPassword]=useState('')
const [role,setRole]=useState('customer')
const nav = useNavigate()
async function submit(e){
e.preventDefault()
try{
const res = await axios.post(API_URL + '/auth/register', { name, email, password, role })
localStorage.setItem('spyro_token', res.data.token)
localStorage.setItem('spyro_user', JSON.stringify(res.data.user))
alert('Registered')
nav('/')
window.location.reload();
}catch(err){ alert(err.response?.data?.error || 'Registration failed') }
}
return (
<form onSubmit={submit} className="max-w-md">
<h2 className="text-xl mb-4">Register</h2>
<input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full p-2 mb-2 border" />
<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 mb-2 border" />
<input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-2 mb-2 border" />
<select value={role} onChange={e=>setRole(e.target.value)} className="w-full p-2 mb-2 border">
<option value="customer">Customer</option>
<option value="seller">Seller</option>
</select>
<button className="px-4 py-2 bg-green-600 text-white">Register</button>
</form>
)
}