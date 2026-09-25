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
   CHARGER LES PRODUITS
========================= */

async function loadProducts() {

  if (!productsContainer) {
    console.error(
      "Élément #products introuvable dans index.html"
    );
    return;
  }

  productsContainer.innerHTML = `
    <div class="empty">
      Chargement des produits...
    </div>
  `;

  console.log("Revibe : chargement des produits...");

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

    console.log("Réponse Supabase :", data);
    console.log("Erreur Supabase :", error);

    if (error) {

      console.error(
        "Erreur RPC list_catalog_products :",
        error
      );

      productsContainer.innerHTML = `
        <div class="empty">
          <i class="fa-solid fa-triangle-exclamation"></i>

          <div style="margin-top:10px;">
            Impossible de charger les produits.
          </div>

          <div style="
            margin-top:8px;
            font-size:12px;
            color:#888;
          ">
            ${escapeHtml(error.message || "Erreur Supabase")}
          </div>
        </div>
      `;

      return;
    }


    /*
      Supabase peut retourner directement
      un tableau ou une chaîne JSON.
    */

    let products = data;

    if (typeof products === "string") {

      try {
        products = JSON.parse(products);
      } catch (e) {

        console.error(
          "Impossible de convertir le JSON :",
          e
        );

        products = [];
      }
    }


    /*
      Sécurité supplémentaire :
      si la fonction retourne un objet contenant
      "products", on récupère ce tableau.
    */

    if (
      products &&
      !Array.isArray(products) &&
      Array.isArray(products.products)
    ) {
      products = products.products;
    }


    if (!Array.isArray(products)) {
      products = [];
    }


    allProducts = products;

    console.log(
      "Nombre de produits chargés :",
      allProducts.length
    );


    displayProducts();

  } catch (error) {

    console.error(
      "Erreur inattendue :",
      error
    );

    productsContainer.innerHTML = `
      <div class="empty">

        <i class="fa-solid fa-triangle-exclamation"></i>

        <div style="margin-top:10px;">
          Une erreur est survenue.
        </div>

        <div style="
          margin-top:8px;
          font-size:12px;
          color:#888;
        ">
          ${escapeHtml(error.message || "Erreur inconnue")}
        </div>

      </div>
    `;
  }
}


/* =========================
   AFFICHER LES PRODUITS
========================= */

function displayProducts() {

  if (!productsContainer) {
    return;
  }

  const search =
    searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";


  const filtered =
    allProducts.filter(product => {

      const name =
        String(
          product.name || ""
        ).toLowerCase();

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
        category ===
          selectedCategory.toLowerCase();


      return (
        matchesSearch &&
        matchesCategory
      );
    });


  /*
    Aucun produit
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


  /*
    Produits trouvés
  */

  productsContainer.innerHTML =
    filtered.map(product => {

      const image =
        product.image_url ||
        product.image_path ||
        "";


      return `
        <article
          class="product"
          onclick="openProduct('${escapeHtml(product.id)}')"
        >

          <div class="product-image">

            ${
              image
                ? `
                  <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(product.name || "Produit")}"
                    loading="lazy"
                  >
                `
                : `
                  <i class="fa-regular fa-image"></i>
                `
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
              ${formatPrice(product.price)}
              XOF
            </div>


            <div class="seller">
              ${escapeHtml(
                product.shop_name ||
                "Vendeur Revibe"
              )}
            </div>


            <div style="
              margin-top:5px;
              font-size:12px;
              color:#777;
            ">
              Stock : ${Number(product.stock || 0)}
            </div>

          </div>

        </article>
      `;

    }).join("");
}


/* =========================
   FORMAT PRIX
========================= */

function formatPrice(value) {

  return Number(value || 0)
    .toLocaleString("fr-FR");
}


/* =========================
   PROTECTION HTML
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
   OUVRIR PRODUIT
========================= */

function openProduct(id) {

  window.location.href =
    `../product.html?id=${encodeURIComponent(id)}`;
}


/* =========================
   RECHERCHE
========================= */

if (searchInput) {

  searchInput.addEventListener(
    "input",
    displayProducts
  );
}


/* =========================
   CATÉGORIES
========================= */

document
  .querySelectorAll(".category")
  .forEach(category => {

    category.addEventListener(
      "click",
      () => {

        selectedCategory =
          category.dataset.category || "";

        displayProducts();

      }
    );

  });


/* =========================
   COMPTEUR PANIER
========================= */

async function updateCartCount() {

  const token =
    localStorage.getItem(
      "revibe_session_token"
    );


  if (!token) {
    return;
  }


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


    const items =
      Array.isArray(data)
        ? data
        : [];


    const count =
      items.reduce(
        (total, item) =>
          total +
          Number(item.quantity || 0),
        0
      );


    const cartCount =
      document.getElementById(
        "cartCount"
      );


    if (cartCount) {

      cartCount.textContent =
        count;

    }

  } catch (error) {

    console.error(
      "Erreur compteur panier :",
      error
    );
  }
}


/* =========================
   DÉMARRAGE
========================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadProducts();

    updateCartCount();

  }
);
