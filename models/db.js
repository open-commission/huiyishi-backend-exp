const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库实例
const dbPath = path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('打开数据库失败:', err.message);
  } else {
    console.log('连接到SQLite数据库');
  }
});

// 初始化数据库表
db.serialize(() => {
  // 会议室表
  db.run(`CREATE TABLE IF NOT EXISTS meeting_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT UNIQUE NOT NULL,
    room_name TEXT NOT NULL,
    available_time_slots TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 预约表
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    room_number TEXT NOT NULL,
    room_name TEXT NOT NULL,
    participants_count INTEGER DEFAULT 1,
    core_member TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT '未开始', -- 未开始, 已开始, 已结束
    check_in_method TEXT DEFAULT '线下', -- 线上, 线下
    core_member_check_in_status BOOLEAN DEFAULT 0,
    FOREIGN KEY (room_id) REFERENCES meeting_rooms (id),
    CHECK (status IN ('未开始', '已经开始', '已结束')),
    CHECK (check_in_method IN ('线上', '线下'))
  )`);

  // 会议室状态表
  db.run(`CREATE TABLE IF NOT EXISTS room_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    room_number TEXT NOT NULL,
    status_name TEXT NOT NULL,
    status_value TEXT NOT NULL,
    threshold_value TEXT,
    is_alarm_status BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES meeting_rooms (id)
  )`);

  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    nickname TEXT,
    card_number TEXT,
    role TEXT DEFAULT '普通用户',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = db;