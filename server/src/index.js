const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

// Express

const app = express()
app.use(cors())
app.use(bodyParser.json())


let obj = {
    DOB: "1961-11-27",
    BiologicalSex: "Male",
    BloodType: "A+",
    FitzpatrickSkinType: "I",
    WheelchairUse: "no",
    Weight: {value: 113.85, uom: "Kg"},
    Height: {value: 1.98, uom: "M"}
}

// Express routes

app.get('/', (req, res) => {
  res.send('Yo!')
})

app.get('/values', async (req, res) => {  
  res.send(obj)
})
  
app.post('/healthData', (req, res) => {
  //console.log(JSON.stringify(req.body, null, 2))
  const body = req.body
  body.attributes.map(a => {
    obj[a.attributeType] = a.attributeValue    
  })
  body.measurements.map(m => {
    const value = {value: m.measurementValue, uom: m.unitOfMeasure}
    obj[m.measurementType] = value
  })
  res.send(obj)
})

app.listen(80, err => {
  console.log('Listening');
});