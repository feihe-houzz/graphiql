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
        }
    }

    render() {
        const { show } = this.props;
        var modalStyle = { display: show ? 'block' : 'none'};

        return (
        <div className="mobile-modal" style={modalStyle}>
            <div className="mobile-modal-content">
                <p><b>Mobile mode</b></p>
                <div style={{ width: '90%', display: 'flex', flexDirection: 'column' }}>
                    <div className='mobile-field'>
                        <div style={{width: '260'}}>HTTP-X-HOUZZ-API-APP-NAME</div>
                        <input value='test1' style={{minWidth: '400'}}/>
                    </div>
                    <div className='mobile-field'>
                        <div style={{minWidth: '260'}}>HTTP-X-HOUZZ-API-APP-AGENT</div>
                        <input value='iPhone81~iOS 9.3.2~com.houzz.app~Build 2725' style={{minWidth: '400'}}/>
                    </div>
                    <div className='mobile-field'>
                        <div style={{minWidth: '260'}}>HTTP-X-HOUZZ-API-USER-NAME</div>
                        <input value='garyyue' style={{minWidth: '400'}}/>
                    </div>
                    <div className='mobile-field'>
                        <div style={{minWidth: '260'}}>HTTP-X-HOUZZ-API-SSL-TOKEN</div>
                        <input value='fQAAAAAALtcHWRLFEAQNr25Ew4kNNybKn5KfmDM4mA/xAiLn0CLS51a7ygSQtmdhcnl5dWU=' style={{minWidth: '400'}}/>
                    </div>
                    <div className='mobile-field'>
                        <div style={{minWidth: '260'}}>HTTP-X-HOUZZ-API-VISITOR-TOKEN</div>
                        <input value='140EFB95-26CD-4310-89A3-3EDF545748F9' style={{minWidth: '400'}}/>
                    </div>
                    <div className='mobile-field'>
                        <div style={{width: '260'}}>HTTP-X-HOUZZ-API-IDFA</div>
                        <input value='82303DFA-8EBF-447D-9AC3-7CB596959258' style={{minWidth: '400'}}/>
                    </div>
                    <div className='mobile-field'>
                        <div style={{width: '260'}}>HTTP-X-HOUZZ-API-LOCALE</div>
                        <input value='en-US' style={{minWidth: '400'}}/>
                    </div>
                    <div className='mobile-field'>
                        <div style={{width: '260'}}>HTTP-X-HOUZZ-API-SITE-ID</div>
                        <input value='101' style={{minWidth: '400'}}/>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', marginTop: 20 }}>
                    <div className='mobile-button' onClick={() => this.props.mobileActivateFn(false)}>
                        deactivate
                    </div>
                    <div className='mobile-button' onClick={() => this.props.mobileActivateFn(true)}>
                        activate
                    </div>
                </div>
            </div>
        </div>
        );
    }

}
