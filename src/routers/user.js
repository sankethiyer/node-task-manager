const express = require('express')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')
var multer = require('multer')
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancellationEmail } = require("../emails/account")

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken();
        res.send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/logout', auth, async (req, res) => {

    try {

        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token)
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})


router.post('/users/logoutAll', auth, async (req, res) => {

    try {

        req.user.tokens = [];
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})
// router.get('/users', auth, async (req, res) => {
//     try {
//         const users = await User.find({})
//         res.send(users)
//     } catch (e) {
//         res.status(500).send()
//     }
// })

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.get('/users/:id', async (req, res) => {
    const _id = req.params.id

    try {
        const user = await User.findById(_id)

        if (!user) {
            return res.status(404).send()
        }

        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})

// router.patch('/users/:id', async (req, res) => {
//     const updates = Object.keys(req.body)
//     const allowedUpdates = ['name', 'email', 'password', 'age']
//     const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

//     if (!isValidOperation) {
//         return res.status(400).send({ error: 'Invalid updates!' })
//     }

//     try {

//         const user = await User.findById(req.params.id)
//         updates.forEach((update) => user[update] = req.body[update])
//         await user.save()
//         //const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

//         if (!user) {
//             return res.status(404).send()
//         }

//         res.send(user)
//     } catch (e) {
//         res.status(400).send(e)
//     }
// })

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {

        const user = req.user
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})


// router.delete('/users/:id', async (req, res) => {
//     try {
//         const user = await User.findByIdAndDelete(req.params.id)

//         if (!user) {
//             return res.status(404).send()
//         }

//         res.send(user)
//     } catch (e) {
//         res.status(500).send()
//     }
// })
router.delete('/users/me', auth, async (req, res) => {
    try {        
        await req.user.remove();
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

var upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {

        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
            cb(new Error('invalid file extn'))
        }
        cb(null, true)
    }
})

router.post("/users/me/avatar", auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer)
        .resize({ width: 320, height: 240 }).png()
        .toBuffer();
    req.user.avatar = buffer;
    await req.user.save()
    res.send()
}, (err, req, res, next) => {
    res.status(500).send({ error: err.message })

})

router.delete("/users/me/avatar", auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save()
    res.send()
})

router.get("/users/:id/avatar", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-Type', 'image/jpg')
        res.send(user.avatar)
    } catch (error) {
        res.status(400).send()
    }
})
module.exports = router