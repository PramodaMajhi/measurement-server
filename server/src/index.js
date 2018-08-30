const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const conf = require('./conf')
const {promisify} = require('util')

// Express

const app = express()
app.use(cors())
app.use(bodyParser.json())

// Redis

const redis = require('redis')
const client = redis.createClient({
  host: conf.redisHost,
  port: conf.redisPort,
  retry_strategy: () => 1000
})

client.on("error", function (err) {
  console.log("Error " + err);
})

const hgetAllAsync = promisify(client.hgetall).bind(client)

/*
let obj = {
    DOB: "1961-11-27",
    BiologicalSex: "Male",
    BloodType: "A+",
    FitzpatrickSkinType: "I",
    WheelchairUse: "no",
    Weight: {value: 113.85, uom: "Kg"},
    Height: {value: 1.98, uom: "M"}
}
*/

// Express routes

app.get('/', (req, res) => {
  res.send('Yo!')
})

app.get('/values', async (req, res) => {
  const obj = await hgetAllAsync('values')
  res.send(obj)
})
  
app.post('/healthData', (req, res) => {
  //console.log(JSON.stringify(req.body, null, 2))
  const body = req.body
  body.attributes.map(a => {
    //obj[a.attributeType] = a.attributeValue
    client.hset('values', a.attributeType, a.attributeValue)
  })
  body.measurements.map(m => {
    const value = {value: m.measurementValue, uom: m.unitOfMeasure}
    client.hset('values', m.measurementType, JSON.stringify(value))
    //obj[m.attributeType] = value
  })
  res.send({success: true})
})

app.listen(80, err => {
  console.log('Listening');
});