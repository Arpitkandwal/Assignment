const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/user');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MongoStore = require('connect-mongo');

const app = express();
const port =  3000;

const dbUrl = 'mongodb+srv://user2004:newuser@cluster0.grqudlp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Replace with your actual MongoDB URI

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Running');
});

const store = MongoStore.create({
    mongoUrl: dbUrl,
    collection: 'sessions',
    ttl: 24 * 60 * 60, // Set session TTL (optional)
});

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    store: store,
}));

// Rest of your code...



app.engine('ejs',ejsMate);
app.set('view engine','ejs');
app.set('views', path.join(__dirname,'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));


const sessionConfig = {
    store,
    secret:'thisshouldbeabettersecret',
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly: true,
        // secure: true,
        expires:Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));


app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
}); 


app.get('/',(req,res)=>{
    res.render('home');
});

app.get('/login', (req,res)=> {
    res.render('users/login');
});

app.get('/register', (req,res)=> {
    res.render('users/register');
});

// app.post('/login', (req,res) => {
//     passport.authenticate('local', {failureFlash:true, failureRedirect:'/login', keepSessionInfo:true})
//     const redirectUrl = req.session.returnTo || '/';
//     delete req.session.returnTo;
//     res.redirect(redirectUrl);
// });


app.post('/login', passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/login',
    successFlash: 'Welcome back!',
    successRedirect: '/' // You can set the redirect URL after successful login
})
);


app.post('/register', async (req, res, next) => {
    const { email, username, password } = req.body;
    const user = new User({ email, username });
    try {
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash('success', 'Welcome Aboard!');
            res.redirect('/');
        });
    } catch (e) {
        req.flash('error', 'A user with this username or email is already registered');
        res.redirect('/register');
    }
});


app.get('/logout', (req,res,next) => {
    req.logout(function(err){
        if(err){
          return next(err);
        }
        req.flash('success','GoodBye!');
        res.redirect('/');
          });
})



app.listen(process.env.PORT || port,()=>{
    console.log("Listening on Port 3000!");
})