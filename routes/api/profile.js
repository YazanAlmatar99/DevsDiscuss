const express = require("express")
const auth = require("../../middleware/auth")
const router = express.Router();
const config = require('config')
const Profile = require("../../models/Profile")
const User = require("../../models/User")
const request = require("request")
const {check, validationResult} = require("express-validator");
const { response } = require("express");
// @route  GET api/profile/me
// @desc   Get current users profile
// @access Private
router.get("/me",auth,async (req,res)=> {
    try {
        //populate() will get name and avatar from the user model
        const profile = await Profile.findOne({user:req.user.id}).populate("user",['name','avatar'])
        if (!profile) {
            return res.status(400).json({msg:"There is no profile for this user"})
        }
        res.json(Profile)
    } catch(err) {
         console.log(err.message);
         res.status(500).send("Server Error")
    }
});

// @route  POST api/profile/profile
// @desc   Create or update a user Profile
// @access Private
router.post("/",[auth,[
    check("status","Status is required").not().isEmpty(),
    check("skills","Skills is required").not().isEmpty()
]],async (req,res)=> {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array})
    }
    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    //Build profile object

    const profileFields = {}
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if(website) profileFields.website = website;
    if (location) profileFields.location = location;
    if(bio) profileFields.bio = bio;
    if(status) profileFields.status = status;
    if(githubusername) profileFields.githubusername = githubusername;
    if (skills) {
        profileFields.skills = skills.split(",").map(skill => skill.trim())
    }

    //Build Social object
    profileFields.social = {}
    if (youtube) profileFields.social.youtube = youtube;
    if (youtube) profileFields.social.twitter = twitter;
    if (youtube) profileFields.social.facebook = facebook;
    if (youtube) profileFields.social.linkedin = linkedin;
    if (youtube) profileFields.social.instagram = instagram;
    

    try {
        let profile = await Profile.findOne({user:req.user.id})
        console.log(req.user.id,"idddddddd")
        if (profile) {
            //Update profile
            profile = await Profile.findOneAndUpdate({user:req.user.id},{
                $set:profileFields
            },{new:true})
        }
        //Create
        else {
            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);
        }
    } catch(err) {
        console.error(err.message);
        res.status(500).send("Server Error")
    }
    res.send(profileFields)

})

// @route  GET api/profile
// @desc   Get all profiles
// @access Public
router.get("/",async(req,res)=> {
    try {
        const profiles = await Profile.find().populate("user",["name","avatar"])
        res.json(profiles)
    } catch(err) {
        console.error(err.message)
        res.status(500).send("Server Error")
    }
})


// @route  GET api/profile/user/:user_id
// @desc   Get profile by user ID
// @access Public
router.get("/user/:user_id",async(req,res)=> {
    try {
        const profile = await Profile.findOne({user:req.params.user_id}).populate("user",["name","avatar"])
        if (!profile) return res.status(400).json({msg:"Profile Not Found"})
        
        res.json(profile)
    } catch(err) {
        console.error(err.message)
        if (err.kind == 'ObjectId') {
            return res.status(400).json({msg:"Profile Not Found"})
        }
        res.status(500).send("Server Error")
    }
})


// @route  DELETE api/profile
// @desc   Delete profile, user & post
// @access Private
router.delete("/",auth,async(req,res)=> {
    try {
        // @todo - remove users posts
        //Remove Profile
        await Profile.findOneAndRemove({user:req.user.id})  
        
        await User.findOneAndRemove({_id:req.user.id})        

        res.json({msg:"User Deleted"})
    } catch(err) {
        console.error(err.message)
        if (err.kind == 'ObjectId') {
            return res.status(400).json({msg:"Profile Not Found"})
        }
        res.status(500).send("Server Error")
    }
})

// @route  PUT api/profile/experience
// @desc   Add profile experience
// @access Private

router.put("/experience",[auth,
 [
     check('title',"Title is required").not().isEmpty(),
     check('company',"Company is required").not().isEmpty(),
     check('from',"From date is required").not().isEmpty()

 ]   
], async(req,res)=> {
    const errors = validationResult(req)
    if (!errors.isEmpty){
        return res.status(400).json({errors:errors.array})
    }
    const {title,company,from,location,to,current,description} = req.body;

    const newExperience = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }
    try {
        const profile = await Profile.findOne({user:req.user.id})
        profile.experience.unshift(newExperience)
        await profile.save()
        res.json({profile})
    } catch (err) {
        console.log(err)
        res.status(500).send("Server Error")
    }
})

// @route  DELETE api/profile/experience/experience_id
// @desc   Delete profile experience
// @access Private

router.delete("/experience/:experience_id",auth,async (req,res)=> {
    try {
        const profile = await Profile.findOne({user:req.user.id})
        //Get remove index
        const removeIndex = profile.experience.map(item=>item.id).indexOf(req.params.experience_id)
        profile.experience.splice(removeIndex,1)
        await profile.save();
        res.json(profile)
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error")
    }
})




// @route  PUT api/profile/education
// @desc   Add profile education
// @access Private

router.put("/education",[auth,
    [
        check('school',"School is required").not().isEmpty(),
        check('degree',"Degree is required").not().isEmpty(),
        check('from',"From date is required").not().isEmpty(),
        check('fieldofstufy',"Field Of Study is required").not().isEmpty()
   
    ]   
   ], async(req,res)=> {
       const errors = validationResult(req)
       if (!errors.isEmpty){
           return res.status(400).json({errors:errors.array})
       }
       const {school,fieldofstudy,from,degree,to,current,description} = req.body;
   
       const newEducation = {
           school,
           fieldofstudy,
           degree,
           from,
           to,
           current,
           description
       }
       try {
           const profile = await Profile.findOne({user:req.user.id})
           profile.education.unshift(newEducation)
           await profile.save()
           res.json({profile})
       } catch (err) {
           console.log(err)
           res.status(500).send("Server Error")
       }
   })
   
   // @route  DELETE api/profile/education/education_id
   // @desc   Delete profile education
   // @access Private
   
   router.delete("/education/:education_id",auth,async (req,res)=> {
       try {
           const profile = await Profile.findOne({user:req.user.id})
           //Get remove index
           const removeIndex = profile.education.map(item=>item.id).indexOf(req.params.education_id)
           profile.education.splice(removeIndex,1)
           await profile.save();
           res.json(profile)
       } catch (err) {
           console.log(err);
           res.status(500).send("Server Error")
       }
   })
   
   // @route  GET api/profile/github/:username
   // @desc   Get user repos from Github
   // @access Public
   router.get("/github/:username",async (req,res)=>{
       try {
           const options = {
               uri:`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&cliend_id=${config.get("githubClientId")}&client_secret=${config.get("githubSecret")}`,
               method:"GET",
               headers:{'user-agent':'node.js'}
           }
           request(options,(error,response,body)=> {
               if (error) console.error(error)
               if (response.statusCode !== 200) {
                   return res.status(400).json({msg:"No GitHub profile found"})
               }
               res.json(JSON.parse(body))
           })
       } catch (err) {
           console.log(err)
           res.status(500).send("Server Error")
       }
   })
module.exports = router;
