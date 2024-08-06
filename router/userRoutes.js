const express = require('express')
const router = express.Router();


router.get('/:id', (req, res) => {

    const id = req.params.id;
    console.log(id)
    if (id) {
        res.send(`User id is ${id}`)
    }
    else {
        res.send('User id is null')
    }
})

module.exports = router;