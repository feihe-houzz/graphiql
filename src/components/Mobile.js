/**
 *  Copyright (c) Houz, Inc.
 *  All rights reserved.
 *
 */

import React from 'react';
import _ from 'lodash';

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
        this.state = {
        };
        this.headers = [
            {
                name: 'HTTP-X-HOUZZ-API-APP-NAME',
                value: 'test1'
            },
            {
                name: 'HTTP-X-HOUZZ-API-APP-AGENT',
                value: 'iPhone81~iOS 9.3.2~com.houzz.app~Build 2725'
            },
            {
                name: 'HTTP-X-HOUZZ-API-USER-NAME',
                value: 'garyyue'
            },
            {
                name: 'HTTP-X-HOUZZ-API-SSL-TOKEN',
                value: 'fQAAAAAAhyFpWRLFEAQ7FVObeEDCZ5EjmHXAjwHGcsPztmTRg4h3JTxWVfqWrmdhcnl5dWU='
            },
            {
                name: 'HTTP-X-HOUZZ-API-VISITOR-TOKEN',
                value: '140EFB95-26CD-4310-89A3-3EDF545748F9'
            },
            {
                name: 'HTTP-X-HOUZZ-API-IDFA',
                value: '82303DFA-8EBF-447D-9AC3-7CB596959258'
            },
            {
                name: 'HTTP-X-HOUZZ-API-LOCALE',
                value: 'en-US'
            },
            {
                name: 'HTTP-X-HOUZZ-API-SITE-ID',
                value: '101'
            }
        ];
    }

    render() {
        const { show } = this.props;
        var modalStyle = { display: show ? 'block' : 'none'};

        var headerFields = [];
        _.each(this.headers, function(header) {
            headerFields.push(
                <div className='mobile-field'>
                    <div style={{width: '260'}}>{header.name}</div>
                    <input defaultValue={header.value} style={{minWidth: '400'}} ref={header.name}/>
                </div>
            );
        });

        return (
        <div className="mobile-modal" style={modalStyle}>
            <div className="mobile-modal-content">
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
                            _.each(this.headers, function(header) {
                                headers[header.name] = this.refs[header.name].value;
                            }.bind(this));
                            console.log('headers in mobile: ', headers);
                            this.props.mobileActivateFn(true, headers);
                        }}>
                        activate
                    </div>
                </div>
            </div>
        </div>
        );
    }

}
