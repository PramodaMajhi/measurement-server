import TextField from '@material-ui/core/TextField'
import * as React from 'react'
import TimeAgo from 'react-timeago'
import * as io from 'socket.io-client'
import { Meas } from './components/Measurement'
import { Sleep } from './components/Sleep'
import conf from './conf'

// import page from './img/page.png'
import footer from './img/footer.png'
import manifestlogo from './img/manifestmedex.png'
import nav from './img/nav.png'
import peak from './img/peak.png'
import resting from './img/resting.png'
import sec1 from './img/sec1.png'
import sleephrs from './img/sleep.png'
import steps from './img/steps.png'
import vitalIcon from './img/vitalIcon.png'

import { IData, IMeasurement } from './models/data'


import './App.css'

const initialState = {
  bmi: 0,
  changeSet: new Set<string>(), // the names of the keys that were changed in this state  
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
  private static sleepRegEx = /((\d+)h)?\s*((\d+)m)?/ // 7h 42m
  public readonly state: State = initialState

  // Connect to the server webSocket and begin receiving updates.
  // This is intended for a demo so we can begin by showing the blank
  // fields, then press the hidden start button (over the patient header)
  // and see the values appear.
  public onStart = (e: any) => {
    const socket = io(`http://${conf.host}`)
    socket.on("update", (data: IData) => {
      this.load(data)
    })
    this.setState({ started: true })
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
    if (!data) {
      return
    }

    const { heightFeet, heightInches } = this.convertHeight(data.Height)
    const weight = this.convertWeight(data.Weight)
    const bmi = this.calcBMI(data.Weight, data.Height)
    const { sleepHours, sleepMinutes } = this.parseSleep(data.SleepHours)

    const newState: any = {
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
      this.setState({ changeSet: new Set() })
    }, 2000);
  }

  public convertHeight(height: IMeasurement): { heightFeet: number, heightInches: number, captured: string } {
    let heightFeet = 0
    let heightInches = 0
    let captured = 'n/a'

    if (height && height.value && height.uom === 'M') {
      const totalInches = Number(height.value) * 100 / 2.54
      heightFeet = Math.floor(totalInches / 12)
      heightInches = Math.floor(totalInches % 12)
      captured = `${height.value} M`
    }
    return { heightFeet, heightInches, captured }
  }

  public convertWeight(weight: IMeasurement) {
    let pounds = 0
    let captured = 'n/a'
    if (weight && weight.value && weight.uom === 'Kg') {
      pounds = Math.floor(Number(weight.value) * 2.20462)
      captured = `${weight.value} Kg`
    }
    return { pounds, captured }
  }

  public calcBMI(weight: IMeasurement, height: IMeasurement) {
    if (height && weight && height.value && weight.value && height.uom === 'M' && weight.uom === 'Kg') {
      let bmi = Number(weight.value) / Math.pow(Number(height.value), 2)
      bmi = Math.round(bmi * 10) / 10
      return bmi
    }
    return 0
  }

  // parses "7h 10m"  to {sleepHours: 7, sleepMinutes: 10}
  // parses "7h"      to {sleepHours: 7, sleepMinutes: 0}
  // parses "10m"     to {sleepHours: 0, sleepMinutes: 10}
  public parseSleep(sleep: IMeasurement): { sleepHours: number, sleepMinutes: number } {
    let sleepHours = 0
    let sleepMinutes = 0
    if (sleep && sleep.value) {
      const match = App.sleepRegEx.exec(sleep.value)
      if (match) {
        sleepHours = Number(match[2] || 0)
        sleepMinutes = Number(match[4] || 0)
      }
    }
    return { sleepHours, sleepMinutes }
  }

  // returns the names of the keys where the value has changed from the previous value
  public findChanges(state: State, newState: State): Set<string> {
    const changeSet = new Set()

    if (newState) {
      Object.keys(newState).forEach(key => {
        if (!(key in state) || state[key] !== newState[key]) {
          changeSet.add(key)
        }
      })
    }

    if (changeSet.has('heightFeet') || changeSet.has('heightInches')) {
      changeSet.add('heightFeet').add('heightInches')
    }

    return changeSet
  }

  public render() {
    
    return (
      <div className="App" >
        { /* <img className="img" src={page} /> */}
        <div className="container">
          <div className="sec1">
            <img src={sec1} />
          </div>
          <div className="sec2">
            <img src={nav} />
            <div className="vitals">
              <div className="row1">
                <div className="vitaltxt">
                  Vitals
                </div>
                <div className="lastRecorded">
                  <span>Last recorded:</span>
                  <span>{' '}</span>
                  <TimeAgo date={this.state.lastRecorded} minPeriod={30} />
                </div>
                <div className="vitalIcon"><img src={vitalIcon} /> </div>
              </div>
              <div className="row2">
                <div className="vitalsSec">
                  <div className="Icon"><img src={resting} /></div>
                  <div className="ActualData">
                    <div className="txt">
                      RESTING BPM
                    </div>
                    <div className="result">
                      {"79 BPM"}
                    </div>
                  </div>
                </div>
                <div className="vitalsSec">
                  <div className="Icon"><img src={peak} /></div>
                  <div className="ActualData">
                    <div className="txt">
                      PEAK BPM
                    </div>
                    <div className="result">
                      {"79 BPM"}
                    </div>
                  </div>
                </div>
                <div className="vitalsSec">
                  <div className="Icon"> <img src={resting} /></div>
                  <div className="ActualData">
                    <div className="txt">
                      HEART RATE VARIABILITY
                    </div>
                    <div className="result">
                      {"79 BPM"}
                    </div>
                  </div>
                </div>
                <div className="vitalsSec">
                  <div className="Icon"><img src={steps} /></div>
                  <div className="ActualData">
                    <div className="txt">
                      STEP COUNT
                    </div>
                    <div className="result">
                      {"2000"}
                    </div>
                  </div>
                </div>
                <div className="vitalsSec">
                  <div className="Icon"><img src={sleephrs} /></div>
                  <div className="ActualData">
                    <div className="txt">
                      SLEEP DURATION
                    </div>
                    <div className="result">
                      {"7 hrs"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="row3">
                <div className="Icon"><img src={manifestlogo} /></div>
              </div>
              <div className="field">
                <div className="fieldTxt">HEIGHT</div>
                <TextField
                  
                  label="Read Only"
                  defaultValue="Height"
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <div className="fieldSubTxt">ft</div>
                <TextField                  
                  label="Read Only"
                  defaultValue="in"
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <div className="fieldSubTxt">in</div>
              </div>
              <div className="field">
                <div className="fieldTxt">WEIGHT</div>
                <TextField                  
                  label="Read Only"
                  defaultValue="in"
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <div className="fieldSubTxt">lbs</div>
              </div>
              <div className="field">
                <div className="fieldTxt">BMI</div>
              </div>
              <div className="field">
                <div className="fieldTxt">BP</div>
                <TextField                  
                  label="Read Only"
                  defaultValue="in"
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <TextField                  
                  label="Read Only"
                  defaultValue="in"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </div>
              <div className="field">
                <div className="fieldTxt">PULSE</div>
                <TextField                  
                  label="Read Only"
                  defaultValue="in"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </div>
              <div className="field">
                <div className="fieldTxt">PULSE</div>
              </div>
              <div className="field">
                <div className="fieldTxt">RR</div>
                <TextField                  
                  label="RR"
                  defaultValue={this.state.bmi.toString()}
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="sec3">
            <img src={footer} />
          </div>

        </div>

        <Meas name="restingHeartRate" uom="bpm" state={this.state} />
        <Meas name="peakHeartRate" uom="bpm" state={this.state} />
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
      </div>
    )
  }
}

export default App
