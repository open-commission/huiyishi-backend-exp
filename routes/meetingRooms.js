const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 获取当前时间戳
function getCurrentTimestamp() {
  return Math.floor(Date.now() / 1000);
}

// 计算会议室当前是否可用以及最近的可用时间段
function calculateRoomAvailability(roomData) {
  const now = new Date();
  const currentTime = now.getTime();
  
  let isCurrentlyAvailable = false;
  let nextAvailableSlot = null;
  
  if (roomData.available_time_slots) {
    try {
      const timeSlots = JSON.parse(roomData.available_time_slots);
      
      for (let slot of timeSlots) {
        const startTime = new Date(slot.start_time).getTime();
        const endTime = new Date(slot.end_time).getTime();
        
        if (currentTime >= startTime && currentTime <= endTime) {
          isCurrentlyAvailable = true;
        }
        
        if (!nextAvailableSlot && startTime > currentTime) {
          nextAvailableSlot = slot;
        } else if (nextAvailableSlot && startTime > currentTime && startTime < new Date(nextAvailableSlot.start_time).getTime()) {
          nextAvailableSlot = slot;
        }
      }
    } catch (e) {
      console.error("解析可用时间段出错:", e);
    }
  }
  
  return {
    is_currently_available: isCurrentlyAvailable,
    next_available_slot: nextAvailableSlot
  };
}

// 刷新会议室状态
function refreshRoomStatus(roomData) {
  const availability = calculateRoomAvailability(roomData);
  return {
    ...roomData,
    is_currently_available: availability.is_currently_available,
    next_available_slot: availability.next_available_slot
  };
}

// 获取所有会议室
router.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM meeting_rooms ORDER BY id ASC';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const refreshedRooms = rows.map(room => refreshRoomStatus(room));
    res.json(refreshedRooms);
  });
});

// 根据ID获取单个会议室
router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  const sql = 'SELECT * FROM meeting_rooms WHERE id = ?';
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: '会议室不存在' });
    }
    
    const refreshedRoom = refreshRoomStatus(row);
    res.json(refreshedRoom);
  });
});

// 添加会议室
router.post('/', (req, res, next) => {
  const { room_number, room_name, available_time_slots = '[]' } = req.body;
  
  // 检查会议室编号是否已存在
  const checkSql = 'SELECT * FROM meeting_rooms WHERE room_number = ?';
  db.get(checkSql, [room_number], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (row) {
      return res.status(400).json({ error: '会议室编号已存在' });
    }
    
    const insertSql = `
      INSERT INTO meeting_rooms (room_number, room_name, available_time_slots)
      VALUES (?, ?, ?)
    `;
    
    db.run(insertSql, [room_number, room_name, JSON.stringify(available_time_slots)], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        id: this.lastID,
        room_number,
        room_name,
        available_time_slots
      });
    });
  });
});

// 更新会议室
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const { room_number, room_name, available_time_slots } = req.body;
  
  const updateSql = `
    UPDATE meeting_rooms
    SET room_number = ?, room_name = ?, available_time_slots = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(updateSql, [room_number, room_name, JSON.stringify(available_time_slots), id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '会议室不存在' });
    }
    
    res.json({ message: '会议室更新成功', changes: this.changes });
  });
});

// 删除会议室
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  
  // 检查会议室是否存在
  const checkSql = 'SELECT * FROM meeting_rooms WHERE id = ?';
  db.get(checkSql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: '会议室不存在' });
    }
    
    // 先删除相关的预约记录
    const deleteReservationsSql = 'DELETE FROM reservations WHERE room_id = ?';
    db.run(deleteReservationsSql, [id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // 再删除会议室
      const deleteSql = 'DELETE FROM meeting_rooms WHERE id = ?';
      db.run(deleteSql, [id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json({ message: '会议室删除成功', changes: this.changes });
      });
    });
  });
});

module.exports = router;