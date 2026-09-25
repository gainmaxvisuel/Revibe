const SUPABASE_URL =
  "https://cmtbzozflkmxfhdzlgab.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_ZzqLlH7Iz10HBq8SGoXdmA_l1XhBl7T";

const { createClient } = supabase;

const db = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

const productsContainer =
  document.getElementById("products");

const searchInput =
  document.getElementById("searchInput");

let allProducts = [];
let selectedCategory = "";

async function loadProducts() {
  productsContainer.innerHTML =
    '<div class="empty">Chargement des produits...</div>';

  const { data, error } =
    await db.rpc("list_catalog_products");

  if (error) {
    console.error(error);

    productsContainer.innerHTML =
      '<div class="empty">Impossible de charger les produits.</div>';

    return;
  }

  allProducts = data || [];
  displayProducts();
}

function displayProducts() {
  const search =
    searchInput.value.trim().toLowerCase();

  const filtered = allProducts.filter(product => {

    const name =
      String(product.name || "").toLowerCase();

    const category =
      String(
        product.category_name ||
        product.category ||
        ""
      ).toLowerCase();

    const matchesSearch =
      !search ||
      name.includes(search) ||
      category.includes(search);

    const matchesCategory =
      !selectedCategory ||
      category === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  if (!filtered.length) {
    productsContainer.innerHTML =
      '<div class="empty">Aucun produit disponible.</div>';
    return;
  }

  productsContainer.innerHTML =
    filtered.map(product => {

      const image =
        product.image_url ||
        product.image_path ||
        "";

      return `
        <article class="product"
                 onclick="openProduct('${product.id}')">

          <div class="product-image">
            ${
              image
              ? `<img src="${image}" alt="">`
              : `<i class="fa-regular fa-image"></i>`
            }
          </div>

          <div class="product-info">

            <div class="product-name">
              ${escapeHtml(product.name || "Produit")}
            </div>

            <div style="
              margin-top:7px;
              font-weight:800;
              color:#07845c;
              font-size:15px;
            ">
              ${formatPrice(product.price)} XOF
            </div>

            <div class="seller">
              ${escapeHtml(
                product.shop_name ||
                product.seller_name ||
                "Vendeur Revibe"
              )}
            </div>

          </div>
        </article>
      `;
    }).join("");
}

function formatPrice(value) {
  return Number(value || 0)
    .toLocaleString("fr-FR");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openProduct(id) {
  window.location.href =
    `../product.html?id=${encodeURIComponent(id)}`;
}

searchInput.addEventListener(
  "input",
  displayProducts
);

document
  .querySelectorAll(".category")
  .forEach(category => {

    category.addEventListener("click", () => {

      selectedCategory =
        category.dataset.category || "";

      displayProducts();
    });
  });

async function updateCartCount() {
  const token =
    localStorage.getItem("revibe_session_token");

  if (!token) return;

  const { data, error } =
    await db.rpc("list_cart", {
      p_session_token: token
    });

  if (error) {
    console.error(error);
    return;
  }

  const count =
    (data || []).reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );

  document.getElementById("cartCount")
    .textContent = count;
}

loadProducts();
updateCartCount();
