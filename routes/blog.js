const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const Blog = require("../models/blog");
const User = require("../models/user");
const Comment = require("../models/comment");

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    return cb(null, path.resolve("./public/uploads/"));
  },
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

router.get("/add-new", async (req, res) => {
  let user;
  if (req.user) {
    user = await User.findById(req.user._id);

    // console.log("user", user);
    user = { ...user._doc, password: undefined, salt: undefined };
  } else {
    user = req.user;
  }
  return res.render("addBlog", {
    user: user,
  });
});

router.get("/:id", async (req, res) => {
  // const id = req.params.id;
  // console.log(req);
  // console.log(req);
  if (req.params.id.split(".").includes("jpg")) {
    return res.render("blog");
  }
  // const blog = await Blog.findById(req.params.id).populate("createdBy");
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comment = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy"
  );

  console.log("---->blogs : ", blog);
  console.log("---->comments : ", comment);

  let user;
  if (req.user) {
    user = await User.findById(blog.createdBy);
  }

  return res.render("blog", {
    blog,
    user,
    comments: comment,
  });
});

router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  // console.log(title,body);

  const blog = await Blog.create({
    title: title,
    body: body,
    createdBy: req.user._id,
    coverImageURL: `/uploads/${req.file.filename}`,
  });

  return res.redirect(`/blog/${blog._id}`);
});

router.get("/edit/:id", async (req, res) => {
  console.log("req.user : ", req.user);
  if (!req.user) {
    return res.redirect("/user/signin");
  }
  const user = await User.findById(req.user._id);

  const id = req.params.id;
  const blog = await Blog.findById(id);
  const { title, body } = blog;
  res.render("editBlog", {
    title,
    body,
    blog,
    user,
  });
});

router.post("/edit/:id", upload.single("coverImage"), async (req, res) => {
  const id = req.params.id;
  const { title, body } = req.body;

  const blog = await Blog.findById(id);

  let filename = blog.coverImageURL.split("/")[2];

  if (req.file) {
    filename = req.file.filename;
  }

  await Blog.findByIdAndUpdate(id, {
    title,
    body,
    coverImageURL: `/uploads/${filename}`,
  });
  console.log("filename ", filename);

  return res.redirect("/");
});

router.get("/delete/:id", async (req, res) => {
  if (!req.user) {
    return res.redirect("/user/signin");
  }
  const id = req.params.id;
  const deletedBlogs = await Blog.findByIdAndDelete(id);
  console.log(deletedBlogs);
  return res.redirect("/");
});

router.post("/comment/:blogId", async (req, res) => {
  // console.log("----> user : ", req.body.content);
  const { content } = req.body;
  if (!req.user) return res.redirect("/user/signin");
  if (!content) {
    return res.redirect(`/blog/${req.params.blogId}`);
  }

  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });

  return res.redirect(`/blog/${req.params.blogId}`);
});

module.exports = router;
