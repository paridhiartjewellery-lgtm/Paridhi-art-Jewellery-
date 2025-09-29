// Firestore से डेटाबेस को initialize करें
const db = firebase.firestore();

let batches = [];
let currentBatch = null;
let currentProduct = null;

// Firebase से data load करें
async function loadDataAndRender() {
  try {
    const doc = await db.collection("websiteData").doc("batches").get();
    if (doc.exists) {
      batches = doc.data().batches;
    } else {
      console.log("No data found in Firestore.");
      batches = [];
    }
    renderBatches();
  } catch (error) {
    console.error("Error loading data from Firestore:", error);
  }
}

// Batches को दिखाएं
function renderBatches() {
  const container = document.getElementById("batch-list");
  container.innerHTML = "<h2>Collections</h2>";
  if (batches.length === 0) {
    container.innerHTML += "<p>No collections available yet. Please check back later!</p>";
  }
  batches.forEach((batch, i) => {
    const div = document.createElement("div");
    div.className = "card";
    div.textContent = batch.name;
    div.onclick = () => showProducts(i);
    container.appendChild(div);
  });
}

// Products को दिखाएं
function showProducts(batchIndex) {
  currentBatch = batches[batchIndex];
  document.getElementById("batch-list").classList.add("hidden");
  const container = document.getElementById("product-list");
  container.classList.remove("hidden");
  container.innerHTML = `<h2>${currentBatch.name}</h2>`;
  currentBatch.products.forEach((product, i) => {
    const div = document.createElement("div");
    div.className = "card product-card"; // Add a class for styling
    div.onclick = () => showImages(i);

    const img = document.createElement("img");
    img.src = product.themeImage || 'assets/images/default.jpg';
    img.alt = product.name;
    
    const name = document.createElement("p");
    name.textContent = product.name;

    div.appendChild(img);
    div.appendChild(name);
    
    container.appendChild(div);
  });
}

// Images को दिखाएं
function showImages(productIndex) {
  currentProduct = currentBatch.products[productIndex];
  document.getElementById("product-list").classList.add("hidden");

  const container = document.getElementById("image-gallery");
  container.classList.remove("hidden");
  container.innerHTML = `<h2>${currentProduct.name}</h2>`;

  currentProduct.images.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.style.width = "100px";
    img.style.margin = "10px";
    img.style.cursor = "pointer";
    img.onclick = () => openFullscreen(src);
    container.appendChild(img);
  });
}

// Fullscreen image viewer
function openFullscreen(src) {
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = "100vw";
  overlay.style.height = "100vh";
  overlay.style.background = "rgba(0,0,0,0.9)";
  overlay.style.display = "flex";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = 9999;

  const img = document.createElement("img");
  img.src = src;
  img.style.maxWidth = "90%";
  img.style.maxHeight = "90%";
  img.style.boxShadow = "0 0 20px white";
  img.style.transition = "transform 0.3s ease";
  img.style.cursor = "zoom-in";

  let scale = 1;
  img.onclick = (e) => {
    scale = scale === 1 ? 2 : 1;
    img.style.transform = `scale(${scale})`;
    img.style.cursor = scale === 1 ? "zoom-in" : "zoom-out";
    e.stopPropagation();
  };

  overlay.appendChild(img);
  overlay.onclick = () => document.body.removeChild(overlay);
  document.body.appendChild(overlay);
}

// Back button functionality
function goBack() {
  if (currentProduct) {
    currentProduct = null;
    document.getElementById("image-gallery").classList.add("hidden");
    document.getElementById("product-list").classList.remove("hidden");
  } else if (currentBatch) {
    currentBatch = null;
    document.getElementById("product-list").classList.add("hidden");
    document.getElementById("batch-list").classList.remove("hidden");
  }
}

// Initial call to load data
loadDataAndRender();
