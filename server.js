import express from "express";
import { db } from "./firebase.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const app = express();
app.use(express.json());

// Swagger setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Products API",
      version: "1.0.0",
      description: "HTTP REST API for managing products",
    },
  },
  apis: ["./server.js"],
};
const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get a paginated and sorted list of products
 *     parameters:
 *       - in: query
 *         name: pageIndex
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number (1-indexed)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [price, name]
 *           default: name
 *         description: The field to sort by
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: The sort direction (ascending or descending)
 *     responses:
 *       200:
 *         description: A paginated list of products
 *       500:
 *         description: Server error
 */
app.get("/products", async (req, res) => {
  try {
    const pageIndex = parseInt(req.query.pageIndex) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortField = req.query.sortField === "price" ? "price" : "name";
    const sortDirection = req.query.sort === "desc" ? "desc" : "asc";

    const offset = (pageIndex - 1) * pageSize;

    const totalSnapshot = await db.collection("products").get();
    const totalCount = totalSnapshot.size;

    const snapshot = await db
      .collection("products")
      .orderBy(sortField, sortDirection)
      .offset(offset)
      .limit(pageSize)
      .get();
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      totalCount: totalCount,
      pageIndex: pageIndex,
      pageSize: pageSize,
      products: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "No products found" });
  }
});

/**
 * @swagger
 * /products/expensivest:
 *   get:
 *     summary: Get the most expensive product
 *     responses:
 *       200:
 *         description: Returns the product with the highest price
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 price:
 *                   type: number
 *       404:
 *         description: No products found
 */
app.get("/products/expensivest", async (req, res) => {
  const snapshot = await db
    .collection("products")
    .orderBy("price", "desc")
    .limit(1)
    .get();
  if (snapshot.empty)
    return res.status(404).json({ error: "No products found" });

  const product = snapshot.docs[0];
  res.json({ id: product.id, ...product.data() });
});

/**
 * @swagger
 * /products/cheapest:
 *   get:
 *     summary: Get the cheapest product
 *     responses:
 *       200:
 *         description: Returns the product with the lowest price
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 price:
 *                   type: number
 *       404:
 *         description: No products found
 */
app.get("/products/cheapest", async (req, res) => {
  const snapshot = await db
    .collection("products")
    .orderBy("price", "asc")
    .limit(1)
    .get();
  if (snapshot.empty)
    return res.status(404).json({ error: "No products found" });

  const product = snapshot.docs[0];
  res.json({ id: product.id, ...product.data() });
});

/**
 * @swagger
 * /products/median:
 *   get:
 *     summary: Get the median product by price
 *     responses:
 *       200:
 *         description: Returns the median product based on ascending price
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 price:
 *                   type: number
 *       404:
 *         description: No products found
 */
app.get("/products/median", async (req, res) => {
  try {
    const snapshot = await db
      .collection("products")
      .orderBy("price", "asc")
      .get();
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }

    const mid = Math.floor(products.length / 2);
    let medianProduct;

    if (products.length % 2 === 1) {
      medianProduct = products[mid];
    } else {
      medianProduct = [products[mid - 1], products[mid]];
    }

    res.json(medianProduct);
  } catch (error) {
    console.error("Error fetching median products:", error);
    res.status(500).json({ error: "Could not retrieve median product" });
  }
});

/**
 * @swagger
 * /products/count:
 *   get:
 *     summary: Get the total number of products
 *     responses:
 *       200:
 *         description: Count of products
 */
app.get("/products/count", async (req, res) => {
  const snapshot = await db.collection("products").get();
  res.json({ count: snapshot.size });
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Add a new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product added
 *       400:
 *         description: Invalid input
 */
app.post("/products", async (req, res) => {
  const { id, name, price } = req.body;
  if (!id || !name)
    return res.status(400).json({ error: "id and name are required" });

  await db.collection("products").doc(id.toString()).set({ id, name, price });
  res.status(201).json({ id, name, price });
});

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product object
 *       404:
 *         description: Product not found
 */
app.get("/products/:id", async (req, res) => {
  const doc = await db.collection("products").doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: "Product not found" });
  res.json({ id: doc.id, ...doc.data() });
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
app.delete("/products/:id", async (req, res) => {
  const doc = await db.collection("products").doc(req.params.id).get();
  if (!doc.exists) return res.status(404).json({ error: "Product not found" });
  await db.collection("products").doc(req.params.id).delete();
  res.json({ message: "Product deleted" });
});

/**
 * @swagger
 * /products:
 *   delete:
 *     summary: Delete all products
 *     responses:
 *       200:
 *         description: All products deleted
 */
app.delete("/products", async (req, res) => {
  const snapshot = await db.collection("products").get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  res.json({ message: "All products deleted" });
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
