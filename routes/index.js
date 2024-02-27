var express = require('express');
const mongoose = require('mongoose');
var User = require('../models/user');
var Comic = require('../models/comic');
var Chapter = require('../models/chapter');
const Rating = require('../models/rating');
const Comment = require('../models/comment');
const bcrypt = require('bcrypt');

var router = express.Router();
var sessionCtrl = require('../controllers/session_controller');
var sessionStrl = require('../controllers/register_controller');
var sessionVtrl = require('../controllers/info_controller');
var middwareSession = require('../middware/redirect_home');
const { populate } = require('../models/chapter');
const { param } = require('jquery');
const chapter = require('../models/chapter');





// get home page
router.get('/', async function(req, res, next) {
  // lấy url trước đó
  req.session.returnTo = req.originalUrl;
  const user = await User.findById(req.session.userId);
  const userTitle = user ? user.toJSON() : null;
  // Kiểm tra xem có lịch sử đọc hay không
  const readingHistory = req.session.readingHistory;
  let comicList = [];
  let comicss = [];
  if (user) {
    const users = await User.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(req.session.userId) } },
      { $project: { followedComics: 1 } },
      { $unwind: "$followedComics" },
      { $sort: { "followedComics.createdAt": -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "comics",
          localField: "followedComics.comic",
          foreignField: "_id",
          as: "followedComics.comic"
        }
      },
      { $unwind: "$followedComics.comic" },
      {
        $lookup: {
          from: "chapters",
          localField: "followedComics.comic.chapters",
          foreignField: "_id",
          as: "followedComics.comic.chapters"
        }
      },
      {
        $group: {
          _id: "$_id",
          followedComics: { $push: "$followedComics" }
        }
      }
    ]);

    if (users && users.length > 0) {
      comicss = users[0].followedComics;
    }
    

    // Lấy thông tin lịch sử đọc từ người dùng
  const userReadingHistory = user.readingHistory || [];

  // Sắp xếp lịch sử đọc theo thời gian tạo (createdAt)
  userReadingHistory.sort((a, b) => {
    return new Date(b.lastReadAt) - new Date(a.lastReadAt);
  });
  // Lấy danh sách truyện từ lịch sử đọc, tối đa 5 truyện
   comicList = await Promise.all(
    userReadingHistory.slice(0, 5).map(async (historyItem) => {
      // Truy vấn thông tin truyện và chương từ cơ sở dữ liệu
      const comic = await Comic.findById(historyItem.comic).populate("chapters").exec();
      const chapter = await Chapter.findById(historyItem.chapter).exec();

      // Trả về đối tượng truyện với thông tin ảnh, tên truyện, chương đọc gần nhất
      return {
        comicId: comic._id,
        lastReadChapter: chapter._id,
        chapterNumber: chapter.chapterNumber,
        image: comic.image, // Thêm thông tin ảnh truyện
        name: comic.name, // Thêm thông tin tên truyện
      };
    })
   
  );
  // Kiểm tra nếu có truyện mới được thêm
  const isComicAdded = comicList.some((comic) => {
    const comicAddedTime = comic.lastReadAt;
    return comicAddedTime > user.createdAt;
  });

  // Cập nhật lại thứ tự sắp xếp của lịch sử đọc nếu có truyện mới
  if (isComicAdded) {
    comicList.sort((a, b) => {
      return new Date(b.lastReadAt) - new Date(a.lastReadAt);
    });
  }
  } else {
    if (readingHistory) {
      // Sắp xếp lịch sử đọc theo thời gian từ mới đến cũ
      const sortedHistory = Object.entries(readingHistory).sort((a, b) => b[1].timestamp - a[1].timestamp);
  
      // Lấy danh sách truyện từ lịch sử đọc, tối đa 5 truyện
      comicList = await Promise.all(
        sortedHistory.slice(0, 5).map(async ([comicId, history]) => {
          // Truy vấn truyện từ cơ sở dữ liệu
          const comic = await Comic.findById(comicId).populate("chapters").exec();
  
          // Trả về đối tượng truyện với thông tin ảnh, tên truyện, chương đọc gần nhất
          return {
            comicId,
            lastReadChapter: history.lastReadChapter,
            chapterNumber: history.chapterNumber,
            image: comic.image, // Thêm thông tin ảnh truyện
            name: comic.name, // Thêm thông tin tên truyện
          };
        })
      );
  
      // Cập nhật thứ tự sắp xếp của lịch sử đọc
      req.session.readingHistory = Object.fromEntries(sortedHistory);
    }
  }
  
  

  const comics = await Comic.find({ lastChapterAddedAt: { $ne: null } })
    .sort({ lastChapterAddedAt: -1 })
    .limit(30)
    .populate("chapters")
    .exec();

  const comicsView = await Comic.find({})
    .sort({ views: -1 })
    .limit(12)
    .populate("chapters")
    .exec();
  const comicsNew = await Comic.find({})
    .sort({ createdAt: -1 })
    .limit(12)
    .populate("chapters")
    .exec(); 
  res.render('home', { comics, comicsView, comicsNew, comicList, user, comicss});
});

// get comic
router.get('/comic/:id', async function(req, res, next){
  req.session.returnTo = req.originalUrl;
  var id = req.params.id;
  const user = await User.findById(req.session.userId);
  const comments = await Comment.find({ comic: id }).populate("comic").populate("user").populate('chapter') .populate({ path: 'childComment', populate: { path: 'user' }, options: { sort: { createdAt: -1 } } }).sort({ createdAt: -1 }).exec();
  const ecmt = comments.map(comment => comment.toJSON());
  const existingRating = await Rating.findOne({ user: user, comic: req.params.id });
  const exist = existingRating ? existingRating.toJSON() : null;
  const userTitle = user ? user.toJSON() : null;
  let isFollowing = false; // Initialize isFollowing as false by default
  const ratingInfo = await Rating.aggregate([
    { $match: { comic: mongoose.Types.ObjectId(id) } },
    { $group: { _id: null, count: { $sum: 1 }, average: { $avg: '$rating' } } }
  ]);

  const result = ratingInfo.length > 0 ? ratingInfo[0] : { count: 0, average: 0 };
  if (user) {
    const user = await User.findById(req.session.userId).populate('followedComics.comic');
    isFollowing = user.followedComics.some((followedComic) => followedComic.comic._id.equals(id));
  }
  if (!req.session.readingHistory && !user && !isFollowing){
    const comic = await Comic.findById(id).populate("chapters").exec();
    const history = null;
    const chapterNumber = 0;
    res.render('comic',{comic, history, chapterNumber, user, isFollowing, exist, userTitle, result, comments, ecmt});
  } else {
    let history = null;
    let chapterNumber = 0;
    const comic = await Comic.findById(id).populate("chapters").exec();
    if (user) { 
       history = user.readingHistory.find(item => item.comic.toString() === id);
       if (history) {
        const comic = await Comic.findById(history.comic).populate("chapters").exec();
        const chapter = await Chapter.findById(history.chapter).exec();
        chapterNumber = chapter ? chapter.chapterNumber : 0;
      } 
    } else {
        history = req.session.readingHistory[id]
        chapterNumber = history ? history.chapterNumber : 0;
    }
    res.render('comic',{comic, history, chapterNumber, user, isFollowing, exist, userTitle, result, comments, ecmt});
}
});
//get chapter
router.get('/comic/chapter/:id', async function(req, res, next){
  req.session.returnTo = req.originalUrl;
  var id = req.params.id; //Lấy chapterId từ đường dẫn
  const chapter = await Chapter.findById(id).populate("comic").exec();
  const comic = await Comic.findById(chapter.comic.id).populate("chapters").exec();
  const comicId = comic.id;
  const comments = await Comment.find({ comic: comicId }).populate("comic").populate("user").populate('chapter') .populate({ path: 'childComment', populate: { path: 'user' }, options: { sort: { createdAt: -1 } } }).sort({ createdAt: -1 }).exec();
  const ecmt = comments.map(comment => comment.toJSON());
    // Lấy thông tin truyện của chương
  const idComic = chapter.comic._id;
  // Tìm và lấy người dùng từ cơ sở dữ liệu bằng ID của người dùng
  const user = await User.findById(req.session.userId)
  const userTitle = user ? user.toJSON() : null;
  if (user) {
   // Kiểm tra xem comicId đã tồn tại trong lịch sử đọc hay chưa
   const existingHistoryItem = user.readingHistory.find(item => item.comic.toString() === comicId);

   if (existingHistoryItem) {
     // Nếu tồn tại, cập nhật chapter mới cho comicId đó
     existingHistoryItem.chapter = chapter.id;
     existingHistoryItem.lastReadAt = Date.now();
   } else {
     // Nếu không tồn tại, thêm một mục mới vào lịch sử đọc
     const newHistoryItem = {
       comic: comicId,
       chapter: chapter.id,
       lastReadAt: Date.now()
     };
     user.readingHistory.push(newHistoryItem);
   }
   // Lưu người dùng đã được cập nhật
   await user.save();
  }
  
  await Chapter.findOneAndUpdate({ _id: id }, { $inc: { views: 1 } });


  // Tăng số lượt xem của truyện
  await Comic.findOneAndUpdate({ _id: idComic }, { $inc: { views: 1 } });
  
   // Kiểm tra xem session có tồn tại hay không
   if (!req.session.readingHistory) {
    // Nếu session chưa tồn tại, khởi tạo một mảng mới để lưu lịch sử đọc
    req.session.readingHistory = {};
  }

  // Kiểm tra xem đã có lịch sử đọc cho truyện này trong session hay chưa
  if (!req.session.readingHistory[comicId]) {
    // Nếu chưa có lịch sử đọc cho truyện này, khởi tạo một đối tượng mới để lưu thông tin lịch sử đọc
    req.session.readingHistory[comicId] = {
      lastReadChapter: chapter._id,
      chapterNumber: chapter.chapterNumber,
      name: comic.name,
      image: comic.image,
      timestamp: Date.now()
    };
  } else {
    // Nếu đã có lịch sử đọc cho truyện này, cập nhật thông tin chương đã đọc gần nhất
    req.session.readingHistory[comicId].lastReadChapter = chapter._id;
    req.session.readingHistory[comicId].chapterNumber = chapter.chapterNumber;
    req.session.readingHistory[comicId].name = comic.name;
    req.session.readingHistory[comicId].image = comic.image;
    req.session.readingHistory[comicId].timestamp = Date.now();
  }
 
  const selectedChapterId = chapter._id.toString();
  var currentIndex = comic.chapters.findIndex(chapter => chapter._id.toString() === selectedChapterId);
  var previousChapterId = null;
  var nextChapterId = null;
  if (currentIndex > 0) {
    previousChapterId = comic.chapters[currentIndex - 1]._id;
  }

  if (currentIndex < comic.chapters.length - 1) {
    nextChapterId = comic.chapters[currentIndex + 1]._id;
  }
  res.render('chapter',{chapter, comic, selectedChapterId, previousChapterId, nextChapterId, user, comments, userTitle, ecmt, idComic})
})
// get list
router.get("/list", async function(req, res, next){
  req.session.returnTo = req.originalUrl;
  try {
    const user = await User.findById(req.session.userId)
    const page = parseInt(req.query.page) || 1; // Lấy trang hiện tại từ tham số truy vấn, mặc định là trang 1
    const limit = 5; // Số truyện tranh hiển thị trên mỗi trang
    const skip = (page - 1) * limit; // Tính số truyện tranh cần bỏ qua

    const type = req.query.type; // Lấy giá trị của tham số truy vấn "type"
    const category = req.query.category; // Lấy giá trị của tham số truy vấn "category"
    const keyword = req.query.keyword; // Lấy từ khóa từ tham số truy vấn "keyword"
    const regex = new RegExp(keyword, "i"); 

    let query = {};
    let sort = {};

    if (type === "recently-updated") {
      query = { lastChapterAddedAt: { $ne: null } };
      sort = { lastChapterAddedAt: -1 };
    } else if (type === "newest") {
      sort = { createdAt: -1 };
    } else if(type === "most-viewed") {
      sort = { views: -1 };
    } else {
      query = { category: "NonexistentCategory" };
    }
    if (category) {
      query = { category: { $in: [category] } }; // Lọc theo thể loại nếu được chọn
    }
    if (keyword) {
      query = { name: { $regex: regex } };;
    }
    
    const comics = await Comic.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("chapters")
      .exec();
    const totalComics = await Comic.countDocuments(query); // Lấy tổng số truyện tranh dựa trên truy vấn
    const totalPages = Math.ceil(totalComics / limit); // Tính tổng số trang
    res.render('list', { comics, currentPage: page, totalPages, type, category, keyword, user });
    res.json(comics);
  } catch (error) {
    next(error);
  }
});
router.get("/search", async function(req, res, next){
  const encodeKeyword = req.query.keyword; // Lấy từ khóa từ tham số truy vấn "keyword"
  const keyword = decodeURIComponent(encodeKeyword);

  const regex = new RegExp(keyword, "i"); 
  let query = {};
  let sort = {};
  if (keyword) {
    query = { name: { $regex: regex } };;
  }
  const comics = await Comic.find(query)
  .sort(sort)
  .populate("chapters")
  .exec();
  res.json(comics);
})
router.get('/comic/reading-history/:comicId', async function (req, res, next){
  const user = await User.findById(req.session.userId)
  const comicId = req.params.comicId; // Giả sử comicId được truyền qua query parameter
  // Kiểm tra xem session có tồn tại hay không
  if (req.session.readingHistory && req.session.readingHistory[comicId]) {
    // Lấy thông tin chương đã lưu từ lịch sử đọc
    const lastReadChapter = req.session.readingHistory[comicId].lastReadChapter;
    // Chuyển hướng người dùng đến trang đọc chương đã lưu
    res.redirect(`/comic/chapter/${lastReadChapter}`);
  } else if(user) {
    const history = user.readingHistory.find(item => item.comic.toString() === comicId);
    const comic = await Comic.findById(history.comic).populate("chapters").exec();
    const chapter = await Chapter.findById(history.chapter).exec();
    const lastReadChapter = chapter._id;
       // Chuyển hướng người dùng đến trang đọc chương đã lưu
       res.redirect(`/comic/chapter/${lastReadChapter}`);
  } else {
    // Không có lịch sử đọc cho truyện này, thực hiện hành động phù hợp, ví dụ: chuyển hướng đến trang chủ
    res.redirect('/');
  }
});
router.get('/history', async function(req, res, next){
  req.session.returnTo = req.originalUrl;
   // Lấy thông tin lịch sử đọc từ session
   const user = await User.findById(req.session.userId)
   const readingHistory = req.session.readingHistory;

   // Kiểm tra xem có lịch sử đọc hay không
   let comicList = [];
   if (user) {
     // Lấy thông tin lịch sử đọc từ người dùng
   const userReadingHistory = user.readingHistory || [];
 
   // Sắp xếp lịch sử đọc theo thời gian tạo (createdAt)
   userReadingHistory.sort((a, b) => {
     return new Date(b.lastReadAt) - new Date(a.lastReadAt);
   });
   // Lấy danh sách truyện từ lịch sử đọc, tối đa 5 truyện
    comicList = await Promise.all(
     userReadingHistory.map(async (historyItem) => {
       // Truy vấn thông tin truyện và chương từ cơ sở dữ liệu
       const comic = await Comic.findById(historyItem.comic).populate("chapters").exec();
       const chapter = await Chapter.findById(historyItem.chapter).exec();
 
       // Trả về đối tượng truyện với thông tin ảnh, tên truyện, chương đọc gần nhất
       return {
         comicId: comic._id,
         lastReadChapter: chapter._id,
         chapterNumber: chapter.chapterNumber,
         image: comic.image, // Thêm thông tin ảnh truyện
         name: comic.name, // Thêm thông tin tên truyện
       };
     })
    
   );
   // Kiểm tra nếu có truyện mới được thêm
   const isComicAdded = comicList.some((comic) => {
     const comicAddedTime = comic.lastReadAt;
     return comicAddedTime > user.createdAt;
   });
 
   // Cập nhật lại thứ tự sắp xếp của lịch sử đọc nếu có truyện mới
   if (isComicAdded) {
     comicList.sort((a, b) => {
       return new Date(b.lastReadAt) - new Date(a.lastReadAt);
     });
   }
   } else {
    if (readingHistory) {
      // Sắp xếp lịch sử đọc theo thời gian từ mới đến cũ
      const sortedHistory = Object.entries(readingHistory).sort((a, b) => b[1].timestamp - a[1].timestamp);
      // Lấy danh sách truyện từ lịch sử đọc
      comicList = await Promise.all(
        sortedHistory.map(async ([comicId, history]) => {
          // Truy vấn truyện từ cơ sở dữ liệu
          const comic = await Comic.findById(comicId).populate("chapters").exec();
          // Trả về đối tượng truyện với thông tin ảnh, tên truyện, chương đọc gần nhất
          return {
            comicId,
            lastReadChapter: history.lastReadChapter,
            chapterNumber: history.chapterNumber,
            image: comic.image, // Thêm thông tin ảnh truyện
            name: comic.name, // Thêm thông tin tên truyện
          };
        })
      );
      // Cập nhật thứ tự sắp xếp của lịch sử đọc
      req.session.readingHistory = Object.fromEntries(sortedHistory);
    }
   }
   
  res.render('history', {comicList, user})
})

// follower
router.get('/follow-comic', middwareSession.middwareHome, async function(req, res, next) {
  req.session.returnTo = req.originalUrl;
  const page = parseInt(req.query.page) || 1; // Lấy trang hiện tại từ tham số truy vấn, mặc định là trang 1
  const limit = 5; // Số truyện tranh hiển thị trên mỗi trang
  const skip = (page - 1) * limit; // Tính số truyện tranh cần bỏ qua
  const user = await User.findById(req.session.userId)
  try {
    const users = await User.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(req.session.userId) } },
      { $project: { followedComics: 1 } },
      { $unwind: "$followedComics" },
      { $sort: { "followedComics.createdAt": -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "comics",
          localField: "followedComics.comic",
          foreignField: "_id",
          as: "followedComics.comic"
        }
      },
      { $unwind: "$followedComics.comic" },
      {
        $lookup: {
          from: "chapters",
          localField: "followedComics.comic.chapters",
          foreignField: "_id",
          as: "followedComics.comic.chapters"
        }
      },
      {
        $group: {
          _id: "$_id",
          followedComics: { $push: "$followedComics" }
        }
      }
    ]);

    const comics = users[0].followedComics;


    const totalComics = await User.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(req.session.userId) } },
      { $project: { count: { $size: "$followedComics" } } }
    ]); // Lấy tổng số truyện tranh

    const totalPages = Math.ceil(totalComics[0].count / limit); // Tính tổng số trang

    res.render('follow', { user, comics, currentPage: page, totalPages });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});


router.post('/comic/:id/toggle-follow', async function(req, res, next) {
  const comicId = req.params.id;
  const userId = req.session.userId;

  try {
    const user = await User.findById(userId).populate('followedComics.comic');
    const comic = await Comic.findById(comicId);

    if (!user || !comic) {
      res.json({ success: false });
      return;
    }

    const isFollowing = user.followedComics.some((followedComic) => followedComic.comic._id.equals(comicId));
    if (isFollowing) {
      // Bỏ theo dõi nếu đang theo dõi
      user.followedComics = user.followedComics.filter((followedComic) => !followedComic.comic._id.equals(comicId));
      comic.followers.pull(userId);
    } else {
      // Thêm vào danh sách theo dõi nếu chưa theo dõi
      const currentTime = new Date();
      user.followedComics.push({ comic: comicId, createdAt: currentTime });
      comic.followers.push(userId);
    }

    await user.save();
    await comic.save();

    res.json({ success: true, isFollowing: !isFollowing, followerCount: comic.followers.length });
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

// rating
router.post('/comic/:id/save-rating', async (req, res) => {
  const { rating } = req.body;
  const userId = req.session.userId; // Lấy ID người dùng từ session

  try {
    // Kiểm tra xem người dùng đã đánh giá truyện này chưa
    const existingRating = await Rating.findOne({ user: userId, comic: req.params.id });

    if (existingRating) {
      // Người dùng đã đánh giá truyện này, bạn có thể hiển thị thông báo hoặc cho phép cập nhật đánh giá
      console.log('Người dùng đã đánh giá truyện này');
      res.json({ message: 'Người dùng đã đánh giá truyện này' });
    } else {
      // Người dùng chưa đánh giá truyện này, tạo một bản ghi đánh giá mới
      const newRating = new Rating({
        user: userId,
        comic: req.params.id,
        rating: rating,
      });

      // Lưu bản ghi vào cơ sở dữ liệu
      const savedRating = await newRating.save();
      res.json(savedRating);
    }
  } catch (error) {
    console.error('Lỗi khi lưu đánh giá:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lưu đánh giá' });
  }
});
// comment
router.post('/comic/:id/save-comment', async (req, res) => {
  const { content } = req.body;
  const userId = req.session.userId;
  const comicId = req.params.id;
  const chapterId = req.body.chapterId ? req.body.chapterId : null;
  const parentId = req.body.parentId ? req.body.parentId : null;
  console.log(parentId)
  console.log(chapterId)

  try {
    const newComment = new Comment({
      user: userId,
      comic: comicId,
      content: content,
      chapter: chapterId,
      parentComment: parentId,
    });

    const savedComment = await newComment.save();

if (parentId) {
  // Cập nhật truyện để thêm comment con vào mảng childComment
  await Comment.findByIdAndUpdate(parentId, {
    $push: { childComment: savedComment._id }
  });
}
    

    res.json(savedComment);
  } catch (error) {
    console.error('Lỗi khi lưu comment:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi lưu comment' });
  }
});
router.delete('/comments/:commentId', async (req, res) => {
  try {
    const commentId = req.params.commentId;

    // Xóa comment từ cơ sở dữ liệu
    await Comment.findByIdAndRemove(commentId);

    // Phản hồi thành công
    res.json({ success: true });
  } catch (error) {
    // Xảy ra lỗi khi xóa comment
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa comment.' });
  }
});


router.get('/login',middwareSession.redirectHome, sessionCtrl.index);

router.post('/login',middwareSession.redirectHome, sessionCtrl.create); 

router.get('/register',middwareSession.redirectHome, sessionStrl.index);

router.post('/register',middwareSession.redirectHome, sessionStrl.create);

router.get('/logout', sessionCtrl.destroy);

router.get('/info',middwareSession.middwareHome,async function(req, res, next) {
  const user = await User.findById(req.session.userId)
  res.render('session/info',{user:user});
});

router.get('/change',middwareSession.middwareHome,sessionVtrl.index);

router.post('/change',middwareSession.middwareHome,sessionVtrl.create);


router.get('/login',middwareSession.redirectHome, sessionCtrl.index);

router.post('/login',middwareSession.redirectHome, sessionCtrl.create); 

router.get('/register',middwareSession.redirectHome, sessionStrl.index);

router.post('/register',middwareSession.redirectHome, sessionStrl.create);

router.get('/logout', sessionCtrl.destroy);

module.exports = router;
