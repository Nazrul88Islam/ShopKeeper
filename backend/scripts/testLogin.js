const testLogin = async () => {
  try {
    console.log('🧪 Testing login endpoint...');
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    console.log('📊 Response status:', response.status);
    console.log('📋 Response headers:', Object.fromEntries(response.headers));
    
    const responseData = await response.text();
    console.log('📝 Raw response:', responseData);
    
    try {
      const jsonData = JSON.parse(responseData);
      console.log('✨ Parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (parseError) {
      console.log('❌ Failed to parse JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testLogin();