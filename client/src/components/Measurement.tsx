import * as React from 'react'
import {Component} from 'react'

import './Measurement.css'

interface IProps {
    name: string,
    uom?: string,    
    state: {
      [name: string]: any,
      changeSet: Set<string>,
      started: boolean
    }
}

export class Meas extends Component<IProps> {  

  public render() {
    const {name, uom, state} = this.props
    const value = state[name]
    const changed = state.changeSet.has(name)    
    const className = `${name} ${changed ? 'flash' : ''}`
    if (value) {
      // toLocaleString() will add the comma to the step count.
      return (
        <div className={className}>
            {value > 1000 ? value.toLocaleString() : value}
            <span className="uom">{uom || ''}</span>
        </div>
      )
    }
    if (state.started) { 
      return (
          <div className={className}>
            ----{'\u2000\u2000'}
          </div>
      )
    }
    return (<div className={className} />)
  }
}
