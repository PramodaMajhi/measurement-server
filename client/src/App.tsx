import * as React from 'react'
import TimeAgo from 'react-timeago'
import * as io from 'socket.io-client'
import conf from './conf'
import page from './img/page.png'
import { Meas } from './Measurement'
import {IData, IMeasurement} from './models/data'

import './App.css'

const initialState = {
  bmi: 0,
  changed: new Set<string>(), // the names of the keys that were changed in this state  
  heartRate: 0,
  heartRateSource: '',
  heartRateVariability: 0,
  heightFeet: 0,
  heightInches: 0,
  lastRecorded: new Date(),
  peakHeartRate: 0,
  restingHeartRate: 0,
  sleepHours: '----',
  stepsCount: 0,
  weight: 0,  
}

type State = Readonly<typeof initialState>

class App extends React.Component<object, State> {

  public readonly state: State = initialState

  constructor(props: {}) {
    super(props)
    const socket = io(`http://${conf.host}`)
    socket.on("update", (data: IData) => {
      this.load(data)
    })
  }

  // When the browser connects to the webSocket, the server sends an update message 
  // with the latest values. If for some reason it does not work, then use the "sync"
  // button to fetch from the /values endpoint.
  public componentDidMount() {
    // this.fetch()
  }

  // The sync button will also do a fetch
  public onSync = (e: any) => {
    e.preventDefault()
    this.fetch()
  }

  public async fetch() {
    const response = await fetch(`http://${conf.host}/values`)
    if (response.ok) {
      const data = await response.json()
      this.load(data)     
    }
  }

  public load(data: IData) {

    const height = this.convertHeight(data.Height)
    const weight = this.convertWeight(data.Weight)
    const bmi = this.calcBMI(data.Weight, data.Height)

    const newState : any = {
      bmi,
      heartRate: Number(data.HeartRate.value),
      heartRateSource: data.HeartRate.source,
      heartRateVariability: Number(data.HeartRateVariability.value),
      heightFeet: height.feet,
      heightInches: height.inches,
      peakHeartRate: 0,
      restingHeartRate: Number(data.RestingHeartRate.value),
      sleepHours: data.SleepHours.value,
      stepsCount: Number(data.StepsCount.value),
      weight: weight.pounds,
    }

    this.setState(state => {
      newState.changed = this.findChanges(state, newState)
      newState.lastRecorded = new Date()
      return newState
    })

    setInterval(()=> {
      this.setState(state => {
        return {...state, changed: new Set()}
      })
    }, 2000)
  }

  // returns the names of the keys where the value has changed from the previous value
  public findChanges(state: State, newState: State) : Set<string> {
    const changed = new Set()

    if (newState) {
      Object.keys(newState).forEach(key => {
        if (!(key in state) || state[key] !== newState[key]) {
          changed.add(key)
        }
      })
    }

    return changed
  }

  public convertHeight(height: IMeasurement) : {feet: number, inches: number, captured: string} {
    if (height) {
      if (height.uom === 'M') {
        const totalInches = Number(height.value) * 100 / 2.54
        const feet = Math.floor(totalInches / 12)
        const inches = Math.floor(totalInches % 12)
        const captured = `${height.value} M`
        return {feet, inches, captured}
      }
    }
    return {feet: 0, inches: 0, captured: 'n/a'}
  }

  public convertWeight(weight: IMeasurement) {
    if (weight) {
      if (weight.uom === 'Kg') {
        const pounds = Math.floor(Number(weight.value) * 2.20462)
        const captured = `${weight.value} Kg`
        return {pounds, captured}
      }
    }
    return {pounds: 0, captured: 'n/a'}
  }

  public calcBMI(weight: IMeasurement, height: IMeasurement) {
    if (height && weight && height.uom === 'M' && weight.uom === 'Kg') {            
      let bmi = Number(weight.value) / Math.pow(Number(height.value), 2)
      bmi = Math.round(bmi * 10) / 10
      return bmi
    }
    return 0
  }

  public render() {
    return (
      <div className="App" >
        <img className="img" src={page} />        
        <Meas name="restingHeartRate" uom="bpm" state={this.state} />
        <Meas name="peakHeartRate" uom="bpm" state={this.state}/>
        <Meas name="heartRateVariability" uom="ms" state={this.state} />
        <Meas name="stepsCount" uom="steps" state={this.state} />
        <Meas name="sleepHours" state={this.state} />
        <div className="lastRecorded">
          <span>Last recorded:</span>
          <span>{' '}</span>
          <TimeAgo date={this.state.lastRecorded} minPeriod={5}/>
        </div>
        <Meas name="heightFeet" state={this.state} />
        <Meas name="heightInches" state={this.state} />
        <Meas name="weight" state={this.state} />
        <Meas name="bmi" state={this.state} />
        <Meas name="heartRate" state={this.state} />
        <Meas name="heartRateSource" state={this.state} />

        <button className="sync" onClick={this.onSync} />
      </div>
    )
  }
}

export default App
