const SUPABASE_URL =
  "https://cmtbzozflkmxfhdzlgab.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_ZzqLlH7Iz10HBq8SGoXdmA_l1XhBl7T";


/* =========================
   VÉRIFICATION SUPABASE
========================= */

if (typeof supabase === "undefined") {

  document.getElementById("products").innerHTML = `
    <div class="empty">
      <strong>Erreur de connexion</strong>

      <div style="margin-top:8px;font-size:13px;">
        La bibliothèque Supabase n'est pas chargée.
      </div>
    </div>
  `;

  throw new Error(
    "Supabase JS n'est pas chargé."
  );
}


const db =
  supabase.createClient(
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


/* =========================
   ÉLÉMENTS
========================= */

const productsContainer =
  document.getElementById("products");

const searchInput =
  document.getElementById("searchInput");


let allProducts = [];
let selectedCategory = "";


/* =========================
   CHARGEMENT PRODUITS
========================= */

async function loadProducts() {

  console.log(
    "REVIBE : début chargement produits"
  );


  if (!productsContainer) {

    console.error(
      "REVIBE : #products introuvable"
    );

    return;
  }


  productsContainer.innerHTML = `
    <div class="empty">
      Chargement des produits...
    </div>
  `;


  try {

    /*
      Timeout de sécurité :
      si Supabase ne répond pas après 8 secondes,
      on affiche une erreur.
    */

    const request =
      db.rpc(
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


    const timeout =
      new Promise((_, reject) => {

        setTimeout(() => {

          reject(
            new Error(
              "Supabase ne répond pas après 8 secondes."
            )
          );

        }, 8000);

      });


    const result =
      await Promise.race([
        request,
        timeout
      ]);


    console.log(
      "REVIBE : réponse Supabase",
      result
    );


    const {
      data,
      error
    } = result;


    if (error) {

      console.error(
        "REVIBE : erreur RPC",
        error
      );


      productsContainer.innerHTML = `
        <div class="empty">

          <div style="
            font-weight:800;
            color:#c0392b;
          ">
            Erreur Supabase
          </div>

          <div style="
            margin-top:10px;
            font-size:13px;
            line-height:1.5;
          ">
            ${escapeHtml(
              error.message ||
              "Erreur inconnue"
            )}
          </div>

        </div>
      `;

      return;
    }


    console.log(
      "REVIBE : data reçue",
      data
    );


    let products = data;


    /*
      Si Supabase renvoie du JSON sous forme
      de texte, on le transforme en tableau.
    */

    if (
      typeof products === "string"
    ) {

      try {

        products =
          JSON.parse(products);

      } catch (e) {

        console.error(
          "JSON invalide",
          e
        );

        products = [];
      }
    }


    /*
      Sécurité si la réponse est :
      { products: [...] }
    */

    if (
      products &&
      !Array.isArray(products) &&
      Array.isArray(products.products)
    ) {

      products =
        products.products;
    }


    if (
      !Array.isArray(products)
    ) {

      products = [];
    }


    allProducts =
      products;


    console.log(
      "REVIBE : nombre de produits =",
      allProducts.length
    );


    displayProducts();

  } catch (error) {

    console.error(
      "REVIBE : erreur chargement",
      error
    );


    productsContainer.innerHTML = `
      <div class="empty">

        <div style="
          font-weight:800;
          color:#c0392b;
        ">
          Impossible de charger les produits
        </div>

        <div style="
          margin-top:10px;
          font-size:13px;
          line-height:1.5;
        ">
          ${escapeHtml(
            error.message ||
            "Erreur inconnue"
          )}
        </div>

      </div>
    `;
  }
}


/* =========================
   AFFICHAGE
========================= */

function displayProducts() {

  if (!productsContainer) {
    return;
  }


  const search =
    searchInput
      ? searchInput.value
          .trim()
          .toLowerCase()
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
          ""
        ).toLowerCase();


      const matchesSearch =
        !search ||
        name.includes(search) ||
        category.includes(search);


      const matchesCategory =
        !selectedCategory ||
        category ===
          selectedCategory
            .trim()
            .toLowerCase();


      return (
        matchesSearch &&
        matchesCategory
      );
    });


  if (
    filtered.length === 0
  ) {

    productsContainer.innerHTML = `
      <div class="empty">

        <i class="fa-solid fa-box-open"></i>

        <div style="
          margin-top:10px;
        ">
          Aucun produit disponible.
        </div>

      </div>
    `;

    return;
  }


  productsContainer.innerHTML =
    filtered
      .map(product => {

        const image =
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
                      alt=""
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
                  product.name ||
                  "Produit"
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
                Stock :
                ${Number(
                  product.stock || 0
                )}
              </div>

            </div>

          </article>
        `;

      })
      .join("");
}


/* =========================
   UTILITAIRES
========================= */

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

    const {
      data,
      error
    } = await db.rpc(
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
          Number(
            item.quantity || 0
          ),
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
   DÉMARRAGE IMMÉDIAT
========================= */

loadProducts();
updateCartCount();
