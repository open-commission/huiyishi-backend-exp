var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // 如果有用户信息，显示主页
  if (req.session.userUUID) {
    res.render('index', { 
      title: '会议室管理系统', 
      user: {
        uuid: req.session.userUUID,
        username: req.session.username,
        role: req.session.role
      }
    });
  } else {
    // 如果没有用户信息且有查询参数，则尝试处理认证
    if (req.query.username && req.query.userUUID) {
      req.session.userUUID = req.query.userUUID;
      req.session.username = req.query.username;
      req.session.role = req.query.role || '普通用户';
      
      res.render('index', { 
        title: '会议室管理系统', 
        user: {
          uuid: req.session.userUUID,
          username: req.session.username,
          role: req.session.role
        }
      });
    } else {
      // 否则重定向到认证中心
      const redirectUrl = `http://127.0.0.1:8080?clientId=1234567890&redirect=${encodeURIComponent('/')}`;
      res.redirect(redirectUrl);
    }
  }
});

module.exports = router;