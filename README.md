# 会议室设备管理和预约系统

这是一个基于 Express 和 SQLite 构建的会议室设备管理和预约系统，具有完整的增删改查功能。

## 功能特性

### 认证系统
- **Cookie认证**: 使用cookie存储用户UUID，实现自动登录
- **中央认证**: 重定向到中央认证服务器(127.0.0.1:8080)
- **自动用户创建**: 检测用户是否存在，不存在则自动创建
- **Session管理**: 使用express-session管理用户会话
- **参数传递**: 通过clientId、username、userUUID、role等参数与认证中心交互

### 1. 会议室管理
- **会议室编号**: 唯一标识会议室
- **会议室名称**: 会议室显示名称
- **可用时间段**: 会议室的可预订时间
- **当前是否可用**: 实时计算会议室当前是否可用
- **最近的可用时间段**: 显示最近的可用时间

### 2. 预约管理
- **预约会议室编号**: 关联的会议室
- **会议室名称**: 预约的会议室名称
- **预约人数**: 参会人数
- **核心成员**: 预约负责人
- **预约时间段**: 开始时间和结束时间
- **创建时间**: 预约创建时间
- **当前状态**: 未开始、已开始、已结束（实时计算）
- **签到方案**: 线上签到或线下签到
- **核心成员是否已签到**: 签到状态

### 3. 会议室状态
- **会议室编号**: 关联的会议室
- **状态名称**: 如温度、湿度、设备状态等
- **状态值**: 当前状态的具体数值
- **合理阈值**: 正常范围值
- **是否报警状态**: 是否超出正常范围

### 4. 会议人员管理
- **用户UUID**: 用户唯一标识符
- **用户名**: 登录用户名
- **用户昵称**: 显示昵称
- **用户卡号**: 识别卡号
- **角色**: 用户权限角色

## 技术栈

- **后端框架**: Express.js
- **数据库**: SQLite3
- **Session管理**: express-session
- **依赖管理**: npm
- **API测试**: axios

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动服务器：
```bash
npm start
```

服务器将在 http://localhost:3000 上运行。

## API 接口

### 会议室管理
- `GET /meeting-rooms` - 获取所有会议室
- `GET /meeting-rooms/:id` - 获取指定会议室
- `POST /meeting-rooms` - 创建会议室
- `PUT /meeting-rooms/:id` - 更新会议室
- `DELETE /meeting-rooms/:id` - 删除会议室

### 预约管理
- `GET /reservations` - 获取所有预约
- `GET /reservations/:id` - 获取指定预约
- `POST /reservations` - 创建预约
- `PUT /reservations/:id` - 更新预约
- `DELETE /reservations/:id` - 删除预约

### 会议室状态
- `GET /room-statuses` - 获取所有状态
- `GET /room-statuses/:id` - 获取指定状态
- `POST /room-statuses` - 创建状态
- `PUT /room-statuses/:id` - 更新状态
- `DELETE /room-statuses/:id` - 删除状态

### 会议人员管理
- `GET /users` - 获取所有用户
- `GET /users/:id` - 获取指定用户
- `POST /users` - 创建用户
- `PUT /users/:id` - 更新用户
- `DELETE /users/:id` - 删除用户

## 数据库设计

系统使用 SQLite 数据库存储数据，包含以下表：

- `meeting_rooms`: 会议室信息表
- `reservations`: 预约信息表
- `room_statuses`: 会议室状态表
- `users`: 用户信息表

## 特殊功能

- **实时状态刷新**: 所有状态相关字段（如会议室是否可用、预约状态、是否报警）都会在每次请求时自动刷新
- **时间冲突检测**: 在创建预约时自动检测时间冲突
- **数据完整性**: 通过外键约束保证数据完整性
- **唯一性校验**: 防止重复的会议室编号、用户名、卡号等

## 文件结构

```
huiyishi-backend-exp/
├── app.js                 # 主应用入口，包含认证中间件
├── models/
│   └── db.js             # 数据库模型和初始化
├── routes/
│   ├── auth.js           # 认证路由，处理认证回调和用户信息
│   ├── index.js          # 主页路由，处理初始认证流程
│   ├── meetingRooms.js   # 会议室管理路由
│   ├── reservations.js   # 预约管理路由
│   ├── roomStatuses.js   # 状态管理路由
│   └── users.js          # 用户管理路由
├── package.json
├── README.md
├── test-api.js           # API测试脚本
├── test-auth.js          # 认证功能测试脚本
├── full-test.js          # 完整功能测试脚本
└── simulate-auth-center.js # 模拟认证中心（用于测试）
```

## 认证流程

系统使用基于Cookie的认证机制：
1. 用户访问任何受保护的路由时，系统检查是否存在用户UUID的Cookie
2. 如果不存在，重定向到 `http://127.0.0.1:8080?clientId=1234567890&redirect=...`
3. 认证中心完成认证后，回调到 `/auth/callback?username=...&userUUID=...&role=...`
4. 系统检查用户是否存在，不存在则自动创建用户
5. 将用户信息存储到Session中，并重定向回原始请求页面

## 测试

运行测试脚本验证所有功能：
```bash
node test-api.js
```

运行认证功能测试：
```bash
node test-auth.js
```

启动模拟认证中心（用于测试）：
```bash
node simulate-auth-center.js
```

## 注意事项

- 所有状态相关字段都会在每次请求时自动刷新
- 预约创建时会检查时间冲突
- 会议室删除时会同时删除相关预约
- 用户名和卡号具有唯一性约束