const Chapter = require('../models/chapter');
var Comic = require('../models/comic');

// Thêm một truyện mới
const createComic = async (req, res) => {
  try {
    const newComic = new Comic(req.body);
    const savedComic = await newComic.save();
    res.status(201).json({ message: 'Truyện đã được thêm thành công!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi thêm truyện mới!' });
  }
};

// Sửa thông tin của một truyện
const updateComic = async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id);
    await comic.updateOne({$set: req.body});
    if (!comic) {
      return res.status(404).json({ error: 'Không tìm thấy truyện!' });
    }
    res.status(200).json({ message: 'Thông tin truyện đã được cập nhật!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi cập nhật thông tin truyện!' });
  }
};

// Xóa một truyện
const deleteComic = async (req, res) => {
  try {
    await Chapter.updateMany(
      {comic: req.params.id},
      {comic: null}
    )
    const deletedComic = await Comic.findByIdAndDelete(req.params.id);
    if (!deletedComic) {
      return res.status(404).json({ error: 'Không tìm thấy truyện!' });
    }
    res.status(200).json({ message: 'Truyện đã được xóa!' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa truyện!' });
  }
};

// Lấy thông tin của một truyện
const getComicById = async (req, res) => {
  try {
    const comic = await Comic.findById(req.params.id).populate("chapters");
    if (!comic) {
      return res.status(404).json({ error: 'Không tìm thấy truyện!' });
    }
    res.status(200).json(comic);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy thông tin truyện!' });
  }
};

// Lấy danh sách tất cả các truyện
const getAllComics = async (req, res) => {
  try {
    const comics = await Comic.find();
    res.status(200).json(comics);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách truyện!' });
  }
};

module.exports = {
  createComic,
  updateComic,
  deleteComic,
  getComicById,
  getAllComics,
};
