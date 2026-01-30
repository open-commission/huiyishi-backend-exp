const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 认证回调路由 - 处理来自认证中心的回调
router.get('/callback', (req, res) => {
  const { username, userUUID, role, redirect } = req.query;
  
  if (!username || !userUUID) {
    return res.status(400).json({ error: '缺少必要的用户信息' });
  }
  
  // 将用户信息存储到session
  req.session.userUUID = userUUID;
  req.session.username = username;
  req.session.role = role || '普通用户';
  
  // 检查用户是否已存在于数据库中
  const checkUserSql = 'SELECT * FROM users WHERE uuid = ?';
  db.get(checkUserSql, [userUUID], (err, row) => {
    if (err) {
      console.error('检查用户时出错:', err);
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!row) {
      // 如果用户不存在，则创建新用户
      const insertUserSql = `
        INSERT INTO users (uuid, username, nickname, card_number, role)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.run(insertUserSql, [
        userUUID, 
        username, 
        username, // 使用用户名作为昵称
        null, // 卡号暂时为空
        req.session.role
      ], function(err) {
        if (err) {
          console.error('创建用户时出错:', err);
          return res.status(500).json({ error: '创建用户失败' });
        }
        
        console.log('新用户已创建:', username);
        
        // 重定向到首页或其他页面
        const redirectTo = redirect ? decodeURIComponent(redirect) : '/';
        res.redirect(redirectTo);
      });
    } else {
      // 用户已存在，直接重定向
      const redirectTo = redirect ? decodeURIComponent(redirect) : '/';
      res.redirect(redirectTo);
    }
  });
});

// 获取当前用户信息
router.get('/current-user', (req, res) => {
  if (req.session.userUUID) {
    res.json({
      userUUID: req.session.userUUID,
      username: req.session.username,
      role: req.session.role
    });
  } else {
    res.status(401).json({ error: '未登录' });
  }
});

// 登出
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: '登出失败' });
    }
    res.clearCookie('connect.sid'); // 清除session cookie
    res.json({ message: '登出成功' });
  });
});

module.exports = router;