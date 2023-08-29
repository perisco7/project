const bcrypt = require('bcrypt');
const express = require('express');
const { number, string } = require('joi');
require('dotenv').config()
const mongoose = require('mongoose')
const app = express();
const path = require('path')

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))

const userSchema = new mongoose.Schema({
  name:{type: String, required: true},
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password:{type: String, required: true},
});

const User = mongoose.model('User', userSchema);

app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'))

app.get('/', (req, res) =>{ 
  res.render('index')
})

app.get('/signup', (req, res) =>{
    res.sendFile(path.join(__dirname, './public/signup.html'))
})

app.post('/signup', async (req, res) => {
  const { name, username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    } 

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already exists' });
    } 
   
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

   
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
        });

   await newUser.save();
   res.redirect('/success') 
    
  } 
  catch (error) {
    res.status(500).json({ error: error });
  }

});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, './public/signin.html'))
  });
  
  
  app.post('/signin', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await User.findOne({ $or: [{ username }, { email: username }] });
  
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
  
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      res.redirect('/weather')
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

app.get('/weather', (req, res)=>{
  res.sendFile(path.join(__dirname, './public/weather.html'))
});

app.get('/success', (req, res)=>{
  res.sendFile(path.join(__dirname, './public/success.html'))
})


  app.listen(3000, () => console.log('Server Started'))