import * as React from 'react'
import {Component} from 'react'

import './Measurement.css'

interface IProps {  
    state: {
      sleepHours: number,
      sleepMinutes: number,
      changed: Set<string>,
      started: boolean
    }
}

export class Sleep extends Component<IProps> {
  public render() {
    const {state} = this.props
    const {sleepHours, sleepMinutes} = state
    const changed = state.changed.has('sleepHours') || state.changed.has('sleepMinutes')
    const className = `sleep ${changed ? 'changed' : ''}`
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
