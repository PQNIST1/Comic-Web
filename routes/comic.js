const express = require('express');
const router = express.Router();
const comicController = require('../controllers/comic_controller');

// Thêm một truyện mới
router.post('/', comicController.createComic);

// Sửa thông tin của một truyện
router.put('/:id', comicController.updateComic);

// Xóa một truyện
router.delete('/:id', comicController.deleteComic);

// Lấy thông tin của một truyện
router.get('/:id', comicController.getComicById);

// Lấy danh sách tất cả các truyện
router.get('/', comicController.getAllComics);

module.exports = router;
