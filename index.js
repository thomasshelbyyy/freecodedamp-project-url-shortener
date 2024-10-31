require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const shortid = require('shortid');
const validUrl = require("valid-url")
const app = express();

// Basic Configuration
const port = process.env.PORT || 3001;
const uri = process.env.MONGO_URI
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})

const connection = mongoose.connection
connection.on("error", console.error.bind(console, "connection error: "))
connection.once("open", ()=> {
  console.log("MongoDB database connection established succesfully")
})

const Schema = mongoose.Schema
const urlSchema = new Schema({
  original_url: String,
  short_url: String
})
const URL = mongoose.model("URL", urlSchema)

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));


app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Endpoint pertama
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post("/api/shorturl", async function(req, res) {
  const url = req.body.url
  console.log(url)
  const urlCode = shortid.generate()

  if(!validUrl.isWebUri(url)) {
    res.json({ error: 'invalid url' })
  } else {
    try {
      let findOne = await URL.findOne({
        original_url: url
      })

      if(findOne) {
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      } else {
        findOne = new URL({
          original_url: url,
          short_url: urlCode
        })
        await findOne.save()
        res.json({
          original_url: findOne.original_url,
          short_url: findOne.short_url
        })
      }
    } catch(error) {
      console.log(error)
      res.status(500).json("server error")
    }
  }
})

app.get("/api/shorturl/:short_url?", async function(req, res) {
  try {
    const urlParams = await URL.findOne({
      short_url: req.params.short_url
    })

    if(urlParams) {
      return res.redirect(urlParams.original_url)
    } else {
      return res.status(404).json("URL not found")
    }
  } catch(error) {
    console.log(error)
    res.status(500).json("Server error")
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
