const express = require("express");
const { check, validationResult } = require("express-validator/check");
const router = express.Router();
const User = require('../../models/User')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('config')

//@route  POST api/users
//@desc   Register User
//@access Public
router.post("/",[
    check('name','Name is required').not().isEmpty(),
    check("email",'Please Include a valid email').isEmail(),
    check("password",'Please enter a password with 6 or  more characters').isLength({min:8})
],async (req,res)=> {
    const errors = validationResult(req)
    if (!errors.isEmpty()){
        //send back error message
        return res.status(400).json({errors: errors.array()})
    }
    const {name,email,password} = req.body;
    try {
    //See if user exists
        let user = await User.findOne({email})
        if (user) {
            return res.status(400).json({errors:[{msg:"User already exists"}]})
        }
    //Get users gravatar
    const avatar = gravatar.url(email,{
        //s = size
        s: '200',
        //r = rating
        r:'pg',
        //d = default
        d:'mm'
    })
    user = new User({
        name,
        email,
        avatar,
        password
    })
    //Encrypt password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password,salt)
    await user.save()

    //Return jsonwebtoken
    const payload = {
        user:{
            id:user.id
        }
    }
    jwt.sign(payload, config.get('jwtToken'),
    {expiresIn:360000},
    (err,token)=> {
        if (err) throw err;
        res.json({token})
    })
    } catch(err) {
        console.log(err.message)
        res.status(500).send("Server Error")
    }
    
});

module.exports = router;