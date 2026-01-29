const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 刷新状态值
function refreshStatusValue(statusData) {
  // 在这里可以添加业务逻辑来动态计算状态值
  // 当前我们直接返回原始数据，但在实际应用中可能需要实时查询设备状态等
  return {
    ...statusData,
    is_alarm_status: statusData.is_alarm_status == 1 // 转换为布尔值
  };
}

// 获取所有会议室状态
router.get('/', (req, res, next) => {
  const sql = `
    SELECT rs.*, mr.room_name
    FROM room_statuses rs
    LEFT JOIN meeting_rooms mr ON rs.room_id = mr.id
    ORDER BY rs.created_at DESC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const refreshedStatuses = rows.map(status => refreshStatusValue(status));
    res.json(refreshedStatuses);
  });
});

// 根据ID获取单个状态
router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  const sql = `
    SELECT rs.*, mr.room_name
    FROM room_statuses rs
    LEFT JOIN meeting_rooms mr ON rs.room_id = mr.id
    WHERE rs.id = ?
  `;
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: '状态记录不存在' });
    }
    
    const refreshedStatus = refreshStatusValue(row);
    res.json(refreshedStatus);
  });
});

// 添加会议室状态
router.post('/', (req, res, next) => {
  const { room_id, room_number, status_name, status_value, threshold_value, is_alarm_status = false } = req.body;
  
  // 检查会议室是否存在
  const checkRoomSql = 'SELECT * FROM meeting_rooms WHERE id = ? AND room_number = ?';
  db.get(checkRoomSql, [room_id, room_number], (err, roomRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!roomRow) {
      return res.status(400).json({ error: '会议室不存在或编号不匹配' });
    }
    
    const insertSql = `
      INSERT INTO room_statuses 
      (room_id, room_number, status_name, status_value, threshold_value, is_alarm_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertSql, [
      room_id, room_number, status_name, status_value, threshold_value, is_alarm_status ? 1 : 0
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        id: this.lastID,
        room_id,
        room_number,
        status_name,
        status_value,
        threshold_value,
        is_alarm_status: is_alarm_status ? 1 : 0
      });
    });
  });
});

// 更新会议室状态
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const { room_id, room_number, status_name, status_value, threshold_value, is_alarm_status } = req.body;
  
  // 检查状态记录是否存在
  const checkSql = 'SELECT * FROM room_statuses WHERE id = ?';
  db.get(checkSql, [id], (err, statusRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!statusRow) {
      return res.status(404).json({ error: '状态记录不存在' });
    }
    
    // 检查会议室是否存在
    const checkRoomSql = 'SELECT * FROM meeting_rooms WHERE id = ? AND room_number = ?';
    db.get(checkRoomSql, [room_id, room_number], (err, roomRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!roomRow) {
        return res.status(400).json({ error: '会议室不存在或编号不匹配' });
      }
      
      const updateSql = `
        UPDATE room_statuses
        SET room_id = ?, room_number = ?, status_name = ?, status_value = ?, 
            threshold_value = ?, is_alarm_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      db.run(updateSql, [
        room_id, room_number, status_name, status_value, threshold_value, 
        is_alarm_status ? 1 : 0, id
      ], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: '状态记录不存在' });
        }
        
        res.json({ message: '状态记录更新成功', changes: this.changes });
      });
    });
  });
});

// 删除会议室状态
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  
  const deleteSql = 'DELETE FROM room_statuses WHERE id = ?';
  db.run(deleteSql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '状态记录不存在' });
    }
    
    res.json({ message: '状态记录删除成功', changes: this.changes });
  });
});

module.exports = router;