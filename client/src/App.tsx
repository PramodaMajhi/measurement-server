import * as React from 'react'
import TimeAgo from 'react-timeago'
import * as io from 'socket.io-client'
import { Meas } from './components/Measurement'
import { Sleep } from './components/Sleep'
import conf from './conf'
import page from './img/page.png'
import { IData, IMeasurement } from './models/data'

import './App.css'

// when a value in the state (representing a vital - not error, etc.) changes, we want to
// render the value with a yellow "flash" to draw attention that it has changed. We do this
// by adding a "flash" class to it. In order to do that, we maintain the "flashUntil" map.
// The key is the name of the field, and the value is the Unix time in milliseconds when the
// flash should expire. Anytime the field is rendered, if the current time is less than the 
// value in flashUntil, the flash class will be added.

const initialState = {
  error: '',
  flash: new Set(),
  lastUpdated: new Date(),
  started: false,
  vitals: {
    bmi: 0,
    heartRate: 0,
    heartRateSource: '',
    heartRateVariability: 0,
    heightFeet: 0,
    heightInches: 0,
    peakHeartRate: 0,
    restingHeartRate: 0,
    sleepHours: 0,
    sleepMinutes: 0,
    stepsCount: 0,
    weight: 0,
  }
}

type State = Readonly<typeof initialState>

class App extends React.Component<object, State> {
  private static sleepRegEx = /((\d+)h)?\s*((\d+)m)?/ // Example: '7h 42m'
  public readonly state: State = initialState

  // During a demo, we can begin by showing the blank fields.
  // Then, clicking either the sync button or the start button
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
    if (! this.state.started) {
      try {
        this.openSocket()
        this.setState({started: true})
      } catch (err) {
        this.setState({error: err.toString()})
      }
    }
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

    const vitals : any = {
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

    const changeSet = this.findChanges(this.state.vitals, vitals)

    // load could be called several times, sometimes a key may be in changeSet and sometimes
    // it may not be. We don't want the "flash" class to be added and removed from the field
    // every time the key appears and dissappears from the change set.

    // So, once a key appears in changset, it will be added to flash Set and remain there until
    // it is removed using the timeout below. Even if the key is not in the next changeset, it will
    // not be removed from the flash set, as only the timeout removes keys.

    const flash = new Set(this.state.flash)
    // for each key that changes, add the key to flash and set a timeout to remove it from flash
    changeSet.forEach(key => {
      flash.add(key)
      setTimeout(()=> {
        const flash2 = new Set(this.state.flash)
        flash2.delete(key)
        this.setState({flash: flash2})
      }, conf.flash)
    })

    this.setState({
      flash,
      lastUpdated: new Date(),
      vitals
    })    
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

  // Find all of the keys where the values in vitals and newVitals are different.
  public findChanges(vitals: State["vitals"], newVitals: State["vitals"]) : Set<string> {
    const changeSet = new Set()

    if (newVitals) {
      Object.keys(newVitals).forEach(key => {
        if (!(key in vitals) || vitals[key] !== newVitals[key]) {
          changeSet.add(key)
        }
      })
    }

    // if either feet or inches changed, then add them both so they both flash
    if (changeSet.has('heightFeet') || changeSet.has('heightInches')) {
      changeSet.add('heightFeet').add('heightInches')
    }

    // if either feet or inches changed, then add them both so they both flash
    if (changeSet.has('sleepHours') || changeSet.has('sleepMinutes')) {
      changeSet.add('sleepHours').add('sleepMinutes')
    }

    return changeSet
  }

  public render() {
    return (
      <div className="App" >
        <img className="img" src={page} />
        {
          this.state.started 
          ? (
              <div className="lastRecorded">
                <span>Last recorded:</span>
                <span>{' '}</span>
                <TimeAgo date={this.state.lastUpdated} minPeriod={10}/>
              </div>
            ) 
          : null
        }

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
