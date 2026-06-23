function initShiftsCalendar() {
    // Init Select2
    $('.select2-staffs').select2({
        dropdownParent: $('#shiftModal'),
        placeholder: "Chọn nhân viên...",
        allowClear: true
    });

    // Init FullCalendar
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    let currentSelectedDate = null;

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
        selectable: true,
        events: '/admin/shifts/api',
        eventContent: function(arg) {
            // Hiển thị dạng Badge đẹp mắt trên lịch
            const avatar = arg.event.extendedProps.avatar 
                ? `<img src="${arg.event.extendedProps.avatar}" class="rounded-circle me-1" style="width: 16px; height: 16px;">` 
                : `<i class="fas fa-user-circle me-1"></i>`;
            
            return {
                html: `
                    <div class="p-1 rounded text-white overflow-hidden text-truncate" style="font-size: 11px;">
                        ${avatar} ${arg.event.title}
                    </div>
                `
            };
        },
        dateClick: function(info) {
            openShiftModal(info.dateStr);
        },
        eventClick: function(info) {
            openShiftModal(info.event.startStr.split('T')[0], info.event.extendedProps.type);
        }
    });
    
    setTimeout(() => {
        calendar.render();
        window.dispatchEvent(new Event('resize'));
    }, 150);

    const shiftModalElement = document.getElementById('shiftModal');
    let shiftModal;
    if (shiftModalElement) {
        shiftModal = new bootstrap.Modal(shiftModalElement);
    }
    const shiftForm = document.getElementById('shiftForm');
    
    function openShiftModal(dateStr, type = 'morning') {
        currentSelectedDate = dateStr;
        document.getElementById('shiftDate').value = dateStr;
        
        const dateObj = new Date(dateStr);
        document.getElementById('shiftDateDisplay').textContent = `Ngày: ${dateObj.toLocaleDateString('vi-VN')}`;
        
        document.getElementById('shiftType').value = type;
        
        // Lấy danh sách staff đang được phân cho ca này trong ngày này
        loadAssignedStaffs(dateStr, type);
        
        if(shiftModal) shiftModal.show();
    }

    document.getElementById('shiftType').addEventListener('change', function(e) {
        if (currentSelectedDate) {
            loadAssignedStaffs(currentSelectedDate, e.target.value);
        }
    });

    function loadAssignedStaffs(dateStr, type) {
        // Filter events in calendar that match date and type
        const events = calendar.getEvents();
        const matchingEvents = events.filter(e => {
            const eventDate = e.startStr.split('T')[0];
            return eventDate === dateStr && e.extendedProps.type === type;
        });

        const staffIds = matchingEvents.map(e => e.extendedProps.userId);
        $('#shiftStaffs').val(staffIds).trigger('change');
    }

    if (shiftForm) {
        shiftForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const btnSave = document.getElementById('btnSaveShift');
            
            try {
                btnSave.disabled = true;
                btnSave.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang lưu...';
                
                const formData = {
                    date: document.getElementById('shiftDate').value,
                    type: document.getElementById('shiftType').value,
                    staffIds: $('#shiftStaffs').val() || []
                };

                const response = await fetch('/admin/shifts/assign', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Thành công',
                        text: 'Đã cập nhật ca làm việc',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    if(shiftModal) shiftModal.hide();
                    calendar.refetchEvents(); // Tải lại lịch
                } else {
                    Swal.fire('Lỗi', data.message, 'error');
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Lỗi', 'Đã xảy ra lỗi khi lưu ca làm', 'error');
            } finally {
                btnSave.disabled = false;
                btnSave.innerHTML = '<i class="fas fa-save me-1"></i> Lưu thay đổi';
            }
        });
    }
}

if (document.readyState === 'complete') {
    initShiftsCalendar();
} else {
    window.addEventListener('load', initShiftsCalendar);
}
