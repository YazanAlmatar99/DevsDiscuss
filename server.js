const express = require("express");
const connectDB = require('./config/db')

const app = express();
//Connect DB
connectDB();
//Init Middlware
app.use(express.json({extended:false}))


app.get("/",(req,res)=> {
    res.send("hello to the homepage")
})
//Define routes
app.use('/api/users',require('./routes/api/users'))
app.use('/api/auth',require('./routes/api/auth'))
app.use('/api/profile',require('./routes/api/profile'))
app.use('/api/posts',require('./routes/api/posts'))

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=> console.log(`Server running on ${PORT}`))