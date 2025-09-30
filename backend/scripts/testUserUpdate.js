const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testUserUpdate() {
  console.log('🧪 Testing user update functionality...');
  
  const baseURL = 'http://localhost:5000/api';
  let authToken = '';
  
  try {
    // Step 1: Login to get auth token
    console.log('\n--- Login to get auth token ---');
    const loginResponse = await makeRequest(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed');
      return;
    }
    
    // Step 2: Get list of users to find one to update
    console.log('\n--- Getting users list ---');
    const usersResponse = await makeRequest(`${baseURL}/role-management/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (!usersResponse.data.success || usersResponse.data.data.length === 0) {
      console.log('❌ No users found to update');
      return;
    }
    
    // Find a non-admin user to update (safer for testing)
    const testUser = usersResponse.data.data.find(user => user.role !== 'admin');
    if (!testUser) {
      console.log('❌ No non-admin users found for safe testing');
      return;
    }
    
    console.log(`📋 Found user to update: ${testUser.firstName} ${testUser.lastName} (${testUser.email})`);
    
    // Step 3: Test update without password (should work)
    console.log('\n--- Testing update without password ---');
    const updateData = {
      firstName: testUser.firstName + '_Updated',
      lastName: testUser.lastName,
      username: testUser.username,
      email: testUser.email,
      role: testUser.role,
      phone: testUser.phone || '1234567890'
    };
    
    console.log('📤 Update data (without password):', JSON.stringify(updateData, null, 2));
    
    const updateResponse = await makeRequest(`${baseURL}/role-management/users/${testUser._id}`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    console.log(`📊 Response Status: ${updateResponse.status}`);
    console.log(`📝 Response:`, JSON.stringify(updateResponse.data, null, 2));
    
    if (updateResponse.data.success) {
      console.log('✅ Update without password successful!');
      console.log(`👤 Updated user: ${updateResponse.data.data.firstName} ${updateResponse.data.data.lastName}`);
    } else {
      console.log('❌ Update without password failed');
      console.log('Error details:', updateResponse.data.message || updateResponse.data.errors);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error.message);
  }
}

testUserUpdate();