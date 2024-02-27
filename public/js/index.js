const wrapper = document.querySelector(".body-text"),
selectBtn =  wrapper.querySelector(".text-1");
selectBtn1 =  wrapper.querySelector(".text-2");
selectBtn2 =  wrapper.querySelector(".text-3");



selectBtn.addEventListener("click", () =>{
    wrapper.classList.toggle("active");
});
selectBtn1.addEventListener("click", () =>{
    wrapper.classList.toggle("active1");
});
selectBtn2.addEventListener("click", () =>{
    wrapper.classList.toggle("active2");
});
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

searchForm.addEventListener('submit', (event) => {
  event.preventDefault(); // Ngăn chặn submit form mặc định
  
  const keyword = searchInput.value.trim(); // Lấy từ khóa từ input và loại bỏ khoảng trắng đầu và cuối
  
  if (keyword !== '') {
    const url = `/list?keyword=${keyword}`;
    window.location.href = url;
  }
});

const searchInput1 = document.querySelector('.form-control'); // Lấy thẻ input nhập liệu
const searchResults = document.querySelector('.comic-result'); // Lấy phần tử hiển thị kết quả

searchInput1.addEventListener('input', async (event) => {
  const keyword = event.target.value; // Lấy giá trị từ input
  try {
    const encodedKeyword = encodeURIComponent(keyword); // Mã hóa keyword
    const response = await fetch(`/search?keyword=${encodedKeyword}`); // Gửi request tới server
    const comics = await response.json(); // Chuyển đổi response thành dữ liệu JSON
    // Xóa các kết quả hiện tại trong hộp hiển thị
    searchResults.innerHTML = '';
     // Kiểm tra từ khóa có rỗng hay không
     if (keyword.trim() === '') {
      return; // Nếu từ khóa rỗng, không hiển thị kết quả
    }
    // Tạo các phần tử HTML để hiển thị kết quả
    comics.forEach((comic) => {
      const resultItem = document.createElement('div');
      resultItem.classList.add('mini-comic');
      resultItem.innerHTML = `
        <div class="mini-pic">
          <a href="/comic/${comic._id}"><img src="${comic.image}" alt=""></a>
        </div>
        <div class="mini-content">
          <a href="/comic/${comic._id}">${comic.name}</a>
          <br>
          <a href="/comic/chapter/${comic.chapters[comic.chapters.length - 1]._id}">Chương ${comic.chapters.length}</a>
        </div>
      `;
      searchResults.appendChild(resultItem);
    });
  } catch (error) {
    console.error(error);
  }
});

const linkElement = document.getElementById('linkElement');
const linkElementt = document.getElementById('linkElementt');
const currentPath = window.location.pathname;

if (currentPath === '/list') {
  linkElementt.classList.add('link');
} else if (currentPath === '/') {
  linkElement.classList.add('link');
}

if ('<%= userTitle %>'){
  const targetElement = document.querySelector('.user-login');
const hiddenElement = document.querySelector('.user-info');

targetElement.addEventListener('mouseover', function() {
  hiddenElement.style.display = 'block';
});
hiddenElement.addEventListener('mouseover', function() {
    hiddenElement.style.display = 'block';
  });

targetElement.addEventListener('mouseleave', function() {
  hiddenElement.style.display = 'none';
});
hiddenElement.addEventListener('mouseleave', function() {
    hiddenElement.style.display = 'none';
  });
}




