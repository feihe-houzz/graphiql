/**
 *  Copyright (c) Houzz, Inc.
 *  All rights reserved.
 *
 */


/**
 * Mobile mode and mobile header dialogue
 *
 * A modal that accept mobile HTTP headers. Useful for query that needs authentication.
 *
 * - When modal button 'activate' is clicked, graphiQL has entered mobile mode.
 *   Headers will be honored for authenitcation, and response field will be UpperCase style for mobile client compatibility
 * - When modal button 'deactivate' is clicked, headers will be ignored, and normal camelCase response is resumed.
 */

import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import apiHelper from '../utility/apiHelper';
var ReactToastr = require("react-toastr");
var {ToastContainer} = ReactToastr; // This is a React Element.
var ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
// import { Button } from 'react-bootstrap';



export class Mobile extends React.Component {
    static propTypes = {
      mobileCookieStore: PropTypes.string,
      mobileHeaderStore: PropTypes.string,
      fromSnapshot: PropTypes.bool,
      executeQuery: PropTypes.func
    }

    constructor(props) {
        super(props);

        this.headers = [
            {
                name: 'X-HOUZZ-API-APP-NAME',
                value: 'test1'
            },
            {
                name: 'X-HOUZZ-API-APP-AGENT',
                value: 'iPhone81~iOS 9.3.2~com.houzz.app~Build 2725'
            },
            {
                name: 'X-HOUZZ-API-USER-NAME',
                value: 'garyyue'
            },
            {
                name: 'X-HOUZZ-API-SSL-TOKEN',
                value: ''
            },
            {
                name: 'X-HOUZZ-API-VISITOR-TOKEN',
                value: '140EFB95-26CD-4310-89A3-3EDF545748F9'
            },
            {
                name: 'X-HOUZZ-API-IDFA',
                value: '82303DFA-8EBF-447D-9AC3-7CB596959258'
            },
            {
                name: 'X-HOUZZ-API-IDFV',
                value: ''
            },
            {
                name: 'X-HOUZZ-API-LOCALE',
                value: 'en-US'
            },
            {
                name: 'X-HOUZZ-API-SITE-ID',
                value: '101'
            },
            {
                name: 'X-HOUZZ-API-VISITOR-CONSENTS-TOKEN',
                value: ''
            },
            {
                name: 'MOBILE-COOKIE',
                value: ''
            },
            {
                name: 'FORWARDED',
                value: ''
            }
        ];

        this.ivyHeaders = [
            {
                name: 'x-ivyuser',
                value: '131,9691,9682'
            },
            {
                name: 'FORWARDED',
                value: ''
            }
        ];

        this.state = {
            mobileHeaders: this.headers,
            ivyHeaders: this.ivyHeaders,
            onlyMobileCookies: true,
            password: '',
            initialized: false,
            tabIndex: 0
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.getTokens = this.getTokens.bind(this);
        this.toast = this.toast.bind(this);
    }

    componentDidMount() {
    }

    componentDidUpdate() {
        if (!this.state.initialized &&
            this.props.mobileHeaderStore &&
            this.props.fromSnapshot) {
            this.setState({
                initialized: true
            });
            let snapshotMobileHeaders = JSON.parse(this.props.mobileHeaderStore);

            this.updateHeaderBatch(snapshotMobileHeaders);

        }
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        
        this.setState({
            [name]: value
        });
    }

    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;
        if (name === 'password') {
            this.setState({
                password: value
            });
        } else {
            this.updateHeader(name, value);
        }
    }

    toast(msg, method) {
      this.refs.container[method](
          "",
          msg, {
              timeOut: 3000,
          }
      );
    }

    getTokens(user, app) {
        const exeQueryFn = this.props.executeQuery;

        let host = apiHelper.getHost();
        let curPassword = '';
        if (this.state.password) { // passward is set
            curPassword = this.state.password;
        } else {
            if (!host.includes('houzz.com')) {
                curPassword = 'eciaa@285';
            }
        }

        console.log('>>>>>>: ', curPassword);
        
        let userName = JSON.stringify(user);
        let password = JSON.stringify(curPassword);
        let appName = JSON.stringify(app);
        let getSSLTokenQuery = `
        query getSSLToken {
            getSSLToken(userName: ${userName}, password: ${password}, appName: ${appName})
        } `;

        exeQueryFn(getSSLTokenQuery, null, null, null,
            result => {
            if (result && result.data && result.data.getSSLToken) {
                let SSLToken = result.data.getSSLToken;
                this.updateHeader('X-HOUZZ-API-SSL-TOKEN', SSLToken);
            } else {
                this.updateHeader('X-HOUZZ-API-SSL-TOKEN', 'Error in getSSLToken');
            }
        });
    }

    updateHeader(name, value) {
        if (this.state.tabIndex === 0) {
            let curHeaders = this.state.mobileHeaders;
            curHeaders.forEach(elem => {
                if (elem && elem.name === name) {
                    elem.value = value;
                }
            });
            this.setState({
                mobileHeaders: curHeaders
            });
        } else if (this.state.tabIndex === 1) {
            let curHeaders = this.state.ivyHeaders;
            curHeaders.forEach(elem => {
                if (elem && elem.name === name) {
                    elem.value = value;
                }
            });
            this.setState({
                ivyHeaders: curHeaders
            });
        } else {
            // reserved, currently, do nothing. 
        }
    }

    updateHeaderBatch(headerObj) {
        let curHeaders = this.state.mobileHeaders;
        if (headerObj) {
            for (let name in headerObj) {
                let value = headerObj[name];
                curHeaders.forEach(elem => {
                    if (elem && elem.name === name) {
                        elem.value = value;
                    }
                });
            }
        }

        this.setState({
            mobileHeaders: curHeaders
        });
    }

    getUserName() {
        let userName = null;
        this.state.mobileHeaders.forEach(elem => {
            if (elem.name === 'X-HOUZZ-API-USER-NAME') {
                userName = elem.value;
            }
        });
        return userName;
    }

    getAppName() {
        let appName = null;
        this.state.mobileHeaders.forEach(elem => {
            if (elem.name === 'X-HOUZZ-API-APP-NAME') {
                appName = elem.value;
            }
        });
        return appName;
    }

    render() {
        const { show } = this.props;
        var modalStyle = { display: show ? 'block' : 'none'};

        var headerFields = [];
        _.each(this.state.mobileHeaders, function(header) {
            if (header.name === 'X-HOUZZ-API-USER-NAME') {
                headerFields.push(
                    <div className='mobile-field'>
                        <div style={{width: '260', marginLeft: '10'}}>{header.name}</div>
                        <div style={{minWidth: '400'}}>
                        <input value={header.value} style={{width: '100'}} name={header.name} onChange={this.handleChange} />
                        <label style={{width: '230'}}>
                            Password:
                            <input type='password' placeholder='No need for staging&houzz2' value={this.state.password} style={{minWidth: '230'}} name='password' onChange={this.handleChange} />
                        </label>
                        </div>
                    </div>

                );
            } else if (header.name === 'X-HOUZZ-API-SSL-TOKEN') {
                headerFields.push(
                    <div className='mobile-field'>
                        <div style={{width: '260', marginLeft: '10'}}>{header.name}</div>
                        <input value={header.value} style={{minWidth: '400'}} name={header.name} onChange={this.handleChange} />
                        {}
                    </div>
                );
            } else {
                headerFields.push(
                    <div className='mobile-field'>
                        <div style={{width: '260', marginLeft: '10'}}>{header.name}</div>
                        <input value={header.value} style={{minWidth: '400'}} name={header.name} onChange={this.handleChange} />
                    </div>
                );
            }
        }.bind(this));

        var ivyHeaders = [];
        _.each(this.state.ivyHeaders, function(header){
            ivyHeaders.push(
                <div className='mobile-field'>
                        <div style={{width: '260', marginLeft: '10'}}>{header.name}</div>
                        <input value={header.value} style={{minWidth: '400'}} name={header.name} onChange={this.handleChange} />
                </div>
            );
        }.bind(this));

        return (
        <div className="mobile-modal" style={modalStyle}>
            <div className="mobile-modal-content">
                <span className="close" onClick={() => this.props.onClose()}>
                    &times;
                </span>
                <p><b>Headers Panel</b></p>
                <Tabs selectedIndex={this.state.tabIndex} onSelect={tabIndex => this.setState({ tabIndex })}>
                    <TabList>
                            <Tab>Houzz Mobile</Tab>
                            <Tab>Ivy</Tab>
                    </TabList>
                    <TabPanel>
                        <div style={{ width: '90%', display: 'flex', flexDirection: 'column' }}>
                                {headerFields}
                        </div>

                        <div className='mobile-button2' onClick={() => {
                                var username = this.getUserName();
                                var appName = this.getAppName();
                                this.getTokens(username, appName)
                            }}>
                            getSSLToken
                        </div>

                    </TabPanel>
                    <TabPanel>
                        <div style={{ width: '90%', display: 'flex', flexDirection: 'column' }}>
                            {ivyHeaders}
                        </div>
                        
                    </TabPanel>
                </Tabs>


                <div style={{ display: 'flex', flexDirection: 'row', marginTop: 20 }}>
                    <div className='mobile-button' onClick={() => this.props.mobileActivateFn(false)}>
                        deactivate
                    </div>
                    <div className='mobile-button' onClick={() => {
                            var headers = {}
                            var inputHeaders = [];
                            if (this.state.tabIndex === 0) {
                                inputHeaders = this.state.mobileHeaders;
                            } else {
                                inputHeaders = this.state.ivyHeaders;
                            }
                            _.each(inputHeaders, function(header) {
                                headers[header.name] = header.value;
                            }.bind(this));

                            this.props.mobileActivateFn(true, headers);
                        }}>
                        activate
                    </div>
                </div>

            </div>
            <ToastContainer ref="container"
                            toastMessageFactory={ToastMessageFactory}
                            style={{position: 'absolute', right: '100px', bottom: '30px'}} />
        </div>
        );
    }

}

