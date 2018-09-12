import * as React from 'react'
import {Component} from 'react'

import './Measurement.css'

interface IProps {
    name: string,
    uom?: string,    
    state: {      
      flash: Set<string>,
      started: boolean,
      vitals: {[name: string]: any}
    }
}

export class Meas extends Component<IProps> {  

  public render() {
    const {name, uom, state} = this.props
    const value = state.vitals[name]
    const flash = state.flash.has(name)    
    const className = `${name} ${flash ? 'flash' : ''}`
    if (value) {
      // toLocaleString() will add the comma to the step count.
      return (
        <div className={className}>
            {value > 1000 ? value.toLocaleString() : value}
            <span className="uom">{uom || ''}</span>
        </div>
      )
    }
    // The value is zero or empty. If data download has been started, display '---'. Otherwise, nothing.
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
