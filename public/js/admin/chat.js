const socket = io();
let currentRoom = null;
const adminId = document.getElementById('adminIdData') ? document.getElementById('adminIdData').value : '';

async function openChat(room, customerName) {
    currentRoom = room;
    
    // Highlight active item
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.chat-item[data-room="${room}"]`).classList.add('active');

    // Hide badge
    const badge = document.getElementById(`badge-${room}`);
    if(badge) badge.classList.add('d-none');

    // Show UI
    document.getElementById('no-chat-selected').classList.add('d-none');
    document.getElementById('chat-header').style.setProperty('display', 'flex', 'important');
    document.getElementById('chat-messages').classList.remove('d-none');
    document.getElementById('chat-input-area').classList.remove('d-none');
    document.getElementById('current-chat-name').textContent = customerName;

    // Fetch history
    const customerId = room.replace('chat_', '');
    try {
        const res = await fetch(`/chat/admin/history/${customerId}`);
        const data = await res.json();
        
        const msgContainer = document.getElementById('chat-messages');
        msgContainer.innerHTML = '';
        
        if (data.success) {
            data.history.forEach(msg => {
                const isSentByMe = (msg.sender._id === adminId || msg.sender.role === 'admin' || msg.sender.role === 'staff');
                appendMessage(msg.content, isSentByMe);
            });
            scrollToBottom();
        }
    } catch (error) {
        console.error('Lỗi tải tin nhắn', error);
    }

    // Báo cho socket biết admin đang xem room này
    socket.emit('join_chat', { customerId });
}

function appendMessage(text, isSent) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message-bubble ${isSent ? 'msg-sent' : 'msg-received'}`;
    div.textContent = text;
    container.appendChild(div);
}

function scrollToBottom() {
    const c = document.getElementById('chat-messages');
    c.scrollTop = c.scrollHeight;
}

document.getElementById('admin-chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('admin-chat-input');
    const text = input.value.trim();
    if (!text || !currentRoom) return;

    socket.emit('send_message', { room: currentRoom, content: text });
    input.value = '';
});

socket.on('receive_message', (msg) => {
    // Chỉ thêm vào cửa sổ chat nếu đang mở đúng phòng
    if (currentRoom === msg.room) {
        const isSentByMe = (msg.sender._id === adminId || msg.sender.role === 'admin' || msg.sender.role === 'staff');
        appendMessage(msg.content, isSentByMe);
        scrollToBottom();
    }

    // Cập nhật lại sidebar tin nhắn mới nhất
    const lastMsgEl = document.getElementById(`lastmsg-${msg.room}`);
    if(lastMsgEl) lastMsgEl.textContent = msg.content;

    // Nếu admin đang không xem phòng đó, hiện chấm đỏ
    if (currentRoom !== msg.room && msg.sender.role === 'customer') {
        const badge = document.getElementById(`badge-${msg.room}`);
        if(badge) badge.classList.remove('d-none');
        
        // Di chuyển chat item lên đầu
        const chatItem = document.querySelector(`.chat-item[data-room="${msg.room}"]`);
        if (chatItem) {
            document.getElementById('customer-list').prepend(chatItem);
        }
    }
});

// Lắng nghe notification từ khách mới chưa có trong danh sách
socket.on('new_message_notification', (data) => {
    // Nếu đã có item trong sidebar thì receive_message đã lo
    if (!document.querySelector(`.chat-item[data-room="${data.room}"]`)) {
        // Tải lại trang cho đơn giản để render lại danh sách
        window.location.reload();
    }
});
