// import fetch from 'node-fetch'; // Native in Node 18+
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3001/api';

async function test() {
  console.log('Testing API...');

  // 1. Login
  console.log('\n1. Testing Login...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '13800000000', code: '123456' })
  });
  const loginData = await loginRes.json();
  console.log('Login Result:', loginData);
  
  if (!loginData.user) {
    console.error('Login failed');
    return;
  }
  const userId = loginData.user.id;

  // 2. Create Task
  console.log('\n2. Testing Create Task...');
  const taskRes = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, name: 'Test Task', direction: 'down' })
  });
  const taskData = await taskRes.json();
  console.log('Task Created:', taskData);
  const taskId = taskData.id;

  // 3. Get Tasks
  console.log('\n3. Testing Get Tasks...');
  const tasksRes = await fetch(`${API_BASE}/tasks?userId=${userId}`);
  const tasksData = await tasksRes.json();
  console.log(`Found ${tasksData.length} tasks`);

  console.log('\nTest Completed.');
}

test().catch(console.error);
