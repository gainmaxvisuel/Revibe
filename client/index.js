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


/* =========================
   PRODUITS
========================= */

async function loadProducts() {

  productsContainer.innerHTML =
    '<div class="empty">Chargement des produits...</div>';

  try {

    const { data, error } = await db.rpc(
      "list_catalog_products",
      {
        p_category_id: null,
        p_search: null,
        p_min_price: null,
        p_max_price: null,
        p_limit: 24,
        p_offset: 0
      }
    );

    if (error) {
      console.error("Erreur produits :", error);

      productsContainer.innerHTML =
        '<div class="empty">Impossible de charger les produits.</div>';

      return;
    }

    /*
      La fonction SQL retourne directement un JSONB.
      On s'assure donc d'avoir un tableau.
    */
    if (Array.isArray(data)) {
      allProducts = data;
    } else {
      allProducts = [];
    }

    displayProducts();

  } catch (error) {

    console.error("Erreur inattendue :", error);

    productsContainer.innerHTML =
      '<div class="empty">Impossible de charger les produits.</div>';
  }
}


/* =========================
   AFFICHAGE
========================= */

function displayProducts() {

  const search =
    searchInput.value.trim().toLowerCase();

  const filtered =
    allProducts.filter(product => {

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


  /*
    IMPORTANT :
    aucun produit = message clair
  */

  if (filtered.length === 0) {

    productsContainer.innerHTML = `
      <div class="empty">
        <i class="fa-regular fa-box-open"></i>
        <div style="margin-top:10px;">
          Aucun produit disponible.
        </div>
      </div>
    `;

    return;
  }


  productsContainer.innerHTML =
    filtered.map(product => {

      const image =
        product.image_url ||
        product.image_path ||
        "";

      return `
        <article
          class="product"
          onclick="openProduct('${product.id}')"
        >

          <div class="product-image">

            ${
              image
                ? `<img src="${image}" alt="">`
                : `<i class="fa-regular fa-image"></i>`
            }

          </div>

          <div class="product-info">

            <div class="product-name">
              ${escapeHtml(
                product.name || "Produit"
              )}
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
                "Vendeur Revibe"
              )}
            </div>

          </div>

        </article>
      `;

    }).join("");
}


/* =========================
   PRIX
========================= */

function formatPrice(value) {

  return Number(value || 0)
    .toLocaleString("fr-FR");
}


/* =========================
   SECURITE HTML
========================= */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   PRODUIT
========================= */

function openProduct(id) {

  window.location.href =
    `../product.html?id=${encodeURIComponent(id)}`;
}


/* =========================
   RECHERCHE
========================= */

searchInput.addEventListener(
  "input",
  displayProducts
);


/* =========================
   CATEGORIES
========================= */

document
  .querySelectorAll(".category")
  .forEach(category => {

    category.addEventListener("click", () => {

      selectedCategory =
        category.dataset.category || "";

      displayProducts();

    });

  });


/* =========================
   PANIER
========================= */

async function updateCartCount() {

  const token =
    localStorage.getItem(
      "revibe_session_token"
    );

  if (!token) return;

  try {

    const { data, error } =
      await db.rpc(
        "list_cart",
        {
          p_session_token: token
        }
      );

    if (error) {
      console.error(
        "Erreur panier :",
        error
      );
      return;
    }

    const count =
      (data || []).reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0),
        0
      );

    const cartCount =
      document.getElementById("cartCount");

    if (cartCount) {
      cartCount.textContent = count;
    }

  } catch (error) {

    console.error(
      "Erreur panier :",
      error
    );
  }
}


/* =========================
   DEMARRAGE
========================= */

loadProducts();
updateCartCount();
