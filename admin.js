const db = firebase.database();
let selectedBatch = null;
let selectedProduct = null;

// Add new batch
function addBatch() {
  const name = document.getElementById("newBatchName").value.trim();
  if (!name) return;
  db.ref("gallery/" + name).set({});
  document.getElementById("newBatchName").value = "";
  renderBatches();
}

// Render batches
function renderBatches() {
  db.ref("gallery").once("value", snapshot => {
    const list = document.getElementById("batchList");
    list.innerHTML = "";
    snapshot.forEach(batch => {
      const name = batch.key;
      const li = document.createElement("li");
      li.innerHTML = `
        <span onclick="selectBatch('${name}')">${name}</span>
        <button onclick="renameBatch('${name}')">✏️</button>
        <button onclick="deleteBatch('${name}')">🗑️</button>
      `;
      list.appendChild(li);
    });
  });
}

// Rename batch
function renameBatch(oldName) {
  const newName = prompt("Enter new batch name:", oldName);
  if (!newName || newName === oldName) return;
  db.ref("gallery/" + oldName).once("value", snapshot => {
    db.ref("gallery/" + newName).set(snapshot.val());
    db.ref("gallery/" + oldName).remove();
    renderBatches();
  });
}

// Delete batch
function deleteBatch(name) {
  if (confirm(`Delete batch "${name}"?`)) {
    db.ref("gallery/" + name).remove();
    document.getElementById("productSection").classList.add("hidden");
    renderBatches();
  }
}

// Select batch
function selectBatch(name) {
  selectedBatch = name;
  document.getElementById("selectedBatchName").textContent = name;
  document.getElementById("productSection").classList.remove("hidden");
  renderProducts();
}

// Add product
function addProduct() {
  const name = document.getElementById("newProductName").value.trim();
  if (!name || !selectedBatch) return;
  db.ref(`gallery/${selectedBatch}/${name}`).set({ themeImage: null });
  document.getElementById("newProductName").value = "";
  renderProducts();
}

// Render products
function renderProducts() {
  db.ref(`gallery/${selectedBatch}`).once("value", snapshot => {
    const list = document.getElementById("productList");
    list.innerHTML = "";
    snapshot.forEach(product => {
      const name = product.key;
      const data = product.val();
      const li = document.createElement("li");
      li.innerHTML = `
        <span onclick="selectProduct('${name}')">
          <img src="${data.themeImage || 'assets/images/default.jpg'}" width="50" style="vertical-align: middle; margin-right: 8px;" />
          ${name}
        </span>
        <button onclick="renameProduct('${name}')">✏️</button>
        <button onclick="deleteProduct('${name}')">🗑️</button>
      `;
      list.appendChild(li);
    });
  });
}

// Rename product
function renameProduct(oldName) {
  const newName = prompt("Enter new product name:", oldName);
  if (!newName || newName === oldName) return;
  db.ref(`gallery/${selectedBatch}/${oldName}`).once("value", snapshot => {
    db.ref(`gallery/${selectedBatch}/${newName}`).set(snapshot.val());
    db.ref(`gallery/${selectedBatch}/${oldName}`).remove();
    renderProducts();
  });
}

// Delete product
function deleteProduct(name) {
  if (confirm(`Delete product "${name}"?`)) {
    db.ref(`gallery/${selectedBatch}/${name}`).remove();
    renderProducts();
  }
}

// Select product
function selectProduct(name) {
  selectedProduct = name;
  document.getElementById("selectedProductName").textContent = name;
  renderImageList();
}

// Upload images to ImageKit and save to Firebase
function uploadImages() {
  const files = document.getElementById("imageUpload").files;
  if (!files.length || !selectedBatch || !selectedProduct) return;

  Array.from(files).forEach(file => {
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);
    formData.append("publicKey", "public_jRXArZ60fh81Z2uQoQZn9XNnCgQ=");
    formData.append("urlEndpoint", "https://ik.imagekit.io/YOUR_IMAGEKIT_ID");

    fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      const imageUrl = data.url;
      db.ref(`gallery/${selectedBatch}/${selectedProduct}/images`).push(imageUrl);
      renderImageList();
    })
    .catch(err => console.error("Upload error:", err));
  });
}

// Render image list
function renderImageList() {
  db.ref(`gallery/${selectedBatch}/${selectedProduct}/images`).once("value", snapshot => {
    const list = document.getElementById("imageList");
    list.innerHTML = "";
    snapshot.forEach((imgSnap, i) => {
      const src = imgSnap.val();
      const key = imgSnap.key;

      const li = document.createElement("li");
      const img = document.createElement("img");
      img.src = src;
      img.width = 100;
      img.alt = `Image ${i + 1}`;
      img.onerror = () => {
        img.src = "assets/images/default.jpg";
        img.alt = "Image failed to load";
      };

      const setBtn = document.createElement("button");
      setBtn.textContent = "Set as Theme";
      setBtn.onclick = () => {
        db.ref(`gallery/${selectedBatch}/${selectedProduct}/themeImage`).set(src);
        renderProducts();
      };

      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        db.ref(`gallery/${selectedBatch}/${selectedProduct}/images/${key}`).remove();
        renderImageList();
      };

      li.appendChild(img);
      li.appendChild(setBtn);
      li.appendChild(delBtn);
      list.appendChild(li);
    });
  });
}

// Initial load
renderBatches();


