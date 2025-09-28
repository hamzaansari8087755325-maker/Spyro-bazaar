import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
const API_URL = import.meta.env.VITE_API_URL;

export default function Login(){
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const nav = useNavigate()
async function submit(e){
e.preventDefault()
try{
const res = await axios.post(API_URL + '/auth/login', { email, password })
localStorage.setItem('spyro_token', res.data.token)
localStorage.setItem('spyro_user', JSON.stringify(res.data.user))
alert('Logged in')
nav('/')
window.location.reload();
}catch(err){ alert(err.response?.data?.error || 'Login failed') }
}
return (
<form onSubmit={submit} className="max-w-md">
<h2 className="text-xl mb-4">Login</h2>
<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full p-2 mb-2 border" />
<input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-2 mb-2 border" />
<button className="px-4 py-2 bg-blue-600 text-white">Login</button>
</form>
)
}