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

async function testRoleManagement() {
  console.log('🧪 Testing role management functionality...');
  
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
    
    // Step 2: Test get roles
    console.log('\n--- Testing get roles ---');
    const rolesResponse = await makeRequest(`${baseURL}/role-management/roles`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log(`📊 Response Status: ${rolesResponse.status}`);
    console.log(`📝 Response:`, JSON.stringify(rolesResponse.data, null, 2));
    
    if (rolesResponse.data.success) {
      console.log(`✅ Get roles successful! Found ${rolesResponse.data.data.length} roles`);
    } else {
      console.log('❌ Get roles failed');
    }
    
    // Step 3: Test create role
    console.log('\n--- Testing create role ---');
    const newRole = {
      name: 'test_role_' + Date.now(),
      displayName: 'Test Role',
      description: 'A test role for testing purposes',
      permissions: [
        { module: 'orders', actions: ['read'] },
        { module: 'customers', actions: ['read', 'create'] }
      ]
    };
    
    console.log('📤 Creating role:', JSON.stringify(newRole, null, 2));
    
    const createRoleResponse = await makeRequest(`${baseURL}/role-management/roles`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newRole)
    });
    
    console.log(`📊 Response Status: ${createRoleResponse.status}`);
    console.log(`📝 Response:`, JSON.stringify(createRoleResponse.data, null, 2));
    
    if (createRoleResponse.data.success) {
      console.log('✅ Create role successful!');
      
      // Step 4: Test update role
      const roleId = createRoleResponse.data.data._id;
      console.log('\n--- Testing update role ---');
      
      const updateData = {
        displayName: 'Updated Test Role',
        description: 'Updated description',
        permissions: [
          { module: 'orders', actions: ['read', 'update'] },
          { module: 'customers', actions: ['read', 'create', 'update'] }
        ]
      };
      
      const updateRoleResponse = await makeRequest(`${baseURL}/role-management/roles/${roleId}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      console.log(`📊 Update Response Status: ${updateRoleResponse.status}`);
      console.log(`📝 Update Response:`, JSON.stringify(updateRoleResponse.data, null, 2));
      
      if (updateRoleResponse.data.success) {
        console.log('✅ Update role successful!');
      } else {
        console.log('❌ Update role failed');
      }
      
      // Step 5: Test delete role
      console.log('\n--- Testing delete role ---');
      
      const deleteRoleResponse = await makeRequest(`${baseURL}/role-management/roles/${roleId}`, {
        method: 'DELETE',
        headers: { 
          Authorization: `Bearer ${authToken}`
        }
      });
      
      console.log(`📊 Delete Response Status: ${deleteRoleResponse.status}`);
      console.log(`📝 Delete Response:`, JSON.stringify(deleteRoleResponse.data, null, 2));
      
      if (deleteRoleResponse.data.success) {
        console.log('✅ Delete role successful!');
      } else {
        console.log('❌ Delete role failed');
      }
      
    } else {
      console.log('❌ Create role failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error.message);
  }
}

testRoleManagement();