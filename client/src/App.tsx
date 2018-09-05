import * as React from 'react'
import TimeAgo from 'react-timeago'
import * as io from 'socket.io-client'
import conf from './conf'
import page from './img/page.png'
import {IData, IMeasurement} from './models/data'

import './App.css'

const initialState = {
  bmi: 0,
  heartRate: 0,
  heartRateSource: '',
  heartRateVariability: 0,
  heightFeet: 0,
  heightInches: 0,
  lastRecorded: new Date(),
  peakHeartRate: 0,
  restingHeartRate: 0,
  sleepDuration: '0',
  stepCount: 0,
  weight: 0,
}

type State = Readonly<typeof initialState>

class App extends React.Component<object, State> {

  public readonly state: State = initialState

  constructor(props: {}) {
    super(props)
    const socket = io(`http://${conf.host}/`) // uses the scheme, url, port, etc. where the web page was serverd from
    socket.on("update", (data: IData) => {
      this.load(data)
    })
  }

  // we could get the initial values using the web socket
  // (see the server where we send an 'update' message to the socket on connect).
  // However, in case the web sockets is not working, get the initial data using 
  // the old-fashioned HTTP Get
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

    this.setState({
      bmi,
      heartRate: Number(data.HeartRate.value),
      heartRateSource: data.HeartRate.source,
      heartRateVariability: Number(data.HeartRateVariability.value),
      heightFeet: height.feet,
      heightInches: height.inches,
      lastRecorded: new Date(),
      peakHeartRate: 0,
      restingHeartRate: Number(data.RestingHeartRate.value),
      sleepDuration: data.SleepHours.value,
      stepCount: Number(data.StepsCount.value),
      weight: weight.pounds,
    })
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
        <div className="restingHeartRate">{this.state.restingHeartRate} bpm</div>
        <div className="peakHeartRate">{this.state.peakHeartRate === 0 ? '' : `${this.state.peakHeartRate} bpm`}</div>
        <div className="heartRateVariability">{this.state.heartRateVariability} ms</div>
        <div className="stepCount">{this.state.stepCount} steps</div>
        <div className="sleepDuration">{this.state.sleepDuration}</div>
        <div className="lastRecorded">
          <span>Last recorded:</span>
          <span>{' '}</span>
          <span><TimeAgo date={this.state.lastRecorded} minPeriod={5}/></span>
        </div>
        <div className="heightFeet">{this.state.heightFeet}</div>
        <div className="heightInches">{this.state.heightInches}</div>
        <div className="weight">{this.state.weight}</div>
        <div className="bmi">{this.state.bmi}</div>        
        <div className="heartRate">{this.state.heartRate}</div>
        <div className="heartRateSource">{this.state.heartRateSource}</div>
        <button className="sync" onClick={this.onSync} />
      </div>       
    )
  }
}

export default App
