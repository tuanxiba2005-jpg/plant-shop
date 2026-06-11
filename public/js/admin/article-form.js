$(document).ready(function() {
    // Initialize Summernote Lite editor
    $('#editor').summernote({
        height: 400,
        placeholder: 'Bắt đầu viết nội dung bài viết tại đây...',
        toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['fontsize', ['fontsize']],
            ['color', ['forecolor', 'backcolor']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['height', ['height']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video', 'hr']],
            ['view', ['fullscreen', 'codeview', 'help']]
        ],
        fontSizes: ['8','10','11','12','14','16','18','20','24','28','32','36'],
        callbacks: {
            onChange: function(contents) {
                $(this).val(contents);
            }
        }
    });

    // Handle form submit
    $('#articleForm').on('submit', function(e) {
        var content = $('#editor').summernote('code');
        if (!content || content.trim() === '' || content.trim() === '<p><br></p>') {
            e.preventDefault();
            alert('Vui lòng nhập nội dung bài viết!');
            return false;
        }
    });

    // Auto generate Slug from title
    $('#title').on('keyup', function() {
        var title = $(this).val();
        var slug = title.toLowerCase();
        slug = slug.replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a');
        slug = slug.replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e');
        slug = slug.replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i');
        slug = slug.replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o');
        slug = slug.replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u');
        slug = slug.replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y');
        slug = slug.replace(/đ/gi, 'd');
        slug = slug.replace(/[`~!@#|$%^&*()+=,.\/?>< '":;_]/gi, '');
        slug = slug.replace(/ /gi, '-');
        slug = slug.replace(/-{2,}/gi, '-');
        slug = slug.replace(/^-|-$/gi, '');
        $('#slug').val(slug);
    });

    // Handle image preview
    $('#imageInput').on('change', function() {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                $('#imgPreview').attr('src', e.target.result);
            }
            reader.readAsDataURL(this.files[0]);
        }
    });
});
