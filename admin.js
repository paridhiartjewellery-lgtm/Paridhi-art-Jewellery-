// Firebase और Cloudinary के लिए जरूरी variables
const CLOUDINARY_CLOUD_NAME = "dmnddgono"; // Cloudinary Dashboard से Cloud Name यहाँ डालें
const CLOUDINARY_UPLOAD_PRESET = "paridhi_upload"; // Cloudinary से Upload Preset का नाम यहाँ डालें

// Firestore और Authentication को initialize करें
const auth = firebase.auth();
const db = firebase.firestore();

let batches = [];
let selectedBatchIndex = null;
let selectedProductIndex = null;

// Admin का login check करें और data load करें
async function checkAdminLogin() {
  try {
    // अगर कोई admin logged in नहीं है, तो login prompt दिखाएं
    if (!auth.currentUser) {
      const email = prompt("Enter your admin email:");
      const password = prompt("Enter your password:");
      await auth.signInWithEmailAndPassword(email, password);
    }
    // Login successful होने पर data load करें
    await loadDataFromFirebase();
    renderBatches();
    console.log("Admin logged in and data loaded.");
  } catch (error) {
    alert("Login failed or no data found: " + error.message);
    window.location.href = "index.html";
  }
}

// Firebase से data load करें
async function loadDataFromFirebase() {
  try {
    const doc = await db.collection("websiteData").doc("batches").get();
    if (doc.exists) {
      batches = doc.data().batches;
    } else {
      console.log("No data found in Firestore, starting with empty data.");
      batches = [];
    }
  } catch (error) {
    console.error("Error loading data from Firestore:", error);
    batches = [];
  }
}

// Firebase में data save करें
async function saveDataToFirebase() {
  try {
    await db.collection("websiteData").doc("batches").set({ batches: batches });
    console.log("Data successfully saved to Firebase.");
  } catch (error) {
    console.error("Error saving data to Firebase:", error);
    alert("Data could not be saved.");
  }
}

// Batches को add, rename, और delete करने के functions
function addBatch() {
  const name = document.getElementById("newBatchName").value.trim();
  if (name) {
    batches.push({ name, products: [] });
    saveDataToFirebase();
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
    saveDataToFirebase();
    renderBatches();
  }
}

function deleteBatch(index) {
  if (confirm(`Delete batch "${batches[index].name}"?`)) {
    batches.splice(index, 1);
    saveDataToFirebase();
    renderBatches();
    document.getElementById("productSection").classList.add("hidden");
  }
}

// Products को manage करने के functions
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
    saveDataToFirebase();
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
    saveDataToFirebase();
    renderProducts();
  }
}

function deleteProduct(index) {
  const product = batches[selectedBatchIndex].products[index];
  if (confirm(`Delete product "${product.name}"?`)) {
    batches[selectedBatchIndex].products.splice(index, 1);
    saveDataToFirebase();
    renderProducts();
  }
}

function selectProduct(index) {
  selectedProductIndex = index;
  document.getElementById("selectedProductName").textContent =
    batches[selectedBatchIndex].products[index].name;
  renderImageList();
}

// Images को manage करने के functions
async function uploadImages() {
  const files = document.getElementById("imageUpload").files;
  const product = batches[selectedBatchIndex].products[selectedProductIndex];

  if (!files.length) {
    alert("Please select at least one file to upload.");
    return;
  }

  for (let file of files) {
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed.");
      continue;
    }
    
    try {
      // Cloudinary पर image upload करें
      const permanentUrl = await uploadToCloudinary(file);
      product.images.push(permanentUrl);
      console.log("Image uploaded to Cloudinary:", permanentUrl);
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      alert("Image upload failed. Please check the console.");
    }
  }

  saveDataToFirebase();
  renderImageList();
}

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error('Cloudinary upload failed.');
  const data = await res.json();
  return data.secure_url;
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
    
    const setBtn = document.createElement("button");
    setBtn.textContent = "Set as Theme";
    setBtn.onclick = () => setThemeImage(i);

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.onclick = () => deleteImage(i);

    li.appendChild(img);
    li.appendChild(setBtn);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

function setThemeImage(index) {
  const product = batches[selectedBatchIndex].products[selectedProductIndex];
  product.themeImage = product.images[index];
  saveDataToFirebase();
  renderProducts(); // Update product list to show new theme image
  renderImageList();
}

function deleteImage(index) {
  const product = batches[selectedBatchIndex].products[selectedProductIndex];
  if (confirm(`Delete this image?`)) {
    const deletedUrl = product.images.splice(index, 1)[0];
    if (product.themeImage === deletedUrl) {
      product.themeImage = null;
    }
    saveDataToFirebase();
    renderImageList();
  }
}

// IMPORTANT: This function must be defined after everything else
function copyShareLink() {
  const link = window.location.origin + "/index.html";
  navigator.clipboard.writeText(link).then(() => {
    document.getElementById("shareStatus").textContent = "Link copied! You can paste it in WhatsApp or SMS.";
  }).catch(() => {
    document.getElementById("shareStatus").textContent = "Failed to copy link.";
  });
}

// Initial call to check login and load data
window.onload = checkAdminLogin;
