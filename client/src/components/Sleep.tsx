import * as React from 'react'
import {Component} from 'react'

import './Measurement.css'

interface IProps {
    state: {
      flash: Set<string>,
      started: boolean,
      vitals: {
        sleepHours: number,
        sleepMinutes: number,
      }
    }
}

export class Sleep extends Component<IProps> {
  public render() {
    const {state} = this.props
    const {sleepHours, sleepMinutes} = state.vitals
    const flash = state.flash.has("sleepHours")
    const className = `sleep ${flash ? 'flash' : ''}`
    const list = []
    if (sleepHours || sleepMinutes) {
      list.push(<span key={1}>{sleepHours}</span>)
      list.push(<span key={2}className="uom">h</span>)
      if (sleepMinutes) {
        list.push(<span key={3}>{sleepMinutes}</span>)
        list.push(<span key={4}className="uom">m</span>)
      }
    } else if (state.started) {
      list.push("----")
    } // if not started, list is empty
    
    return (
      <div className={className}>
        {list}
      </div>
    )
  }
}
