const testDirectLogin = async () => {
  console.log('🧪 Testing direct login with correct API path...');
  
  const tests = [
    {
      name: 'Health Check',
      url: 'http://localhost:5000/api/health',
      method: 'GET'
    },
    {
      name: 'Login with correct API path',
      url: 'http://localhost:5000/api/auth/login',
      method: 'POST',
      body: {
        username: 'admin',
        password: 'admin123'
      }
    },
    {
      name: 'Login with incorrect path (no /api)',
      url: 'http://localhost:5000/auth/login', 
      method: 'POST',
      body: {
        username: 'admin',
        password: 'admin123'
      }
    }
  ];

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    try {
      const options = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      console.log('📤 Request URL:', test.url);
      console.log('📤 Request Method:', test.method);
      if (test.body) {
        console.log('📤 Request Body:', JSON.stringify(test.body));
      }

      const response = await fetch(test.url, options);
      
      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Status Text:', response.statusText);
      
      const responseText = await response.text();
      console.log('📝 Raw Response:', responseText);
      
      try {
        const jsonData = JSON.parse(responseText);
        console.log('✨ Success:', jsonData.success);
        console.log('📋 Message:', jsonData.message);
        
        if (jsonData.success) {
          console.log('✅ Test PASSED');
        } else {
          console.log('❌ Test FAILED - API returned success: false');
        }
      } catch (parseError) {
        console.log('❌ Test FAILED - Invalid JSON response');
      }
      
    } catch (error) {
      console.log('💥 Test FAILED - Network/Connection Error:', error.message);
    }
  }
};

testDirectLogin();