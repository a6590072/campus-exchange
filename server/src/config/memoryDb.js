/**
 * 内存数据库 - 用于开发和演示
 * 当 PostgreSQL 不可用时使用
 */

class MemoryDB {
  constructor() {
    this.users = new Map();
    this.items = new Map();
    this.exchanges = new Map();
    this.messages = new Map();
    this.idCounters = {
      users: 1,
      items: 1,
      exchanges: 1,
      messages: 1
    };
    console.log('✅ 内存数据库已初始化');
  }

  // 用户操作
  async findUserByOpenid(openid) {
    for (const user of this.users.values()) {
      if (user.openid === openid) {
        return user;
      }
    }
    return null;
  }

  async createUser(userData) {
    const id = this.idCounters.users++;
    const user = {
      id,
      ...userData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id, data) {
    const user = this.users.get(id);
    if (user) {
      Object.assign(user, data, { updated_at: new Date() });
      return user;
    }
    return null;
  }

  async findUserById(id) {
    return this.users.get(id) || null;
  }

  // 物品操作
  async createItem(itemData) {
    const id = this.idCounters.items++;
    const item = {
      id,
      ...itemData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.items.set(id, item);
    return item;
  }

  async findItemById(id) {
    return this.items.get(id) || null;
  }

  async findItems(filters = {}) {
    let items = Array.from(this.items.values());
    
    if (filters.status) {
      items = items.filter(item => item.status === filters.status);
    }
    if (filters.category) {
      items = items.filter(item => item.category === filters.category);
    }
    if (filters.user_id) {
      items = items.filter(item => item.user_id === filters.user_id);
    }
    
    return items.sort((a, b) => b.created_at - a.created_at);
  }

  async updateItem(id, data) {
    const item = this.items.get(id);
    if (item) {
      Object.assign(item, data, { updated_at: new Date() });
      return item;
    }
    return null;
  }

  // 交换操作
  async createExchange(exchangeData) {
    const id = this.idCounters.exchanges++;
    const exchange = {
      id,
      ...exchangeData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.exchanges.set(id, exchange);
    return exchange;
  }

  async findExchangesByUser(userId) {
    return Array.from(this.exchanges.values())
      .filter(e => e.requester_id === userId || e.owner_id === userId)
      .sort((a, b) => b.created_at - a.created_at);
  }

  // 消息操作
  async createMessage(messageData) {
    const id = this.idCounters.messages++;
    const message = {
      id,
      ...messageData,
      created_at: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  async findMessagesByUser(userId) {
    return Array.from(this.messages.values())
      .filter(m => m.sender_id === userId || m.receiver_id === userId)
      .sort((a, b) => b.created_at - a.created_at);
  }

  // 统计数据
  async getStats() {
    return {
      total_users: this.users.size,
      total_items: this.items.size,
      total_exchanges: this.exchanges.size,
      active_items: Array.from(this.items.values()).filter(i => i.status === 'active').length
    };
  }
}

// 单例模式
const memoryDB = new MemoryDB();

module.exports = memoryDB;
