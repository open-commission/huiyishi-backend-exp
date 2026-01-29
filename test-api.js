const axios = require('axios');

// API base URL
const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('开始测试会议室设备管理和预约系统API...\n');
  
  try {
    // 测试会议室管理API
    console.log('=== 测试会议室管理功能 ===');
    
    // 1. 添加会议室
    console.log('1. 添加会议室...');
    const newRoom = {
      room_number: 'RM001',
      room_name: '大会议室',
      available_time_slots: [
        { start_time: '2026-02-01T09:00:00', end_time: '2026-02-01T11:00:00' },
        { start_time: '2026-02-01T14:00:00', end_time: '2026-02-01T16:00:00' }
      ]
    };
    
    const roomResponse = await axios.post(`${BASE_URL}/meeting-rooms`, newRoom);
    console.log('会议室添加成功:', roomResponse.data);
    const roomId = roomResponse.data.id;
    
    // 2. 查询所有会议室
    console.log('\n2. 查询所有会议室...');
    const allRoomsResponse = await axios.get(`${BASE_URL}/meeting-rooms`);
    console.log('会议室列表:', allRoomsResponse.data);
    
    // 3. 查询单个会议室
    console.log('\n3. 查询单个会议室...');
    const singleRoomResponse = await axios.get(`${BASE_URL}/meeting-rooms/${roomId}`);
    console.log('单个会议室信息:', singleRoomResponse.data);
    
    // 测试用户管理API
    console.log('\n=== 测试会议人员管理功能 ===');
    
    // 1. 添加用户
    console.log('1. 添加用户...');
    const newUser = {
      username: 'zhangsan',
      nickname: '张三',
      card_number: 'CARD001',
      role: '管理员'
    };
    
    const userResponse = await axios.post(`${BASE_URL}/users`, newUser);
    console.log('用户添加成功:', userResponse.data);
    const userId = userResponse.data.id;
    
    // 2. 查询所有用户
    console.log('\n2. 查询所有用户...');
    const allUsersResponse = await axios.get(`${BASE_URL}/users`);
    console.log('用户列表:', allUsersResponse.data);
    
    // 3. 查询单个用户
    console.log('\n3. 查询单个用户...');
    const singleUserResponse = await axios.get(`${BASE_URL}/users/${userId}`);
    console.log('单个用户信息:', singleUserResponse.data);
    
    // 测试预约管理API
    console.log('\n=== 测试预约管理功能 ===');
    
    // 1. 添加预约
    console.log('1. 添加预约...');
    const newReservation = {
      room_id: roomId,
      room_number: 'RM001',
      room_name: '大会议室',
      participants_count: 5,
      core_member: 'zhangsan',
      start_time: '2026-02-01T10:00:00',
      end_time: '2026-02-01T11:00:00',
      check_in_method: '线上',
      core_member_check_in_status: false
    };
    
    const reservationResponse = await axios.post(`${BASE_URL}/reservations`, newReservation);
    console.log('预约添加成功:', reservationResponse.data);
    const reservationId = reservationResponse.data.id;
    
    // 2. 查询所有预约
    console.log('\n2. 查询所有预约...');
    const allReservationsResponse = await axios.get(`${BASE_URL}/reservations`);
    console.log('预约列表:', allReservationsResponse.data);
    
    // 3. 查询单个预约
    console.log('\n3. 查询单个预约...');
    const singleReservationResponse = await axios.get(`${BASE_URL}/reservations/${reservationId}`);
    console.log('单个预约信息:', singleReservationResponse.data);
    
    // 测试会议室状态管理API
    console.log('\n=== 测试会议室状态管理功能 ===');
    
    // 1. 添加状态
    console.log('1. 添加会议室状态...');
    const newStatus = {
      room_id: roomId,
      room_number: 'RM001',
      status_name: '温度',
      status_value: '24°C',
      threshold_value: '22-26°C',
      is_alarm_status: false
    };
    
    const statusResponse = await axios.post(`${BASE_URL}/room-statuses`, newStatus);
    console.log('状态添加成功:', statusResponse.data);
    const statusId = statusResponse.data.id;
    
    // 2. 查询所有状态
    console.log('\n2. 查询所有状态...');
    const allStatusesResponse = await axios.get(`${BASE_URL}/room-statuses`);
    console.log('状态列表:', allStatusesResponse.data);
    
    // 3. 查询单个状态
    console.log('\n3. 查询单个状态...');
    const singleStatusResponse = await axios.get(`${BASE_URL}/room-statuses/${statusId}`);
    console.log('单个状态信息:', singleStatusResponse.data);
    
    console.log('\n=== 所有API测试完成 ===');
    
  } catch (error) {
    console.error('测试过程中出现错误:', error.response?.data || error.message);
  }
}

// 运行测试
testAPI();