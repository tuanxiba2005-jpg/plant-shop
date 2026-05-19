class ErrorMiddleware {

    // Bắt lỗi 404 - không tìm thấy route
    notFound(req, res, next) {
        const error = new Error(`Không tìm thấy trang: ${req.originalUrl}`);
        error.status = 404;
        next(error); // chuyển sang errorHandler
    }

    // Xử lý tất cả lỗi
    errorHandler(err, req, res, next) {
        const statusCode = err.status || 500;
        const message = err.message || 'Lỗi server không xác định';

        console.error(`[ERROR ${statusCode}] ${message}`);
        console.error(err.stack);

        // Nếu là API request thì trả JSON
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(statusCode).json({
                success: false,
                message,
                status: statusCode
            });
        }

        // Nếu là trang web thì render view lỗi
        res.status(statusCode).render('error', {
            title: `Lỗi ${statusCode}`,
            message,
            status: statusCode
        });
    }
}

module.exports = new ErrorMiddleware();