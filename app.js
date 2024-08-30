const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const {
  checkForAuthenticationCookie,
} = require("./middlewares/authentication");
const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");
const User = require("./models/user");
const Blog = require("./models/blog");
dotenv.config();

const app = express();
const PORT = process.env.PORT;

mongoose
  .connect("mongodb://localhost/blogify")
  .then(() => {
    console.log("MongoDB is connected!");
  })
  .catch((err) => {
    console.log("Error", err);
  });

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public")));

app.get("/", async (req, res) => {
  let user;
  let blogs = await Blog.find({});
  if (req.user) {
    user = await User.findById(req.user._id);


    // console.log("user", user);
    user = { ...user._doc, password: undefined, salt: undefined };
  } else {
    user = req.user;
  }

  return res.render("home", {
    user: user,
    blogs: blogs,
  });
});

app.use("/user", userRoute);
app.use("/blog", blogRoute);

app.listen(PORT, () => {
  console.log(`Server Started at port - ${PORT}`);
});
