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
      response: PropTypes.string,
      mobileMode: PropTypes.bool,
      onRunQuery: PropTypes.func,
    };

    constructor(props) {
        super(props);
        this.state = {
            isMobile: false,
            needAuth: false,
            unitTestOutput: 'The unit test for this Query will be generated here',
        };
        this.handleInputChange = this.handleInputChange.bind(this);
    }


    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    composeQueryStr(queryObj) {
        if (!queryObj.variables) {
            queryObj.variables = null;
        }

        if (!queryObj.operationName) {
            queryObj.operationName = null;
        }

        let opNameStr = queryObj.operationName ? '"' + queryObj.operationName + '"' : null;
        let str = '{' + '\n' +
        '    ' +  'query: '  +
        '\n       \`'+ queryObj.query + '\`'+ ',\n' +
        '    ' + 'variables: ' + queryObj.variables + ',\n'  +
        '    ' + 'operationName: ' + opNameStr +
        '\n}';
        return str;
    }

    composeFullTest(testBody) {
        // massage the testString
        let testBodyMsg = testBody.replace(/\n/g, '\n            ');

        // leave the following string as it is
        let fullTest = `
describe('Test - ??', function() {
    it('should return desired response', function() {
        return test.queryExpect(
        ${testBodyMsg}
        );
    });
});`;
        return fullTest;

    }

    generateUnitTest(fullTest) {
        if (!this.props.response) {
            if (this.props.onRunQuery) {
              this.props.onRunQuery();
            }
        }

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

        // delete _gtrace
        delete res._gtrace;

        // massage the curQuery string
        curQuery = curQuery.replace(/\n/g, '\n           ');
        let curReq = {
            query: curQuery,
            variables: curVariables,
            operationName: curOperationName
        };

        let curRes = res;
        let unitTest = JSON.stringify(curReq, null, 4) + ',\n' + JSON.stringify(curRes, null, 4);
        let curUnitTest = this.composeQueryStr(curReq) + ',\n' + JSON.stringify(curRes, null, 4);
        unitTest = curUnitTest;
        let options = {
            owner: "your email@houzz.com"
        };


        if (this.props.mobileMode) {
            _.extend(options, {isMobile: true});
        }

        if (this.state.needAuth) {
            _.extend(options, {needsAuthentication: true});
        }

        if (Object.getOwnPropertyNames(options).length !== 0) {
            unitTest = unitTest + ',\n' + JSON.stringify(options, null, 4);
        }

        if(fullTest) {
            unitTest = this.composeFullTest(unitTest);
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
                <h2><b>Unit Test Auto-Gen</b></h2>

                <div style={{ display: 'flex', flexDirection: 'row', marginTop: 10 }}>
                    <div style={{
                        minWidth: '160px', padding: '20px 10px 10px 0px', 'fontSize': '17px'}}>
                        <label >
                            Authentication:
                            <input
                                name="needAuth"
                                type="checkbox"
                                checked={this.state.needAuth}
                                onChange={this.handleInputChange} />
                        </label>
                    </div>
                    <div className='mobile-button' onClick={() => this.generateUnitTest()}>
                        Generate
                    </div>
                    <div className='mobile-button' onClick={() => this.generateUnitTest(true)}>
                        GenerateWithCode
                    </div>
                </div>

                <textarea rows='50' cols='100' name="comment" readOnly={false}
                          placeholder={'Unit Test will be generated here'}
                    style={{ padding: '0px', width: '90%', fontSize: '16px' }}
                    value={this.state.unitTestOutput}>
                </textarea>
            </div>
        </div>
        );
    }
}

// style={{ flex: '4', height: '100%', fontSize: '16px', padding: '10px' }}
