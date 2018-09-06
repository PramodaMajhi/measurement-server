import * as React from 'react'
import {Component} from 'react'

import './Measurement.css'

interface IProps {
    name: string,
    uom?: string,    
    state: {
      changed: Set<string>
    }
}

export class Meas extends Component<IProps> {
  public render() {
    const {name, uom, state} = this.props
    const value = state[name]    
    const changed = state.changed.has(name)
    const className = `${name} ${changed ? 'changed' : ''}`
    if (value) {
      // toLocaleString() will add the comma to the step count.
      return (
        <div className={className}>
            {value > 1000 ? value.toLocaleString() : value}
            <span className="uom">{uom || ''}</span>
        </div>
      )
    } else {
      return (
        <div className={className}>
            ----
        </div>
      )
    }    
  }
}
