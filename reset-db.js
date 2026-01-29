const db = require('./models/db');

console.log('正在重置数据库...');

// 清空所有表的数据
db.serialize(() => {
  // 删除所有预约
  db.run("DELETE FROM reservations", [], (err) => {
    if (err) {
      console.error('清空预约表失败:', err.message);
    } else {
      console.log('预约表已清空');
    }
  });

  // 删除所有会议室状态
  db.run("DELETE FROM room_statuses", [], (err) => {
    if (err) {
      console.error('清空会议室状态表失败:', err.message);
    } else {
      console.log('会议室状态表已清空');
    }
  });

  // 删除所有会议室
  db.run("DELETE FROM meeting_rooms", [], (err) => {
    if (err) {
      console.error('清空会议室表失败:', err.message);
    } else {
      console.log('会议室表已清空');
    }
  });

  // 删除所有用户
  db.run("DELETE FROM users", [], (err) => {
    if (err) {
      console.error('清空用户表失败:', err.message);
    } else {
      console.log('用户表已清空');
    }
  });
  
  console.log('数据库重置完成！');
  
  // 关闭数据库连接
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('关闭数据库失败:', err.message);
      } else {
        console.log('数据库连接已关闭');
      }
    });
  }, 1000);
});