const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { v4: uuidv4 } = require('uuid');

// 获取所有用户
router.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM users ORDER BY id ASC';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

// 根据ID获取单个用户
router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  const sql = 'SELECT * FROM users WHERE id = ?';
  
  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json(row);
  });
});

// 添加用户
router.post('/', (req, res, next) => {
  const { username, nickname, card_number, role = '普通用户' } = req.body;
  const uuid = uuidv4(); // 生成UUID
  
  // 检查用户名是否已存在
  const checkUsernameSql = 'SELECT * FROM users WHERE username = ?';
  db.get(checkUsernameSql, [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (row) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    // 如果提供了卡号，检查卡号是否已存在
    if (card_number) {
      const checkCardNumberSql = 'SELECT * FROM users WHERE card_number = ?';
      db.get(checkCardNumberSql, [card_number], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (row) {
          return res.status(400).json({ error: '卡号已存在' });
        }
        
        insertUser(uuid, username, nickname, card_number, role, res);
      });
    } else {
      insertUser(uuid, username, nickname, card_number, role, res);
    }
  });
});

// 插入用户的辅助函数
function insertUser(uuid, username, nickname, card_number, role, res) {
  const insertSql = `
    INSERT INTO users (uuid, username, nickname, card_number, role)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(insertSql, [uuid, username, nickname, card_number, role], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({
      id: this.lastID,
      uuid,
      username,
      nickname,
      card_number,
      role
    });
  });
}

// 更新用户
router.put('/:id', (req, res, next) => {
  const id = req.params.id;
  const { username, nickname, card_number, role } = req.body;
  
  // 检查用户是否存在
  const checkSql = 'SELECT * FROM users WHERE id = ?';
  db.get(checkSql, [id], (err, userRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!userRow) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 检查用户名是否与其他用户冲突
    const checkUsernameSql = 'SELECT * FROM users WHERE username = ? AND id != ?';
    db.get(checkUsernameSql, [username, id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (row) {
        return res.status(400).json({ error: '用户名已被其他用户使用' });
      }
      
      // 如果提供了卡号，检查卡号是否与其他用户冲突
      if (card_number) {
        const checkCardNumberSql = 'SELECT * FROM users WHERE card_number = ? AND id != ?';
        db.get(checkCardNumberSql, [card_number, id], (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          if (row) {
            return res.status(400).json({ error: '卡号已被其他用户使用' });
          }
          
          updateUser(id, username, nickname, card_number, role, res);
        });
      } else {
        updateUser(id, username, nickname, card_number, role, res);
      }
    });
  });
});

// 更新用户的辅助函数
function updateUser(id, username, nickname, card_number, role, res) {
  const updateSql = `
    UPDATE users
    SET username = ?, nickname = ?, card_number = ?, role = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(updateSql, [username, nickname, card_number, role, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ message: '用户更新成功', changes: this.changes });
  });
}

// 删除用户
router.delete('/:id', (req, res, next) => {
  const id = req.params.id;
  
  const deleteSql = 'DELETE FROM users WHERE id = ?';
  db.run(deleteSql, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ message: '用户删除成功', changes: this.changes });
  });
});

module.exports = router;