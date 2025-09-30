const testUserCreation = async () => {
  console.log('🧪 Testing user creation with username...');
  
  const userData = {
    firstName: 'Test',
    lastName: 'User',
    username: 'testuser' + Date.now(),
    email: 'testuser' + Date.now() + '@example.com',
    password: 'password123',
    role: 'sales',
    phone: '1234567890'
  };

  try {
    console.log('📤 Sending user creation request...');
    console.log('📝 User data:', JSON.stringify(userData, null, 2));

    const response = await fetch('http://localhost:5000/api/role-management/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZGEzNzhiYjg2MDAwMGMwNjY3ODc2ZiIsImlhdCI6MTc1OTEzNjcyNSwiZXhwIjoxNzU5NzQxNTI1fQ.5oifSAr2o9vNHf5ooOHbiec6XI563vKCXoetX7gVpHw'
      },
      body: JSON.stringify(userData)
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📝 Raw Response:', responseText);
    
    try {
      const jsonData = JSON.parse(responseText);
      console.log('✨ Success:', jsonData.success);
      console.log('📋 Message:', jsonData.message);
      
      if (jsonData.success) {
        console.log('✅ User created successfully!');
        console.log('👤 Created user:', {
          id: jsonData.data._id,
          username: jsonData.data.username,
          email: jsonData.data.email,
          role: jsonData.data.role
        });
      } else {
        console.log('❌ User creation failed:', jsonData.message);
        if (jsonData.errors) {
          console.log('🔍 Validation errors:', jsonData.errors);
        }
      }
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response');
    }
    
  } catch (error) {
    console.log('💥 Network/Connection Error:', error.message);
  }
};

testUserCreation();