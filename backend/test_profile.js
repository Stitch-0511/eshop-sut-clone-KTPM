const axios = require('axios');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 2, role: 'user' }, 'super_secret_key_that_should_not_be_here');
console.log("Token:", token);
axios.get('https://eshop-sut-clone-ktpm.onrender.com/api/users/me', { headers: { Authorization: 'Bearer ' + token }})
.then(res => console.log("Profile ok:", res.data))
.catch(err => console.log("Lỗi:", err.message));
