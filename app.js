var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var meetingRoomsRouter = require('./routes/meetingRooms');
var reservationsRouter = require('./routes/reservations');
var roomStatusesRouter = require('./routes/roomStatuses');
var authRouter = require('./routes/auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Session middleware
app.use(session({
  secret: 'huiyishi-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24小时
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware - only for protected routes
app.use((req, res, next) => {
  // 不对认证回调路径、静态资源和主页进行认证检查
  if (req.path.startsWith('/auth') || req.path === '/' || req.path.startsWith('/stylesheets/') || req.path.startsWith('/images/') || req.path.startsWith('/javascripts/')) {
    return next();
  }
  
  // 检查是否有用户UUID在session中
  if (!req.session.userUUID) {
    // 如果没有用户UUID，重定向到认证中心
    if (!req.query.username && !req.query.userUUID) {
      const redirectUrl = `http://127.0.0.1:8080?clientId=1234567890&redirect=${encodeURIComponent(req.originalUrl)}`;
      return res.redirect(redirectUrl);
    }
    
    // 如果回调中有用户信息，则处理并保存到session
    if (req.query.username && req.query.userUUID) {
      req.session.userUUID = req.query.userUUID;
      req.session.username = req.query.username;
      req.session.role = req.query.role || '普通用户';
      
      // 导入用户模型以检查或创建用户
      const db = require('./models/db');
      
      // 检查用户是否已存在
      const checkUserSql = 'SELECT * FROM users WHERE uuid = ?';
      db.get(checkUserSql, [req.session.userUUID], (err, row) => {
        if (err) {
          console.error('检查用户时出错:', err);
          return next();
        }
        
        if (!row) {
          // 如果用户不存在，则创建新用户
          const insertUserSql = `
            INSERT INTO users (uuid, username, nickname, card_number, role)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          db.run(insertUserSql, [
            req.session.userUUID, 
            req.session.username, 
            req.session.username, // 使用用户名作为昵称
            null, // 卡号暂时为空
            req.session.role
          ], function(err) {
            if (err) {
              console.error('创建用户时出错:', err);
            } else {
              console.log('新用户已创建:', req.session.username);
            }
            next();
          });
        } else {
          next();
        }
      });
      return;
    }
  }
  
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/meeting-rooms', meetingRoomsRouter);
app.use('/reservations', reservationsRouter);
app.use('/room-statuses', roomStatusesRouter);
app.use('/auth', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;