document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    let currentShiftId = null;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'vi',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        buttonText: {
            today: 'Hôm nay',
            month: 'Tháng',
            week: 'Tuần'
        },
        events: '/staff/shifts/api',
        eventContent: function(arg) {
            const isCheckIn = !!arg.event.extendedProps.checkIn;
            const isCheckOut = !!arg.event.extendedProps.checkOut;
            
            let icon = '<i class="far fa-clock"></i>';
            if (isCheckIn && !isCheckOut) icon = '<i class="fas fa-running"></i>';
            if (isCheckOut) icon = '<i class="fas fa-check-circle"></i>';

            return {
                html: `
                    <div class="p-1 rounded text-white overflow-hidden text-truncate" style="font-size: 12px; cursor: pointer;">
                        ${icon} ${arg.event.title}
                    </div>
                `
            };
        },
        eventClick: function(info) {
            openAttendanceModal(info.event);
        }
    });
    
    calendar.render();

    const attendanceModalElement = document.getElementById('attendanceModal');
    let attendanceModal;
    if (attendanceModalElement) {
        attendanceModal = new bootstrap.Modal(attendanceModalElement);
    }
    
    function formatTime(dateStr) {
        if (!dateStr) return '--:--';
        return moment(dateStr).format('HH:mm:ss');
    }

    function openAttendanceModal(event) {
        currentShiftId = event.id;
        
        document.getElementById('attShiftTitle').textContent = event.title;
        document.getElementById('attShiftTime').textContent = `${moment(event.start).format('DD/MM/YYYY')} | ${event.extendedProps.time}`;
        
        document.getElementById('attCheckInTime').textContent = formatTime(event.extendedProps.checkIn);
        document.getElementById('attCheckOutTime').textContent = formatTime(event.extendedProps.checkOut);

        const btnCheckIn = document.getElementById('btnCheckIn');
        const btnCheckOut = document.getElementById('btnCheckOut');

        // Hiển thị/ẩn nút tùy trạng thái
        if (!event.extendedProps.checkIn) {
            btnCheckIn.style.display = 'block';
            btnCheckOut.style.display = 'none';
        } else if (!event.extendedProps.checkOut) {
            btnCheckIn.style.display = 'none';
            btnCheckOut.style.display = 'block';
        } else {
            btnCheckIn.style.display = 'none';
            btnCheckOut.style.display = 'none'; // Đã điểm danh xong
        }

        if(attendanceModal) attendanceModal.show();
    }

    async function processAttendance(type) {
        if (!currentShiftId) return;
        
        try {
            const response = await fetch(`/staff/shifts/${currentShiftId}/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Thành công',
                    text: data.message,
                    timer: 1500,
                    showConfirmButton: false
                });
                if(attendanceModal) attendanceModal.hide();
                calendar.refetchEvents();
            } else {
                Swal.fire('Lỗi', data.message, 'error');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Lỗi', 'Đã xảy ra lỗi hệ thống', 'error');
        }
    }

    const btnCheckIn = document.getElementById('btnCheckIn');
    if (btnCheckIn) {
        btnCheckIn.addEventListener('click', () => processAttendance('checkin'));
    }
    const btnCheckOut = document.getElementById('btnCheckOut');
    if (btnCheckOut) {
        btnCheckOut.addEventListener('click', () => processAttendance('checkout'));
    }
});
