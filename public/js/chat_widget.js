document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('chat-toggle-btn');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('chat-close-btn');
    const chatBadge = document.getElementById('chat-badge');
    const chatBody = document.getElementById('chat-body');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    if (!toggleBtn || typeof currentUser === 'undefined' || !currentUser) return;

    let isChatOpen = false;
    let historyLoaded = false;
    let unreadCount = 0;

    // Lấy socket từ realtime.js hoặc tạo mới nếu chưa có
    const chatSocket = (typeof socket !== 'undefined') ? socket : io();

    // Toggle chat window
    toggleBtn.addEventListener('click', () => {
        isChatOpen = !isChatOpen;
        if (isChatOpen) {
            chatWindow.classList.remove('d-none');
            chatBadge.style.display = 'none';
            unreadCount = 0;
            if (!historyLoaded) loadHistory();
            scrollToBottom();
        } else {
            chatWindow.classList.add('d-none');
        }
    });

    closeBtn.addEventListener('click', () => {
        isChatOpen = false;
        chatWindow.classList.add('d-none');
    });

    // Load lịch sử
    async function loadHistory() {
        try {
            const res = await fetch('/chat/history');
            const data = await res.json();
            if (data.success && data.history.length > 0) {
                chatBody.innerHTML = '';
                data.history.forEach(msg => {
                    appendMessage(msg.content, msg.sender._id === currentUser.id);
                });
                scrollToBottom();
            }
            historyLoaded = true;
        } catch (e) {
            console.error('Lỗi tải lịch sử chat', e);
        }
    }

    function appendMessage(text, isSent) {
        const div = document.createElement('div');
        div.className = `chat-msg ${isSent ? 'sent' : 'received'}`;
        div.textContent = text;
        chatBody.appendChild(div);
    }

    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Gửi tin nhắn
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        chatSocket.emit('send_message', { content: text });
        chatInput.value = '';
    });

    // Lắng nghe tin nhắn tới
    chatSocket.on('receive_message', (msg) => {
        // Chỉ xử lý nếu không phải trên trang admin chat (trang admin có xử lý riêng)
        if (window.location.pathname.startsWith('/admin/chat')) return;
        
        appendMessage(msg.content, msg.sender._id === currentUser.id);
        
        if (!isChatOpen) {
            unreadCount++;
            chatBadge.textContent = unreadCount;
            chatBadge.style.display = 'block';
            if (typeof showToast === 'function' && msg.sender._id !== currentUser.id) {
                showToast('Bạn có tin nhắn mới từ Hỗ trợ!', 'info');
            }
        } else {
            scrollToBottom();
        }
    });
});
