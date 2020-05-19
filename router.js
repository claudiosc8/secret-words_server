const express = require('express');
const router = express.Router();
const Words = require('./models/Words.js')
const User = require('./models/User.js');
const authenticateToken = require('./middleware');
const jwt = require('jsonwebtoken');
const paginate = require('jw-paginate')
const async = require('async');

router.get('/', (req, res) => {
  res.send('server is up and running')

})

router.get('/checkToken', authenticateToken, function(req, res) {
    res.sendStatus(200);
})

const getPager = (query, items) => {

    const page = parseInt(query) || 1;
    const pageSize = 15;
    const pager = paginate(items.length, page, pageSize);
    const pageOfItems = items.slice(pager.startIndex, pager.endIndex + 1);

    return {pager, pageOfItems}
}

router.get('/dashboard', authenticateToken, async function(req, res) {
    
  try {
    const words = await Words.find();

    const { pager, pageOfItems } = getPager(req.query.page, words)

    return res.status(200).send({ pager, pageOfItems });

  } catch (error) {
    res.status(400).send({error})
  }

})

router.get('/words', async (req, res) => {

  try {
    const words = await Words.find();
    res.json(words)
  } catch (err) {
    res.json({message: err});
  }
  
})

router.get('/words/:search', authenticateToken, async (req, res) => {

  const regex = req.params.search
  
  try {
    const words = await Words.find({  $or: [
        { "name": { "$regex": regex, "$options": "i" } },
        { "it": { "$regex": regex, "$options": "i" } },
        { "es": { "$regex": regex, "$options": "i" } },
    ] });

    const { pager, pageOfItems } = getPager(req.query.page, words)
    
    return res.status(200).send({ pager, pageOfItems });

  } catch (error) {
    res.status(400).send({error})
  }

})

router.post('/words', authenticateToken, (req, res) => {
  Words.insertMany(req.body, {ordered:false, rawResult: true}, async (err, word)  =>{
    if (err) return res.json(err)
    res.json(word)
  });
})

router.patch('/words', authenticateToken, async (req, res) => {

    const items = req.body

    async.eachSeries(items, function updateObject (item, done) {

        const {_id, name, it, es} = item
        Words.findByIdAndUpdate(_id, {name, it, es}, { useFindAndModify: false, new: true }, done);

    }, function allDone (error) {
        
        if(error) {
          res.status(400).send({error})
        }

        res.status(200).send({success:true, message:`${items.length} item${items.length > 1 ? 's' : ''} updated successfully`})
    });

})

router.delete('/words', authenticateToken, async (req, res) => {

    const items = req.body.selected;

    const deletedItem = await Words
    .deleteMany({ _id: { $in: items } })
    .catch(error => res.status(400).send({error}))

    res.status(200).send({success:true, message:`${items.length} item${items.length > 1 ? 's' : ''} deleted successfully`})
   
})

router.post('/api/register', authenticateToken, function(req, res) {
  const { email, password } = req.body;
  const user = new User({ email, password });
  user.save(function(error) {
    if (error) {
      res.status(500).send({error});
    } else {
      res.status(200).send({success:true, message:'User Registered successfully'});
    }
  });
});

router.post('/api/authenticate', function(req, res) {
  const { email, password } = req.body;
  User.findOne({ email }, function(err, user) {
    if (err) {
      console.error(err);
      res.status(500)
        .json({
        error: 'Internal error please try again'
      });
    } else if (!user) {
      res.status(401)
        .json({
          error: 'Incorrect email or password'
        });
    } else {
      user.isCorrectPassword(password, function(err, same) {
        if (err) {
          res.status(500)
            .json({
              error: 'Internal error please try again'
          });
        } else if (!same) {
          res.status(401)
            .json({
              error: 'Incorrect email or password'
          });
        } else {
          // Issue token

          const secret = process.env.JWT_SECRET;
          const payload = {
        iss: process.env.JWT_ISSUER,
        sub: "codenames",
        aud: "admin",
        email: email,
      };

          const token = jwt.sign(payload, secret, {
            expiresIn: '1h'
          });
          // res.cookie('token', token, { httpOnly: true })
          //   .sendStatus(200);
          res.json({token})
        }
      });
    }
  });
});

module.exports = router;