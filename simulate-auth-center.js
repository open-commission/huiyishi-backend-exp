const express = require('express');
const app = express();

// 模拟认证中心
app.get('/', (req, res) => {
  const { clientId, redirect } = req.query;
  
  console.log('认证中心收到请求:', { clientId, redirect });
  
  // 模拟认证过程，直接重定向回原系统
  const encodedRedirect = encodeURIComponent(redirect || '/');
  const returnUrl = `http://localhost:3000/auth/callback?username=simulated_user&userUUID=simulated-uuid-12345&role=普通用户&redirect=${encodedRedirect}`;
  
  console.log('重定向到:', returnUrl);
  
  res.send(`
    <html>
      <head><title>模拟认证中心</title></head>
      <body>
        <h1>模拟认证中心</h1>
        <p>Client ID: ${clientId}</p>
        <p>Redirect: ${redirect}</p>
        <p>正在重定向到: ${returnUrl}</p>
        <script>
          window.location.href = "${returnUrl}";
        </script>
      </body>
    </html>
  `);
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`模拟认证中心运行在 http://127.0.0.1:${PORT}`);
  console.log('此服务器用于模拟认证中心，演示认证流程');
});