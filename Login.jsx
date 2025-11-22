import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';

export default function Login(){
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  function handleSubmit(e){
    e.preventDefault();
    // dummy auth - replace with API call
    const token = 'demo-token';
    login(token);
    navigate('/');
  }
  return (
    <div className='max-w-md mx-auto p-6 card-glass'>
      <h2 className='text-xl font-semibold mb-4'>Sign in</h2>
      <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
        <input required placeholder='Email' className='px-3 py-2 rounded bg-transparent border border-white/10' />
        <input required placeholder='Password' type='password' className='px-3 py-2 rounded bg-transparent border border-white/10' />
        <button className='btn-primary mt-2' type='submit'>Sign in</button>
      </form>
    </div>
  );
}
