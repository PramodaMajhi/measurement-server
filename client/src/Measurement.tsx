import * as React from 'react'
import {Component} from 'react'

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
    const uom2 = uom || ''
    const display = value ? `${value} ${uom2}` : '----'
    const changed = state.changed.has(name)
    const className = `${name} ${changed ? 'change' : ''}`
    return (
      <div className={className}>
          {display}
      </div>
    )
  }
}
