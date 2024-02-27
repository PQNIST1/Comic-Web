const Chapter = require('../models/chapter');
const comic = require('../models/comic');
const Comic = require('../models/comic');

// Tự động tăng và tự động giảm chapterNumber middleware
const autoUpdateChapterNumber = async (req, res, next) => {
    const comicId= req.body.comic;  
    try {
      // Lấy truyện dựa trên comicId
      const comic = await Comic.findById(comicId).exec();
      if (!comic) {
        return res.status(404).json({ message: 'Không tìm thấy truyện' });
      }
  
      if (req.method === 'POST') {
        // Nếu là thêm chapter mới
        const latestChapterNumber = comic.chapters.length + 1;
        req.body.chapterNumber = latestChapterNumber;
      } else if (req.method === 'PUT') {
        // Nếu là cập nhật chapter
        const chapterId = req.params.id;
        const chapter = comic.chapters.find(chap => chap._id.toString() === chapterId);
  
        if (!chapter) {
          return res.status(404).json({ message: 'Không tìm thấy chapter' });
        }
  
        req.body.chapterNumber = chapter.chapterNumber; // Giữ nguyên chapterNumber
      }
      // Lưu trạng thái mới của truyện
      await comic.save();
  
      next();
    } catch (error) {
      console.error('Lỗi khi cập nhật chapterNumber:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  };

  const decreaseChapterNumber = async (req, res, next) => {
    const chapterId = req.params.id;
  
    try {
      // Lấy chapter dựa trên chapterId
      const chapter = await Chapter.findById(chapterId).exec();
      if (!chapter) {
        return res.status(404).json({ message: 'Không tìm thấy chapter' });
      }
  
      const comicId = chapter.comic; // Lấy id của truyện từ chapter
      const chaptersToUpdate = await Chapter.find({ comic: comicId, chapterNumber: { $gt: chapter.chapterNumber } }).exec();
  
      // Giảm chapterNumber cho các chapter có chapterNumber lớn hơn chapter được xóa
      for (let i = 0; i < chaptersToUpdate.length; i++) {
        const updatedChapter = chaptersToUpdate[i];
        updatedChapter.chapterNumber--;
        await updatedChapter.save();
      }
  
      next();
    } catch (error) {
      console.error('Lỗi khi giảm chapterNumber:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
  };

  
module.exports = {
    autoUpdateChapterNumber,
    decreaseChapterNumber,
};