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
                        <label>
                        {url}
                        </label>
                    </div>

                </div>
            </div>

        );
    }
}

//<Button bsStyle="primary">CopyToClipboard</Button>

/*
<div className="static-modal" style={modalStyle}>

      <Modal.Dialog>
        <Modal.Header>
          <Modal.Title>Snapshot URL </Modal.Title>
        </Modal.Header>

        <Modal.Body> {url} </Modal.Body>

        <Modal.Footer>
          <Button onClick={() => this.props.onClose()} >Close</Button>

        </Modal.Footer>
      </Modal.Dialog>
</div>

*/
