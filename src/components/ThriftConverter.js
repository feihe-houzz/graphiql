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
        const rx = /\d+\s*:\s*(\w+)\s+(.+)\s+(\w+)\s*(,|\/)?/g;
        var arr = rx.exec(data);

        if (arr == null || arr.length < 3) {
            return null;
        }

        if (arr[1] === 'optional') {
            return {
                type: arr[2],
                name: arr[3]
            }
        }

        return {
            type: arr[1],
            name: arr[2]
        }
    }

    _extractFieldEnum(data) {
        var fields = data.split('=');
        if (fields == null || fields.length != 2) {
          return null;
        }
        var indexComma = fields[1].indexOf(',');
        if (indexComma > 0) {
            fields[1] = fields[1].substring(0, indexComma);
        }

        return {
          type: fields[0].trim(),
          name: fields[1].trim()
        };
    }

    _extractStruct(data) {
        const rx = /struct +(\w+)\s*{([\s\S]+)}/g;
        var arr = rx.exec(data);
        if (arr == null || arr.length < 2) {
            return null;
        }

        var typeName = arr[1];
        var extracted =  arr[2];
        var lines = extracted.split('\n');
        var fields = [];
        _.each(lines, function(line) {

            var trimmed = line.trim();

            // delete the comment
            var indexOfComment = trimmed.indexOf('//');
            if (indexOfComment >= 0) {
              trimmed = trimmed.substring(0, indexOfComment);
            }

            var field = this._extractField(trimmed);
            if (trimmed.length != 0 && field) {
                fields.push(field);
            }
        }.bind(this));

        return {
            name: typeName,
            fields: fields
        };
    }

    _extractEnum(data) {
        const rx = /enum +(\w+)\s*{([\s\S]+)}/g;
        var arr = rx.exec(data);
        if (arr == null || arr.length < 2) {
            return null;
        }

        var typeName = arr[1];
        var extracted =  arr[2];
        var lines = extracted.split('\n');
        var fields = [];
        _.each(lines, function(line) {

            var trimmed = line.trim();

            // delete the comment
            var indexOfComment = trimmed.indexOf('//');
            if (indexOfComment >= 0) {
              trimmed = trimmed.substring(0, indexOfComment);
            }

            // var field = this._extractField(trimmed);
            var field = this._extractFieldEnum(trimmed);
            if (trimmed.length != 0 && field) {
                fields.push(field);
            }
        }.bind(this));

        return {
            name: typeName,
            fields: fields
        };
    }

    _extract(data) {
      // start with struct
      var isStruct = data.trim().match(/^struct/g);
      if (isStruct) {
          return this._extractStruct(data);
      } else {
          // start with enum
          return this._extractEnum(data);
      }

    }

    // convert thrift type into graphQL type
    _convertType(data) {
        var type = null;
        // list<...>
        var isList = data.match(/^list/gi);

        if (isList) {
            // retrieve the content in <>
            var listContent = data.match(/\<([^)]+)\>/)[1];
            switch(listContent) {
                case 'i32': type = '[Int]'; break;
                case 'bool': type = '[Boolean]'; break;
                case 'string': type = '[String]'; break;
                default: type = '['+listContent+']'; break;
            }
        } else {
            switch(data) {
                case 'i32': type = 'Int'; break;
                case 'string': type = 'String'; break;
                case 'bool': type = 'Boolean'; break;
                case 'double': type = 'Float'; break;
                default: type = 'Unknown'; break;
            }
        }
        return type;
    }

    _constructGraphQLStruct(data) {
        if (data) {
            var schema = '';
            schema += 'type ' + data.name + ' {\n';
            _.each(data.fields, (field) => {
                schema += '\t' + field.name + ': ' + this._convertType(field.type) + '\n';
            });

            schema += '}';

            return schema;
        }
    }

    _constructGraphQLEnum(data) {
       var schema = '';
       var resolver='';

       schema += 'enum ' + data.name + ' {\n';

       resolver += data.name + ':'+ ' {\n';
       _.each(data.fields, (field) => {
           schema += '\t' + field.type +'\n';
           resolver += '\t' + field.type + ': ' + field.name + ',\n'
       });

       schema += '}';
       resolver += '}';

       var result = schema + '\n\n' + resolver;
       return result;
   }

    _constructGraphQL(data, fromStruct) {
        if (data) {
            if (fromStruct) {
              return this._constructGraphQLStruct(data);
            } else {
              return this._constructGraphQLEnum(data);
            }
        }
    }

    convert() {
        var extracted = null;
        var data = this.state.thriftInput;
        // start with struct
        var isStruct = (data.trim().match(/struct/g) || []).length > 0;
        var isEnum = (data.trim().match(/enum/g) || []).length > 0;

        var covertorOutput = '';
        if (isStruct && isEnum) {
            covertorOutput = 'The struct and enum cannot be mixed';
        } else if (isStruct) {
            let structCount = (data.match(/struct/g) || []).length;

            if (structCount === 0) {
                covertorOutput = 'Neither struct nor enum';
            } else if (structCount === 1) {
                // normal extract
                let extracted = this._extractStruct(data);
                covertorOutput = this._constructGraphQL(extracted, isStruct);
            } else {
                // structCount > 1
                let structStrArr = data.split('struct');
                structStrArr = structStrArr.map(elem=> {
                    if (elem && elem.includes('{')) {
                        elem = 'struct ' + elem;
                        return elem;
                    }
                });

                let extractedArr = structStrArr.map(elem => {
                    if (elem) {
                        return this._extractStruct(elem);
                    }
                });

                let convertedOutputArr = extractedArr.map(elem => {
                    return this._constructGraphQL(elem, isStruct);
                });

                convertedOutputArr.forEach(elem => {
                    if (elem) {
                        covertorOutput += elem + '\n\n';
                    }
                });
            }
        } else if (isEnum) {
            let enumCount = (data.match(/enum/g) || []).length;

            if (enumCount === 0) {
                covertorOutput = 'Neither struct nor enum';
            } else if (enumCount === 1) {
                // normal extract
                let extracted = this._extractEnum(data);
                covertorOutput = this._constructGraphQL(extracted, isStruct);
            } else {
                // enumCount > 1
                let enumStrArr = data.split('enum');
                enumStrArr = enumStrArr.map(elem=> {
                    if (elem && elem.includes('{')) {
                        elem = 'enum ' + elem;
                        return elem;
                    }
                });
                let extractedArr = enumStrArr.map(elem => {
                    if (elem) {
                        return this._extractEnum(elem);
                    }
                });
                let convertedOutputArr = extractedArr.map(elem => {
                    return this._constructGraphQL(elem, isStruct);
                });
                convertedOutputArr.forEach(elem => {
                    if (elem) {
                        covertorOutput += elem + '\n\n';
                    }
                });
            }

        } else {
            covertorOutput = 'Neither struct nor enum';
        }

        this.setState({
            graphOutput: covertorOutput,
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
                <div>
                  <p>Note:</p>
                  <p>Comments will be deleted after converting</p>
                </div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'row' }}>
                    <textarea rows='50' cols='50' name="comment"
                        placeholder={'Enter thrift definition here... '}
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
                    <textarea rows='50' cols='50' name="comment" readOnly={true}
                              placeholder={'GraphQL query will be generated here'}
                        style={{ flex: '4', height: '100%', fontSize: '16px', padding: '10px' }} value={this.state.graphOutput}>
                    </textarea>
                </div>
            </div>
        </div>
        );
    }

}
