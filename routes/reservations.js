const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 计算预约当前状态
function calculateReservationStatus(reservationData) {
  const now = new Date();
  const startTime = new Date(reservationData.start_time);
  const endTime = new Date(reservationData.end_time);
  
  if (now < startTime) {
    return '未开始';
  } else if (now >= startTime && now <= endTime) {
    return '已经开始';
  } else {
    return '已结束';
  }
}

// 刷新预约状态
function refreshReservationStatus(reservationData) {
  const status = calculateReservationStatus(reservationData);
  return {
    ...reservationData,
    status: status
  };
}

// 获取所有预约
router.get('/', (req, res, next) => {
  const sql = `
    SELECT r.*, mr.room_name as room_name_from_table
    FROM reservations r
    LEFT JOIN meeting_rooms mr ON r.room_id = mr.id
    ORDER BY r.booking_time DESC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const refreshedReservations = rows.map(reservation => refreshReservationStatus(reservation));
    res.json(refreshedReservations);
  });
});

// 根据ID获取单个预约
router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  const sql = `
    SELECT r.*, mr.room_name as room_name_from_table
    FROM reservations r
    LEFT JOIN meeting_rooms mr ON r.room_id = mr.id
    WHERE r.id = ?
  `;
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: '预约不存在' });
    }
    
    const refreshedReservation = refreshReservationStatus(row);
    res.json(refreshedReservation);
  });
});

// 添加预约
router.post('/', (req, res, next) => {
  const { room_id, room_number, room_name, participants_count, core_member, 
          start_time, end_time, check_in_method = '线下', core_member_check_in_status = false } = req.body;
  
  // 检查会议室是否存在
  const checkRoomSql = 'SELECT * FROM meeting_rooms WHERE id = ? AND room_number = ?';
  db.get(checkRoomSql, [room_id, room_number], (err, roomRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!roomRow) {
      return res.status(400).json({ error: '会议室不存在或编号不匹配' });
    }
    
    // 检查时间冲突
    const conflictCheckSql = `
      SELECT * FROM reservations 
      WHERE room_id = ? 
      AND status != '已结束'
      AND (
        (start_time < ? AND end_time > ?) OR
        (start_time < ? AND end_time > ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `;
    
    db.get(conflictCheckSql, [
      room_id, 
      end_time, start_time, 
      end_time, start_time,
      start_time, end_time
    ], (err, conflictRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (conflictRow) {
        return res.status(400).json({ error: '该时间段已被预约，请选择其他时间' });
      }
      
      const insertSql = `
        INSERT INTO reservations 
        (room_id, room_number, room_name, participants_count, core_member, 
         start_time, end_time, check_in_method, core_member_check_in_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(insertSql, [
        room_id, room_number, room_name, participants_count, core_member,
        start_time, end_time, check_in_method, core_member_check_in_status
      ], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.status(201).json({
          id: this.lastID,
          room_id,
          room_number,
          room_name,
          participants_count,
          core_member,
          start_time,
          end_time,
          check_in_method,
          core_member_check_in_status,
          booking_time: new Date().toISOString()
        });
      });
    });
  });
});

// 更新预约
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const { room_id, room_number, room_name, participants_count, core_member, 
          start_time, end_time, check_in_method, core_member_check_in_status } = req.body;
  
  // 检查预约是否存在
  const checkSql = 'SELECT * FROM reservations WHERE id = ?';
  db.get(checkSql, [id], (err, reservationRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!reservationRow) {
      return res.status(404).json({ error: '预约不存在' });
    }
    
    // 检查时间冲突（排除当前预约记录）
    const conflictCheckSql = `
      SELECT * FROM reservations 
      WHERE room_id = ? 
      AND id != ?
      AND status != '已结束'
      AND (
        (start_time < ? AND end_time > ?) OR
        (start_time < ? AND end_time > ?) OR
        (start_time >= ? AND end_time <= ?)
      )
    `;
    
    db.get(conflictCheckSql, [
      room_id, id,
      end_time, start_time,
      end_time, start_time,
      start_time, end_time
    ], (err, conflictRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (conflictRow) {
        return res.status(400).json({ error: '该时间段已被预约，请选择其他时间' });
      }
      
      const updateSql = `
        UPDATE reservations
        SET room_id = ?, room_number = ?, room_name = ?, participants_count = ?, 
            core_member = ?, start_time = ?, end_time = ?, check_in_method = ?, 
            core_member_check_in_status = ?, booking_time = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.run(updateSql, [
        room_id, room_number, room_name, participants_count, core_member,
        start_time, end_time, check_in_method, core_member_check_in_status, id
      ], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: '预约不存在' });
        }
        
        res.json({ message: '预约更新成功', changes: this.changes });
      });
    });
  });
});

// 删除预约
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  
  const deleteSql = 'DELETE FROM reservations WHERE id = ?';
  db.run(deleteSql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '预约不存在' });
    }
    
    res.json({ message: '预约删除成功', changes: this.changes });
  });
});

module.exports = router;