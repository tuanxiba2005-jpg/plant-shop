const Address = require('../models/Address');

class AddressController {
    constructor() {
        this.addressModel = new Address();
        this.list         = this.list.bind(this);
        this.add          = this.add.bind(this);
        this.update       = this.update.bind(this);
        this.delete       = this.delete.bind(this);
        this.setDefault   = this.setDefault.bind(this);
    }

    // GET /user/addresses → trả về danh sách địa chỉ (JSON, dùng cho fetch)
    async list(req, res) {
        try {
            const addresses = await this.addressModel.getByUser(req.session.user.id);
            res.json({ success: true, addresses });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    // POST /user/addresses → thêm địa chỉ mới
    async add(req, res) {
        try {
            const { name, phone, address, isDefault } = req.body;

            if (!name || !phone || !address) {
                return res.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
            }

            const newAddr = await this.addressModel.addAddress(req.session.user.id, {
                name,
                phone,
                address,
                isDefault: isDefault === 'true' || isDefault === true
            });

            res.json({ success: true, address: newAddr });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    // POST /user/addresses/:id/update → cập nhật địa chỉ
    async update(req, res) {
        try {
            const { name, phone, address, isDefault } = req.body;

            if (!name || !phone || !address) {
                return res.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
            }

            const updated = await this.addressModel.updateAddress(
                req.params.id,
                req.session.user.id,
                { name, phone, address, isDefault: isDefault === 'true' || isDefault === true }
            );

            if (!updated) return res.json({ success: false, message: 'Không tìm thấy địa chỉ' });
            res.json({ success: true, address: updated });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    // DELETE /user/addresses/:id → xóa địa chỉ
    async delete(req, res) {
        try {
            const deleted = await this.addressModel.deleteAddress(
                req.params.id,
                req.session.user.id
            );
            if (!deleted) return res.json({ success: false, message: 'Không tìm thấy địa chỉ' });
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }

    // POST /user/addresses/:id/default → đặt làm mặc định
    async setDefault(req, res) {
        try {
            const updated = await this.addressModel.setDefault(
                req.params.id,
                req.session.user.id
            );
            if (!updated) return res.json({ success: false, message: 'Không tìm thấy địa chỉ' });
            res.json({ success: true });
        } catch (err) {
            res.json({ success: false, message: err.message });
        }
    }
}

module.exports = new AddressController();
