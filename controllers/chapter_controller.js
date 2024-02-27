const Chapter = require('../models/chapter');
const Comic = require('../models/comic');

// Thêm một chapter mới
const createChapter = async (req, res) => {
  try {
    const newChapter = new Chapter(req.body);
    const savedChapter = await newChapter.save();
    if(req.body.comic) {
      const comic = Comic.findById(req.body.comic);
      await comic.updateOne({$push: {chapters: savedChapter._id}, lastChapterAddedAt: new Date() })
    }
    res.status(201).json({ message: 'Chapter đã được thêm thành công!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm chapter mới!' });
  }
};

// Sửa thông tin của một chapter
const updateChapter = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    await chapter.updateOne({$set: req.body});
    if (!chapter) {
      return res.status(404).json({ error: 'Không tìm thấy chapter!' });
    }
    res.status(200).json({ message: 'Thông tin chapter đã được cập nhật!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật thông tin chapter!' });
  }
};

// Xóa một chapter
const deleteChapter = async (req, res) => {
  try {
    await Comic.updateMany(
      {chapters: req.params.id},
      {$pull:{chapters:req.params.id}}
  );
    const deletedChapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!deletedChapter) {
      return res.status(404).json({ error: 'Không tìm thấy chapter!' });
    }
    res.status(200).json({ message: 'Chapter đã được xóa!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa chapter!' });
  }
};


// Lấy thông tin của một chapter
const getChapterById = async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ error: 'Không tìm thấy chapter!' });
    }
    res.status(200).json(chapter);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy thông tin chapter!' });
  }
};

// Lấy danh sách tất cả các chapter
const getAllChapters = async (req, res) => {
  try {
    const chapters = await Chapter.find();
    res.status(200).json(chapters);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách chapter!' });
  }
};

module.exports = {
  createChapter,
  updateChapter,
  deleteChapter,
  getChapterById,
  getAllChapters,
};
