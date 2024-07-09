var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const upload = require("./multer");
const passport = require('passport');
const localstarategy = require("passport-local");
passport.use(new localstarategy(userModel.authenticate()));

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get("/login", function(req, res){
  res.render("login", {error : req.flash("error")});
});

router.get("/show", isLoggedIn ,function(req, res){
  res.render("show");
});

router.get("/profile",isLoggedIn ,async function(req, res){
  const user = await userModel.findOne({username : req.session.passport.user}).populate("posts")
  res.render("profile", {user});
});

router.post("/upload", upload.single("file"),async function(req, res){
  if(!req.file){
    res.status(404).send("Something Went Wrong");
  }
  const user = await userModel.findOne({username : req.session.passport.user});
  const postData = await postModel.create({
    image : req.file.filename,
    imagetext : req.body.title,
    user : user._id
  });
  user.posts.push(postData._id);
  await user.save();
  res.redirect("/profile");
});

router.post("/register", function(req, res){
  const userdata = new userModel({
    username : req.body.username,
    name : req.body.name
  })
  userModel.register(userdata, req.body.password).then(function(){
    passport.authenticate("local")(req, res, function(){
        res.redirect("/profile");
    });
  });
});

router.post("/login", passport.authenticate("local", {
  failureRedirect : "/login",
  successRedirect : "/profile",
  failureFlash : true
}), function(req, res){
});

router.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = router;
