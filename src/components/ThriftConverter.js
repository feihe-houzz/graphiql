/**
 *  Copyright (c) Houz, Inc.
 *  All rights reserved.
 *
 */

import React from 'react';
import _ from 'lodash';
import CopyToClipboard from 'react-copy-to-clipboard';

/**
 * ThriftConverter
 *
 * A modal that convert thrift schema definition into corresponding graphQL one.
 * Should supply thrift struct, instead of the whole .thrift file
 *
 */
export class ThriftConverter extends React.Component {

    constructor(props) {
        super(props);
        this.convert = this.convert.bind(this);
        this.state = {
            thriftInput: '',
            graphOutput: '',
            copied: false
        }
    }

    _extractField(data) {
        const rx = /^(\S+)\s+(.+)\s+(\w+)$/g;
        var arr = rx.exec(data);

        if (arr == null || arr.length != 4) {
            return null;
        }

        return {
            type: arr[2],
            name: arr[3]
        }
    }

    _extractStruct(data) {
        const rx = /struct +(\w+) +{([\s\S]+)}/g;
        var arr = rx.exec(data);
        if (arr == null || arr.length < 2) {
            return null;
        }

        var typeName = arr[1];
        var extracted =  arr[2];
        var fields = extracted.split(',\n');
        var tmp = [];
        _.each(fields, function(field) {

            var trimmed = field.trim();
            if (trimmed.length != 0 && !trimmed.includes('base.Context')) {
                tmp.push(this._extractField(trimmed));
            }
        }.bind(this));
        fields = tmp;

        return {
            name: typeName,
            fields: fields
        };
    }

    // convert thrift type into graphQL type
    _convertType(data) {
        var type = null;
        switch(data) {
            case 'i32': type = 'Int'; break;
            case 'string': type = 'String'; break;
            case 'bool': type = 'Boolean'; break;
            default: type = 'Unknown'; break;
        }

        return type;
    }

    _constructGraphQL(data) {
        var schema = '';
        schema += 'type ' + data.name + ' {\n';
        _.each(data.fields, (field) => {
            schema += '\t' + field.name + ': ' + this._convertType(field.type) + '\n';
        });

        schema += '}';

        return schema;
    }

    convert() {
        var extracted = this._extractStruct(this.state.thriftInput);
        var graphOutput = '';
        if (extracted) {
            graphOutput = this._constructGraphQL(extracted);
        } else {
            graphOutput = 'Something wrong with the thrift input..'
        }

        this.setState({
            graphOutput: graphOutput,
            copied: false
        });
    }

    render() {
        const { show } = this.props;
        var modalStyle = { display: show ? 'block' : 'none'};
        var copyButtonLabel = this.state.copied? 'Copied': 'CopyToClipboard';

        return (
        <div className="modal" style={modalStyle}>
            <div className="modal-content">
                <span className="close" onClick={() => this.props.onClose()}>
                    &times;
                </span>
                <p><b>Thrift to GraphQL schema converter</b></p>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'row' }}>
                    <textarea rows='50' cols='50' name="comment" placeholder={'Enter thrift definition here...'}
                        style={{ flex: '4', height: '100%', fontSize: '16px', padding: '10px' }}
                        onChange={ (event) => this.setState({thriftInput: event.target.value})}
                        >
                    </textarea>
                    <div style={{ flex: '2', display: 'flex', alignContent: 'center', alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                        <a href="#" className="arrowButton" onClick={() => {this.convert()}}>CONVERT</a>
                        <CopyToClipboard text={this.state.graphOutput}
                            onCopy={() => {
                                if (this.state.graphOutput) {
                                    this.setState({copied: true});
                                }
                            }}>
                            <a href="#" className="arrowButton">{copyButtonLabel}</a>
                        </CopyToClipboard>
                    </div>
                    <textarea rows='50' cols='50' name="comment" readOnly={true} placeholder={'GraphQL query will be generated here'}
                        style={{ flex: '4', height: '100%', fontSize: '16px', padding: '10px' }} value={this.state.graphOutput}>
                    </textarea>
                </div>
            </div>
        </div>
        );
    }

}
