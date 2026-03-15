const app = getApp();

Page({
  data: {
    messages: [
      {
        type: 'ai',
        content: '你好！我是物的第二站的AI助手🤖\n\n我可以帮你：\n• 解答平台使用问题\n• 提供交换建议\n• 回答交易相关问题\n\n有什么可以帮你的吗？'
      }
    ],
    inputText: '',
    isTyping: false,
    quickQuestions: [
      '如何发布物品？',
      '怎么进行交换？',
      '交换安全吗？',
      '如何认证学生身份？',
      '什么物品不能交换？'
    ],
    scrollToMessage: ''
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: 'AI智能助手'
    });
  },

  onInputChange(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  // 发送消息 - 流式回复
  async sendMessage() {
    const { inputText, messages } = this.data;

    if (!inputText.trim()) return;

    // 添加用户消息
    const userMessage = {
      type: 'user',
      content: inputText
    };

    // 添加空的AI消息占位
    const aiMessage = {
      type: 'ai',
      content: ''
    };

    const newMessages = [...messages, userMessage, aiMessage];
    const aiMessageIndex = newMessages.length - 1;

    this.setData({
      messages: newMessages,
      inputText: '',
      isTyping: true
    });

    this.scrollToBottom();

    try {
      // 使用 wx.request 请求流式响应
      const requestTask = wx.request({
        url: `${app.globalData.apiBaseUrl}/ai/customer-service`,
        method: 'POST',
        data: { 
          question: inputText,
          stream: true // 请求流式响应
        },
        enableChunked: true, // 启用分块传输
        success: (res) => {
          console.log('AI客服响应:', res);
          // 处理非流式响应的兜底
          if (res.data && res.data.success && res.data.data) {
            this.streamText(res.data.data.answer, aiMessageIndex);
          }
        },
        fail: (error) => {
          console.error('AI客服请求失败:', error);
          this.updateMessage(aiMessageIndex, '网络连接失败，请检查网络后重试。');
          this.setData({ isTyping: false });
        }
      });

      // 监听分块数据
      let fullText = '';
      requestTask.onChunkReceived((res) => {
        const chunk = res.data;
        console.log('收到数据块:', chunk);
        
        // 解析 SSE 格式的数据
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                fullText += data.chunk;
                this.updateMessage(aiMessageIndex, fullText);
                this.scrollToBottom();
              }
              if (data.done) {
                this.setData({ isTyping: false });
              }
              if (data.error) {
                this.updateMessage(aiMessageIndex, '抱歉，服务暂时不可用，请稍后再试。');
                this.setData({ isTyping: false });
              }
            } catch (e) {
              console.error('解析数据块失败:', e);
            }
          }
        }
      });

    } catch (error) {
      console.error('发送消息失败:', error);
      this.updateMessage(aiMessageIndex, '抱歉，我暂时无法回答这个问题，请稍后再试。');
      this.setData({ isTyping: false });
    }
  },

  // 流式显示文字效果
  streamText(fullText, messageIndex) {
    const chars = fullText.split('');
    let currentIndex = 0;
    let currentText = '';

    const streamInterval = setInterval(() => {
      if (currentIndex < chars.length) {
        currentText += chars[currentIndex];
        this.updateMessage(messageIndex, currentText);
        currentIndex++;

        // 每添加10个字符滚动一次
        if (currentIndex % 10 === 0) {
          this.scrollToBottom();
        }
      } else {
        clearInterval(streamInterval);
        this.setData({ isTyping: false });
        this.scrollToBottom();
      }
    }, 30); // 每30ms添加一个字符，可根据需要调整速度
  },

  // 更新指定索引的消息内容
  updateMessage(index, content) {
    const messages = this.data.messages;
    messages[index].content = content;
    this.setData({ messages });
  },

  // 快捷问题
  sendQuickQuestion(e) {
    const question = e.currentTarget.dataset.question;
    this.setData({ inputText: question });
    this.sendMessage();
  },

  // 滚动到底部
  scrollToBottom() {
    this.setData({
      scrollToMessage: 'msg-bottom'
    });
  },

  // 语音输入（预留）
  startVoiceInput() {
    wx.showToast({
      title: '语音功能开发中',
      icon: 'none'
    });
  }
});
