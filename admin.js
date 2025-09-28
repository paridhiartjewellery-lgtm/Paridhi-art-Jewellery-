let batches = JSON.parse(localStorage.getItem("batches")) || [];
let selectedBatchIndex = null;
let selectedProductIndex = null;

function saveData() {
  localStorage.setItem("batches", JSON.stringify(batches));
}

function addBatch() {
  const name = document.getElementById("newBatchName").value.trim();
  if (name) {
    batches.push({ name, products: [] });
    saveData();
    renderBatches();
    document.getElementById("newBatchName").value = "";
  }
}

function renderBatches() {
  const list = document.getElementById("batchList");
  list.innerHTML = "";
  batches.forEach((batch, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span onclick="selectBatch(${i})">${batch.name}</span>
      <button onclick="renameBatch(${i})">✏️</button>
      <button onclick="deleteBatch(${i})">🗑️</button>
    `;
    list.appendChild(li);
  });
}
function renameBatch(index) {
  const newName = prompt("Enter new batch name:", batches[index].name);
  if (newName) {
    batches[index].name = newName.trim();
    saveData();
    renderBatches();
  }
}
function deleteBatch(index) {
  if (confirm(`Delete batch "${batches[index].name}"?`)) {
    batches.splice(index, 1);
    saveData();
    renderBatches();
    document.getElementById("productSection").classList.add("hidden");
  }
}

function selectBatch(index) {
  selectedBatchIndex = index;
  document.getElementById("selectedBatchName").textContent = batches[index].name;
  document.getElementById("productSection").classList.remove("hidden");
  renderProducts();
}

function addProduct() {
  const name = document.getElementById("newProductName").value.trim();
  if (name && selectedBatchIndex !== null) {
    batches[selectedBatchIndex].products.push({ name, images: [], themeImage: null });
    saveData();
    renderProducts();
    document.getElementById("newProductName").value = "";
  }
}

function renderProducts() {
  const list = document.getElementById("productList");
  list.innerHTML = "";
  const products = batches[selectedBatchIndex].products;
  products.forEach((product, i) => {
    const li = document.createElement("li");
    const nameSpan = document.createElement("span");
nameSpan.innerHTML = `
  <img src="${product.themeImage || 'assets/images/default.jpg'}" width="50" style="vertical-align: middle; margin-right: 8px;" />
  ${product.name}
`;
nameSpan.style.cursor = "pointer";
nameSpan.onclick = () => selectProduct(i);

const renameBtn = document.createElement("button");
renameBtn.textContent = "✏️";
renameBtn.onclick = () => renameProduct(i);

const deleteBtn = document.createElement("button");
deleteBtn.textContent = "🗑️";
deleteBtn.onclick = () => deleteProduct(i);

li.appendChild(nameSpan);
li.appendChild(renameBtn);
li.appendChild(deleteBtn);
    
    list.appendChild(li);
  });
}
function renameProduct(index) {
  const newName = prompt("Enter new product name:", batches[selectedBatchIndex].products[index].name);
  if (newName) {
    batches[selectedBatchIndex].products[index].name = newName.trim();
    saveData();
    renderProducts();
  }
}
function deleteProduct(index) {
  const product = batches[selectedBatchIndex].products[index];
  if (confirm(`Delete product "${product.name}"?`)) {
    batches[selectedBatchIndex].products.splice(index, 1);
    saveData();
    renderProducts();
  }
}
function selectProduct(index) {
  selectedProductIndex = index;
  document.getElementById("selectedProductName").textContent =
    batches[selectedBatchIndex].products[index].name;
  renderImageList();
}

function uploadImages() {
  const files = document.getElementById("imageUpload").files;
  const product = batches[selectedBatchIndex].products[selectedProductIndex];
  for (let file of files) {
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed.");
      continue;
    }
    const url = URL.createObjectURL(file);
    product.images.push(url);
  }
  saveData();
  renderImageList();
}

function renderImageList() {
  const list = document.getElementById("imageList");
  list.innerHTML = "";
  const product = batches[selectedBatchIndex].products[selectedProductIndex];

  product.images.forEach((src, i) => {
    const li = document.createElement("li");

    const img = document.createElement("img");
    img.src = src;
    img.width = 100;
    img.alt = `Image ${i + 1}`;
    img.onerror = () => {
      img.src = "assets/images/default.jpg"; // fallback image
      img.alt = "Image failed to load";
    };

    const setBtn = document.createElement("button");
    setBtn.textContent = "Set as Theme";
    setBtn.onclick = () => setThemeImage(i);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteImage(i);

    li.appendChild(img);
    li.appendChild(setBtn);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}


function deleteImage(index) {
  const product = batches[selectedBatchIndex].products[selectedProductIndex];
  const imageName = `Image ${index + 1}`;
  if (confirm(`Delete ${imageName}?`)) {
    const deleted = product.images.splice(index, 1)[0];
    if (product.themeImage === deleted) {
      product.themeImage = null;
    }
    saveData();
    renderImageList();
  }
}

renderBatches();
function copyShareLink() {
  const link = window.location.origin + "/index.html";
  navigator.clipboard.writeText(link).then(() => {
    document.getElementById("shareStatus").textContent = "Link copied! You can paste it in WhatsApp or SMS.";
  }).catch(() => {
    document.getElementById("shareStatus").textContent = "Failed to copy link.";
  });
}