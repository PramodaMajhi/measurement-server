import * as React from 'react'
import TimeAgo from 'react-timeago'
import * as io from 'socket.io-client'
import { Meas } from './components/Measurement'
import { Sleep } from './components/Sleep'
import conf from './conf'
import page from './img/page.png'
import { IData, IMeasurement } from './models/data'

import './App.css'

const initialState = {
  bmi: 0,
  changeSet: new Set<string>(), // the names of the keys that were changed in this state
  error: '',
  heartRate: 0,
  heartRateSource: '',
  heartRateVariability: 0,
  heightFeet: 0,
  heightInches: 0,
  lastRecorded: new Date(),
  peakHeartRate: 0,
  restingHeartRate: 0,
  sleepHours: 0,
  sleepMinutes: 0,
  started: false,
  stepsCount: 0,
  weight: 0,  
}

type State = Readonly<typeof initialState>

class App extends React.Component<object, State> {
  private static sleepRegEx = /((\d+)h)?\s*((\d+)m)?/ // Example: '7h 42m'
  public readonly state: State = initialState

  // During a demo, we can begin by showing the blank fields.
  // Then, clicking either the sync button or that start button
  // will call #start which will begin the flow of updates,
  // which will display the latest values of the fields.
  public onStart = (e: any) => {
    e.preventDefault()
    this.start()
  }

  public onSync = (e: any) => {
    e.preventDefault()
    this.start()
  }

  // open the web socket and call this.load every time new data is received
  public start = () => {
    this.setState(state => {
      if (! state.started) {
        try {
          this.openSocket()
          return {...state, started: true}
        } catch (err) {
          return {...state, error: err.toString()}
        }
      }
      return state
    })
  }

  public openSocket() {
    const socket = io(`http://${conf.host}`);
    socket.on("connect_error", (error: any) => {
      this.setState({ error: error.toString() });
    })
    socket.on("error", (error: any) => {
      this.setState({ error: error.toString() });
    })
    socket.on("update", (data: IData) => {
      this.load(data);
    })
  }

  /* not used
  public async fetch() {
    try {
      const response = await fetch(`http://${conf.host}/values`)
      if (response.ok) {
        const data = await response.json()
        this.load(data)
      }
    } catch(err) {
      this.setState({error: err.toString()})
    }
  }
  */

  public load(data: IData) {
    if (! data) {
      return
    }

    const {heightFeet, heightInches} = this.convertHeight(data.Height)
    const weight = this.convertWeight(data.Weight)
    const bmi = this.calcBMI(data.Weight, data.Height)
    const {sleepHours, sleepMinutes} = this.parseSleep(data.SleepHours)

    const newState : any = {
      bmi,
      heartRate: data.HeartRate && data.HeartRate.value ? Number(data.HeartRate.value) : 0,
      heartRateSource: data.HeartRate && data.HeartRate.source ? data.HeartRate.source : '',
      heartRateVariability: data.HeartRateVariability && data.HeartRateVariability.value ? Number(data.HeartRateVariability.value) : 0,
      heightFeet,
      heightInches,
      peakHeartRate: 0,
      restingHeartRate: data.RestingHeartRate && data.RestingHeartRate.value ? Number(data.RestingHeartRate.value) : 0,
      sleepHours,
      sleepMinutes,
      stepsCount: data.RestingHeartRate && data.RestingHeartRate.value ? Number(data.StepsCount.value) : 0,
      weight: weight.pounds,
    }

    this.setState(state => {
      newState.changeSet = this.findChanges(state, newState)
      newState.lastRecorded = new Date()
      return newState
    })

    // clear the changeset, so 'flash' class is removed from all fields,
    // so they can be flashed next time the change.
    setTimeout(_ => {
      this.setState({changeSet: new Set()})
    }, 2000);
  }

  // Convert height from Meters to Feet/Inches
  // Note that the captured height is stored result.captured
  public convertHeight(height: IMeasurement) : {heightFeet: number, heightInches: number, captured: string} {
    let heightFeet = 0
    let heightInches = 0
    let captured = 'n/a'

    if (height && height.value && height.uom === 'M') {
      const totalInches = Number(height.value) * 100 / 2.54
      heightFeet = Math.floor(totalInches / 12)
      heightInches = Math.floor(totalInches % 12)
      captured = `${height.value} M`
    }
    return {heightFeet, heightInches, captured}
  }

  // Convert weight from Kilograms to Pounds
  // Note that the captured weight is stored in result.captured
  public convertWeight(weight: IMeasurement) {
    let pounds = 0
    let captured = 'n/a'
    if (weight && weight.value && weight.uom === 'Kg') {
      pounds = Math.floor(Number(weight.value) * 2.20462)
      captured = `${weight.value} Kg`        
    }
    return {pounds, captured}
  }

  // Calculate the BMI
  public calcBMI(weight: IMeasurement, height: IMeasurement) {
    if (height && weight && height.value && weight.value && height.uom === 'M' && weight.uom === 'Kg') {
      let bmi = Number(weight.value) / Math.pow(Number(height.value), 2)
      bmi = Math.round(bmi * 10) / 10
      return bmi
    }
    return 0
  }

  // Parse string containing 'Xh Ym' to {sleepHours: X, sleepMinutes: Y}
  // parses "7h 10m"  to {sleepHours: 7, sleepMinutes: 10}
  // parses "7h"      to {sleepHours: 7, sleepMinutes: 0}
  // parses "10m"     to {sleepHours: 0, sleepMinutes: 10}
  public parseSleep(sleep: IMeasurement) : {sleepHours: number, sleepMinutes: number} {
    let sleepHours = 0
    let sleepMinutes = 0
    if (sleep && sleep.value) {
      const match = App.sleepRegEx.exec(sleep.value)
      if (match) {
        sleepHours = Number(match[2] || 0)
        sleepMinutes = Number(match[4] || 0)
      }
    }
    return {sleepHours, sleepMinutes}
  }

  // Find all of the keys where the values in state and newState are different.
  public findChanges(state: State, newState: State) : Set<string> {
    const changeSet = new Set()

    if (newState) {
      Object.keys(newState).forEach(key => {
        if (!(key in state) || state[key] !== newState[key]) {
          changeSet.add(key)
        }
      })
    }

    // if either feet or inches changed, then add them both so they both flash
    if (changeSet.has('heightFeet') || changeSet.has('heightInches')) {
      changeSet.add('heightFeet').add('heightInches')
    }

    return changeSet
  }

  public render() {
    return (
      <div className="App" >
        <img className="img" src={page} />
        <div className="lastRecorded">
          <span>Last recorded:</span>
          <span>{' '}</span>
          <TimeAgo date={this.state.lastRecorded} minPeriod={30}/>
        </div>
        <Meas name="restingHeartRate" uom="bpm" state={this.state} />
        <Meas name="peakHeartRate" uom="bpm" state={this.state}/>
        <Meas name="heartRateVariability" uom="ms" state={this.state} />
        <Meas name="stepsCount" uom="steps" state={this.state} />        
        <Sleep state={this.state} />        
        <Meas name="heightFeet" state={this.state} />
        <Meas name="heightInches" state={this.state} />
        <Meas name="weight" state={this.state} />
        <Meas name="bmi" state={this.state} />
        <Meas name="heartRate" state={this.state} />
        <Meas name="heartRateSource" state={this.state} />

        <button className="start" onClick={this.onStart} />
        <button className="sync" onClick={this.onSync} />
        <div className="err">{this.state.error}</div>
      </div>
    )
  }
}

export default App
