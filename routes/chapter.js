const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapter_controller');
const autoMiddleware = require('../middware/auto');

// Thêm một chương truyện mới
router.post('/', autoMiddleware.autoUpdateChapterNumber, chapterController.createChapter);
// Sửa thông tin một chương của một truyện
router.put('/:id', chapterController.updateChapter);
// Xóa một chương truyện
router.delete('/:id', autoMiddleware.decreaseChapterNumber, chapterController.deleteChapter);
// Lấy thông tin của một chương truyện
router.get('/:id', chapterController.getChapterById);
// Lấy danh sách tất cả các chương truyện
router.get('/', chapterController.getAllChapters);

module.exports = router;