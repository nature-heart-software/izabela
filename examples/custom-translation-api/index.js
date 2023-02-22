const express = require('express')
const app = express()
const port = 3000
const pkg = require('./package.json')
const say = require('say')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const axios = require('axios')

// Change this depending on your environment
const ENDPOINT_BASE_URL = 'http://localhost'
const ENDPOINT_PORT = 3000

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/languages', async (req, res) => {
  try {
    const {
      body: {
        credentials: {
          apiKey, // API key provided by the user if required
        },
      },
    } = req
    console.log(req.body)
    res.status(200).json({
      // array of language codes that can be translated from
      from: [
        {
          id: 'English',
          name: 'English',
          languageCode: 'en',
        },
      ],
      // array of language codes that can be translated to
      to: [
        {
          id: 'Japanese',
          name: 'Japanese',
          languageCode: 'jp',
        },
        {
          id: 'Shakespearean English',
          name: 'English',
          languageCode: 'shakespearean',
        },
      ],
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
app.post('/translate', async (req, res) => {
  try {
    const {
      body: {
        credentials: {
          apiKey, // API key provided by the user if required
        },
        payload: {
          text, // text to be translated
          from, // language code of the text
          to, // language code of the translation
        },
      },
    } = req
    console.log(req.body)
    const { data } = await axios.post(
      // this api is limited to a few calls per day, so it might stop working while you develop
      'https://api.funtranslations.com/translate/shakespeare.json',
      {
        text,
      },
    )
    res.status(200).json(data.contents.translated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(port, () => {
  console.log(
    `[${pkg.name}] API endpoint: ${ENDPOINT_BASE_URL}${
      ENDPOINT_PORT ? `:${ENDPOINT_PORT}` : ''
    }`,
  )
})
