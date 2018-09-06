const express = require('express')
const http = require('http')
const bodyParser = require('body-parser')
const cors = require('cors')
const socket = require('socket.io')
const path = require('path')

// Express

const app = express()
const server = http.Server(app)
const io = socket(server)

app.use(cors())
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '../build')));

let obj = {
    DOB: "1961-11-27",
    BiologicalSex: "Male",
    BloodType: "A+",
    FitzpatrickSkinType: "I",
    WheelchairUse: "no",
    Weight: {
        value: "99.34",
        uom: "Kg",
        source: ""
    },
    Height: {
        value: "1.70",
        uom: "M",
        source: ""
    },
    RestingHeartRate: {
        value: "81",
        uom: "bpm",
        source: ""
    },
    HeartRateVariability: {
        value: "90",
        uom: "ms",
        source: ""
    },
    StepsCount: {
        value: "7566",
        uom: "Count",
        source: ""
    },
    HeartRate: {
        value: "79",
        uom: "Bpm",
        source: "Apple Watch"
    },
    SleepHours: {
        value: "7h 22m",
        uom: "Ms",
        source: ""
    }
}

// Express routes

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
})

app.get('/values', async (req, res) => {  
  res.send(obj)
})
  
app.post('/healthData', (req, res) => {
  //console.log(JSON.stringify(req.body, null, 2))
  if (req && req.body) {
    const body = req.body
    if (body.attributes) {
      body.attributes.map(a => {
        obj[a.attributeType] = a.attributeValue    
      })
    }
    if (body.measurements) {
      body.measurements.map(m => {
        const value = {value: m.measurementValue, uom: m.unitOfMeasure, source: m.source || ""}
        obj[m.measurementType] = value
      })
    }
  }
  io.emit('update', obj);
  res.send(obj)
})

io.on('connection', socket => {
  console.log('a user connected')
  // as each client connects, send them the latest version of update
  socket.emit('update', obj)
  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
})

server.listen(80, err => {
  console.log('Listening');
})