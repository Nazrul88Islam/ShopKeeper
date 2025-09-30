const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Helper function to login and get token
const loginAdmin = async () => {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.data.success && response.data.token) {
      console.log('✅ Admin login successful');
      return response.data.token;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
};

// Test role assignment functionality
const testFrontendRoleAssignment = async () => {
  try {
    console.log('\n🧪 Testing Frontend Role Assignment API...\n');

    // 1. Login to get token
    const token = await loginAdmin();
    const headers = { Authorization: `Bearer ${token}` };

    // 2. Get all available roles
    console.log('1. Getting all available roles...');
    const rolesResponse = await axios.get(`${API_BASE}/role-management/roles`, { headers });
    const roles = rolesResponse.data.data;
    
    console.log(`✅ Found ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`   - ${role.name} (${role.displayName}) - System: ${role.isSystem}`);
    });

    // 3. Create a test user with custom role
    console.log('\n2. Creating user with custom role...');
    const customRole = roles.find(role => !role.isSystem);
    const testRole = customRole ? customRole.name : 'warehouse_supervisor';
    
    const userData = {
      firstName: 'Test',
      lastName: 'Employee',
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123',
      role: testRole,
      phone: '1234567890'
    };

    console.log(`   Creating user with role: ${testRole}`);
    const userResponse = await axios.post(`${API_BASE}/role-management/users`, userData, { headers });
    
    console.log(`✅ User created successfully: ${userResponse.data.data.firstName} ${userResponse.data.data.lastName}`);
    console.log(`   User ID: ${userResponse.data.data._id}`);
    console.log(`   Role: ${userResponse.data.data.role}`);
    console.log(`   Permissions: ${userResponse.data.data.permissions.length} sets`);

    // 4. Update user role to a different one
    console.log('\n3. Testing role update...');
    const newRole = roles.find(role => role.name !== testRole && role.name !== 'admin');
    if (newRole) {
      const updateData = {
        role: newRole.name
      };

      console.log(`   Updating user role to: ${newRole.name}`);
      const updateResponse = await axios.put(
        `${API_BASE}/role-management/users/${userResponse.data.data._id}`,
        updateData,
        { headers }
      );

      console.log(`✅ User role updated successfully to: ${updateResponse.data.data.role}`);
      console.log(`   New permissions: ${updateResponse.data.data.permissions.length} sets`);
    }

    // 5. Test invalid role assignment
    console.log('\n4. Testing invalid role validation...');
    try {
      await axios.put(
        `${API_BASE}/role-management/users/${userResponse.data.data._id}`,
        { role: 'nonexistent_role' },
        { headers }
      );
      console.log('❌ Should have failed validation!');
    } catch (error) {
      console.log('✅ Role validation working: Invalid role rejected');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }

    // 6. Clean up test user
    console.log('\n5. Cleaning up...');
    // Note: You might want to implement delete user endpoint for cleanup
    console.log(`   Test user ID: ${userResponse.data.data._id} (manual cleanup required)`);

    console.log('\n🎉 Frontend role assignment API test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test error:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
  }
};

// Main execution
const main = async () => {
  try {
    await testFrontendRoleAssignment();
  } catch (error) {
    console.error('Main error:', error);
  }
};

main();