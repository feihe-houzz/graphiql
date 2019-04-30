/**
 *  Copyright (c) Houzz, Inc.
 *  All rights reserved.
 *
 */

import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
// import { Modal , Button} from 'react-bootstrap';
import CopyToClipboard from 'react-copy-to-clipboard';

export class SnapshotShare extends React.Component {
    static propTypes = {
      snapshotURL: PropTypes.string
    }

    constructor(props) {
        super(props);
        this.state = {
            snapshotURL: ''
        };
    }

    componentDidUpdate() {

        if (this.props.snapshotURL != this.state.snapshotURL) {
            this.setState({
                snapshotURL: this.props.snapshotURL
            });
        }
    }

    render() {
        const { show } = this.props;
        var modalStyle = { display: show ? 'block' : 'none'};
        var url = this.state.snapshotURL;
        return (
            <div className="mobile-modal" style={modalStyle}>
                <div className="mobile-modal-content">
                    <span className="close" onClick={() => this.props.onClose()}>
                        &times;
                    </span>
                    <p><b> Snapshot URL </b></p>
                    <div style={{ display: 'flex', flexDirection: 'row', marginTop: 10 }}>

                         <input rows='1'cols='120' name="comment" readOnly={true}
                             style={{ display: 'inline', padding: '0px', width: '90%', fontSize: '16px', border: '0px' }}
                             value={url}>
                         </input>
                    </div>

                </div>
            </div>

        );
    }
}