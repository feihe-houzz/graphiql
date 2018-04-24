/**
 *  Copyright (c) Houzz, Inc.
 *  All rights reserved.
 *
 */

import React from 'react';
import { Alert } from 'reactstrap';
import _ from 'lodash';
import PropTypes from 'prop-types';
import apiHelper from '../utility/apiHelper';
var ReactToastr = require("react-toastr");
var {ToastContainer} = ReactToastr; // This is a React Element.
var ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);
/**
 * Mobile mode and mobile header dialogue
 *
 * A modal that accept mobile HTTP headers. Useful for query that needs authentication.
 *
 * - When modal button 'activate' is clicked, graphiQL has entered mobile mode.
 *   Headers will be honored for authenitcation, and response field will be UpperCase style for mobile client compatibility
 * - When modal button 'deactivate' is clicked, headers will be ignored, and normal camelCase response is resumed.
 */


export class Mobile extends React.Component {

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
            }
        ];

        this.state = {
            mobileHeaders: this.headers,
            onlyMobileCookies: true,
            password: ''
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.getTokens = this.getTokens.bind(this);
        this.toast = this.toast.bind(this);
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;
        console.log('>>>> name: ', name);
        console.log('&&&& value: ', value);

        this.setState({
            [name]: value
        });
    }

    handleChange(event) {
        console.log('event name: ', event.target.name);
        console.log('event value:', event.target.value);
        let name = event.target.name;
        let value = event.target.value;
        if (name === 'password') {
            this.setState({
                password: value
            });
        } else {
            this.updateHeader(name, value);
        }


        // this.setState({value: event.target.value});
    }



    toast(msg, method) {
      this.refs.container[method](
          "",
          msg, {
              timeOut: 3000,
          }
      );
    }

    getTokens(user) {
        let url = apiHelper.getUrl('format=json&version=185&app=test1&method=getToken');
        console.log('$$$$ url: ', url);
        let host = apiHelper.getHost();
        console.log('#######: ', host);
        let curPassword = '';
        if (host.includes('houzz.com') && !host.includes('stghouzz.com')) {
            curPassword = this.status.password;
            console.log('~~~~~~~~~~~~~~~');
        } else {
            curPassword = 'eciaa310';
        }

        console.log('$$$$ password: ', curPassword);
        let body = 'otherApp=&username='+user+'&pwd='+ curPassword;

        // console.log('========== body: ', body);
        let options = {
            method: 'post',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'compress': false,
            },
            body: body,
        };

        apiHelper.fetchUrlPost(url, options).then(res => {
            console.log('res=>>> : ', res);
            if (res.Ack === 'Success') {
                let userName = res.Username;
                let SSLToken = res.SSLAuthToken;
                console.log('--> userName: ',userName);
                console.log('--< SSLToken: ', SSLToken);
                console.log('<<<<<<>>>>>>>> this: ', this);
                this.updateHeader('X-HOUZZ-API-SSL-TOKEN', SSLToken);
            } else {
                if (res.Ack === 'Error') {
                    //this.toast(res.ShortMessage, 'Please make sure the username and password are valid');
                    // console.log('$$$$$$ res: ', res);
                }
            }
            return res;
        }).catch(err => {
            console.log('err==<<: ', err);
            // this.toast(err.name, 'error');
        });
    }

    updateHeader(name, value) {
        let curHeaders = this.state.mobileHeaders;
        curHeaders.forEach(elem => {
            if (elem && elem.name === name) {
                elem.value = value;
            }
        });
        console.log('====>>>>> curHeaders: ', curHeaders);
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

//style={{width: '400'}}



    render() {
        const { show } = this.props;
        var modalStyle = { display: show ? 'block' : 'none'};

        var headerFields = [];
        _.each(this.state.mobileHeaders, function(header) {
            // console.log('%%%%%%%%%%%%%%%%%%%%%%: ', this);
            if (header.name === 'X-HOUZZ-API-USER-NAME') {
                headerFields.push(
                    <div className='mobile-field'>
                        <div style={{width: '260'}}>{header.name}</div>
                        <div style={{minWidth: '400'}}>
                        <input value={header.value} style={{width: '100'}} name={header.name} onChange={this.handleChange} />
                        <label >
                            Password:
                            <input type='password' placeholder='No need for staging&houzz2' value={this.state.password} style={{minWidth: '230'}} name='password' onChange={this.handleChange} />
                        </label>
                        </div>
                    </div>
                );
            } else {
                headerFields.push(
                    <div className='mobile-field'>
                        <div style={{width: '260'}}>{header.name}</div>
                        <input value={header.value} style={{minWidth: '400'}} name={header.name} onChange={this.handleChange} />
                    </div>
                );
            }

        }.bind(this));

        return (
        <div className="mobile-modal" style={modalStyle}>
            <div className="mobile-modal-content">
            <span className="close" onClick={() => this.props.onClose()}>
                &times;
            </span>
                <p><b>Mobile mode</b></p>
                <div style={{ width: '90%', display: 'flex', flexDirection: 'column' }}>
                    {headerFields}
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', marginTop: 20 }}>
                    <div className='mobile-button' onClick={() => this.props.mobileActivateFn(false)}>
                        deactivate
                    </div>
                    <div className='mobile-button' onClick={() => {
                            var headers = {}
                            _.each(this.state.mobileHeaders, function(header) {

                                headers[header.name] = header.value;

                                console.log("======: ", headers[header.name]);
                            }.bind(this));

                            this.props.mobileActivateFn(true, headers);
                        }}>
                        activate
                    </div>

                    <div className='mobile-button' onClick={() => {
                            console.log('%%%%%%%%%% this: ', this);
                            console.log('$$$$$$$$: ', this.state.mobileHeaders);

                            var username = this.getUserName();
                            console.log("$$$$ username ", username);

                            // var username2 = this.refs['X-HOUZZ-API-USER-NAME'].value;
                            // console.log('==>> username2: ', username2);
                            this.getTokens(username)
                        }}>
                        getSSLToken
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

/*
// make sure that the we wanna use the mobile-cookie to override the browserCookie
if (header.name === 'MOBILE-COOKIE' ) {
    if (this.state.onlyMobileCookies) {
        headers[header.name] = 'override=true;';
    } else {
        headers[header.name] = 'override=false;';
    }
    headers[header.name] += header.value;
} else {

}

<div>
    <label style={{minWidth: '1400'}}>
        Only Mobile Cookies?
        <input
            name="onlyMobileCookies"
            type="checkbox"

            checked={this.state.onlyMobileCookies}
            onChange={this.handleInputChange} />
    </label>
</div>

*/
