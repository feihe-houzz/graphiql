/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  GraphQLSchema,
  isType,
} from 'graphql';

import FieldDoc from './DocExplorer/FieldDoc';
import SchemaDoc from './DocExplorer/SchemaDoc';
import SearchBox from './DocExplorer/SearchBox';
import SearchResults from './DocExplorer/SearchResults';
import TypeDoc from './DocExplorer/TypeDoc';

const initialNav = {
  name: 'result parser',
  title: 'Json Parser Explorer',
};

/**
 * ImagesExplorer
 *
 * Shows images based on graphQL result.
 *
 */
export default class ImagesExplorer extends React.Component {
  static propTypes = {
    schema: PropTypes.instanceOf(GraphQLSchema),
  }

  constructor() {
    super();
    this.state = {
        query: '',
        parsed: null
    }
  }

  handleSearch = query => {
    var { result } = this.props;
    if (!result) {
        return null;
    }

    if (query && query !== '$') {
        result = JSON.parse(result);
        var jp = require('jsonpath');
        var parsed = jp.query(result, query);
        // console.log('parsed: ', parsed);
    } else {
        parsed = null;
    }

    this.setState({
        forceQuery: null,
        query,
        parsed
    });
  }

  renderField = (field, index) => {
    if (!field || typeof field.match !== 'function') {
        return null;
    }

    var imageRegex = /http.*\.jpg/;

    if (field.match(imageRegex)) {
        return (
            <img key={index} src={field} style={{maxWidth: '85%'}}/>
        )
    } else {
        return (
            <div key={index} className="field-name">{field}</div>
        );
    }
  }

  renderResults = () => {
    if (!this.state.query || !this.state.parsed) {
        return null;
    }

    var fields = this.state.parsed.map((value, index) => this.renderField(value, index));

    return (
        <div className="doc-category">
            <div className="doc-category-title">results</div>
            <div className="doc-category-item">
                {fields}
            </div>
        </div>
    )
  }

  forceQuery(query) {
    this.setState(
        {
            forceQuery: query
        }
    );
  }

  renderShortcuts = () => {
    if (this.state.query) {
        return null;
    }

    return (
        <div style={{color: 'gray', borderWidth: 1, cursor: 'pointer'}}
             onClick={() => this.forceQuery('$..url')}>
            <i className="fa fa-picture-o"></i>
            &nbsp;images
        </div>
    );
  }

  render() {
    // console.log('query: ', this.state.query);
    var shortcuts = this.renderShortcuts();
    var content = this.renderResults();

    return (
      <div className="doc-explorer" key={initialNav.name}>
        <div className="doc-explorer-title-bar">
          <div className="doc-explorer-title">
            {initialNav.title}
          </div>
          <div className="doc-explorer-rhs">
            {this.props.children}
          </div>
        </div>
        <div className="doc-explorer-contents">
            <SearchBox
              force={this.state.forceQuery}
              placeholder={`search by jsonpath`}
              onSearch={this.handleSearch}
            />
            {shortcuts}
            {content}
        </div>
      </div>
    );
  }
}
