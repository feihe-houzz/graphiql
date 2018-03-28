/**
 *  Copyright (c) Houz, Inc.
 *  All rights reserved.
 *
 */

import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';

/**
 */
export class UnitTestAutoGen extends React.Component {
    static propTypes = {
      query: PropTypes.string,
      variables: PropTypes.string,
      operationName: PropTypes.string,
      response: PropTypes.string
    }

    constructor(props) {
        super(props);
        this.state = {
            isMobile: false,
            unitTestOutput: 'The unit test for this Query will be generated here'
        };
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        // console.log('>>>> name: ', name);
        // console.log('&&&& value: ', value);

        this.setState({
            [name]: value
        });
    }

    generateUnitTest() {
        // console.log('@@@@@ this.props.response: ', this.props.response);
        if (!this.props.response) {
            this.setState({
              unitTestOutput: 'Please get the Query Result First'
            });
            return ;
        }
        let res = JSON.parse(this.props.response);
        let curQuery = this.props.query;
        let curVariables = this.props.variables;
        let curOperationName = this.props.operationName;
        let curResult =  JSON.stringify(res.data);

        let curReq = {
            query: curQuery,
            variables: curVariables,
            operationName: curOperationName
        };

        let curRes = {
            data: res.data
        };

        let unitTest = JSON.stringify(curReq, null, 4) + ',\n' + JSON.stringify(curRes, null, 4);

        if (this.state.isMobile) {
            let needAuth = {
                needsAuthentication: true
            };
            unitTest = unitTest + ',\n' + JSON.stringify(needAuth, null, 4);
        }

        this.setState({
          unitTestOutput: unitTest
        });
    }

    render() {
        const { show } = this.props;
        var modalStyle = { display: show ? 'block' : 'none'};
        return (
        <div className="mobile-modal" style={modalStyle}>
            <div className="mobile-modal-content">
                <span className="close" onClick={() => this.props.onClose()}>
                    &times;
                </span>
                <p><b>Unit Test Auto-Gen</b></p>

                <div style={{ display: 'flex', flexDirection: 'row', marginTop: 10 }}>
                    <label>
                        is Mobile query:
                        <input
                            name="isMobile"
                            type="checkbox"
                            checked={this.state.isMobile}
                            onChange={this.handleInputChange} />
                    </label>

                    <button type="button"  onClick={() => this.generateUnitTest()}>
                        generate
                    </button>
                </div>

                <textarea rows='50' cols='100' name="comment" readOnly={false}
                          placeholder={'Unit Test will be generated here'}
                    style={{ flex: '4', height: '100%', fontSize: '16px', padding: '10px' }}
                    value={this.state.unitTestOutput}>
                </textarea>
            </div>
        </div>
        );
    }
}
