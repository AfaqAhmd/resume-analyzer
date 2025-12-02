const express = require("express");
const dbCon = require("./DB/dbConnection");
const router = require("./Router/route")
const cors = require("cors");
const path = require("path");

const PORT = 5000 || process.env.PORT;
const app = express();


// app.use(cors({

//   origin: "http://127.0.0.1:5500", // frontend Live Server URL
//   credentials: true
  
// }));

app.use(cors({
  origin: "http://localhost:5000",
  credentials: true,
}));



// Serve static files (HTML, CSS, JS) from the public directory
app.use(express.static(path.join(__dirname, "public")));  // Serve files from the 'public' folder

// Route for handling the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html")); // Serve index.html
});

// Test Route
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html")); // Serve login.html
});


app.use(express.json());
dbCon()

app.use("/api", router);

app.listen(PORT, () => {

  console.log(`Server is running ${PORT}`);

});