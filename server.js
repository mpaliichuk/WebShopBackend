import { createServer } from "http";
const PORT = process.env.PORT;

let products = [
  { id: 1, name: "Apple", price: 123.12 },
  { id: 2, name: "Orange", price: 300.5 },
  { id: 3, name: "Lime", price: 200.1 },
  { id: 11, name: "Strawberry", price: 100.13 },
];

// Logger middleware
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

// JSON middleware
const jsonMiddleware = (req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
};

const sendJSON = (res, status, data) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

// Route handler for GET /products
const getProductsHandler = (req, res) => {
  res.write(JSON.stringify(products));
  res.end();
};

// Rounter handler for GET /products/id
const getProductByIdHandler = (req, res) => {
  const id = req.url.split("/")[2];
  const product = products.find((product) => product.id === parseInt(id));

  if (product) {
    res.write(JSON.stringify(product));
  } else {
    res.statusCode = 404;
    res.write(JSON.stringify({ message: "Product not found" }));
  }
  res.end();
};

// Rounter handler for GET /products/expensivest
const getExpensivestProduct = (req, res) => {
  const expensivestProduct = products.reduce((maxProduct, product) =>
    product.price > maxProduct.price ? product : maxProduct
  );

  if (expensivestProduct) {
    res.write(JSON.stringify(expensivestProduct));
  } else {
    res.statusCode = 404;
    res.write(JSON.stringify({ message: "Product not found" }));
  }
  res.end();
};

// Rounter handler for GET /products/cheapest
const getCheapestProduct = (req, res) => {
  const cheapestProduct = products.reduce((minProduct, product) =>
    product.price < minProduct.price ? product : minProduct
  );

  if (cheapestProduct) {
    res.write(JSON.stringify(cheapestProduct));
  } else {
    res.statusCode = 404;
    res.write(JSON.stringify({ message: "Product not found" }));
  }
  res.end();
};

// Rounter handler for GET /products/median
const getMedianProduct = (req, res) => {
  if (products.length === 0) return null;

  const sorted = [...products].sort((a, b) => a["id"] - b["id"]);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 !== 0) {
    res.write(JSON.stringify(sorted[mid]));
  } else {
    res.write(JSON.stringify([sorted[mid - 1], sorted[mid]]));
  }

  res.end();
};

// Rounter handler for DELETE /products/id
const deleteProductByIdHandler = (req, res) => {
  const match = req.url.match(/^\/products\/(\d+)$/);
  if (match && req.method === "DELETE") {
    const id = parseInt(match[1]);
    const index = products.findIndex((u) => u.id === id);

    if (index === -1) {
      return sendJSON(res, 404, { error: "Product not found" });
    }

    products.splice(index, 1);
    return sendJSON(res, 200, {
      message: `Product with id: '${id}' deleted`,
    });
  } else {
    // Not found
    sendJSON(res, 404, { error: "Not Found" });
  }

  res.end();
};

// Route handler for POST /products
const createProductHandler = (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", () => {
    const newProduct = JSON.parse(body);
    if (!newProduct || newProduct.name.trim() === "") {
      return sendJSON(res, 400, { message: "Name is required" });
    }
    products.push(newProduct);
    res.statusCode = 201;
    res.write(JSON.stringify(newProduct));
    res.end();
  });
};

// Not found handler
const notFoundHandler = (req, res) => {
  res.statusCode = 404;
  res.write(JSON.stringify({ message: "Route not found" }));
  res.end();
};

const server = createServer((req, res) => {
  logger(req, res, () => {
    jsonMiddleware(req, res, () => {
      if (req.url === "/products" && req.method === "GET") {
        getProductsHandler(req, res);
      } else if (req.url.match(/^\/products\/(\d+)$/) && req.method === "GET") {
        getProductByIdHandler(req, res);
      } else if (req.url === "/products" && req.method === "POST") {
        createProductHandler(req, res);
      } else if (req.url === "/products/count" && req.method === "GET") {
        return sendJSON(res, 200, { count: products.length });
      } else if (req.url === "/products/expensivest" && req.method === "GET") {
        getExpensivestProduct(req, res);
      } else if (req.url === "/products/cheapest" && req.method === "GET") {
        getCheapestProduct(req, res);
      } else if (req.url === "/products/median" && req.method === "GET") {
        getMedianProduct(req, res);
      } else if (req.url === "/products" && req.method === "DELETE") {
        products = [];
        return sendJSON(res, 200, { message: "All products deleted" });
      } else if (
        req.url.match(/^\/products\/(\d+)$/) &&
        req.method === "DELETE"
      ) {
        deleteProductByIdHandler(req, res);
      } else {
        notFoundHandler(req, res);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
