import { parse } from 'graphql';
import React from 'react';
import PropTypes from 'prop-types';
import HistoryStore from '../utility/HistoryStore';
import HistoryQuery from './HistoryQuery';
import StripIndent from 'strip-indent';
import _ from 'lodash';

const MAX_HISTORY_LENGTH = 20;

export class VersionHistory extends React.Component {
  static propTypes = {
    query: PropTypes.string,
    variables: PropTypes.string,
    operationName: PropTypes.string,
    queryID: PropTypes.number,
    onSelectQuery: PropTypes.func,
    storage: PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.state = {
       currentVersion: 0,
       currentQuery: 0,
       shouldUpdateQueryEditor: false,
       buttonsOpen: false,
       versions: [
            {
                id: 1,
                queries: [
                    {
                        name: 'photoBrowsing',
                        value: `
                        query photoBrowsing {
                          photos {
                            items {
                              id
                            }
                          }
                        }
                        `
                    },
                ]
            },
            {
                id: 2,
                queries: [
                    {
                        name: 'photoBrowsing',
                        value: `
                        query photoBrowsing {
                          photos {
                            items {
                              id
                              title
                            }
                          }
                        }
                        `
                    },
                    {
                        name: 'currentUser',
                        value: `
                        query currentUser {
                          currentUser {
                            id
                            userName
                          }
                        }
                        `
                    }
                ]
            },
            {
                id: 3,
                queries: [
                    {
                        name: 'photoBrowsing',
                        value: `
                        query photoBrowsing {
                          photos {
                            items {
                              id
                              title
                            }
                          }
                        }
                        `
                    },
                    {
                        name: 'currentUser',
                        value: `
                        query currentUser {
                          currentUser {
                            id
                            userName
                            displayName
                          }
                        }
                        `
                    }
                ]
            },
            {
                id: 4,
                queries: [
                    {
                        name: 'photoBrowsing',
                        value: `
                        query photoBrowsing {
                          photos {
                            items {
                              id
                              title
                            }
                          }
                        }
                        `
                    },
                    {
                        name: 'currentUser',
                        value: `
                        query currentUser {
                          currentUser {
                            id
                            userName
                            displayName
                          }
                        }
                        `
                    },
                    {
                        name: 'getPosts',
                        value: `
                        query getPosts {
                          posts {
                            id
                            title
                          }
                        }
                        `
                    }
                ]
            },
            {
                id: 5,
                queries: [
                    {
                        name: 'currentUser',
                        value: `
                        query currentUser {
                          currentUser {
                            id
                            userName
                            displayName
                          }
                        }
                        `
                    },
                    {
                        name: 'getPosts',
                        value: `
                        query getPosts {
                          posts {
                            id
                            title
                            author {
                              id
                              firstName
                            }
                          }
                        }
                        `
                    }
                ]
            },
        ]
    };
  }

  componentDidUpdate() {

    if (this.state.shouldUpdateQueryEditor) {
        const selectQueryFn = this.props.onSelectQuery;
        if (!selectQueryFn) {
            return;
        }

        var hasChosen = false;
        this.state.versions[this.state.currentVersion].queries.map((query, i) => {
          const chosen = query.name === this.state.currentQuery;
          if (chosen) {
            hasChosen = true;
            selectQueryFn(StripIndent(query.value), '', query.name); // notify parent
          }
        });

        if (!hasChosen) {
            // no match query found for this version, reset the query editor
            selectQueryFn('', '', ''); // notify parent
        }

        this.setState({shouldUpdateQueryEditor: false});
    }
  }

  renderVersions() {
    return this.state.versions.map((version, i) => {
      const style = i === this.state.currentVersion ? {
        backgroundColor: '#cccccc'
      } : null;
      return (
        <div key={i} className="versions-row-query" onClick={() => this.setState({
                currentVersion: i,
                shouldUpdateQueryEditor: true
            })} style={style}>
            version {i}
        </div>
      );
    });
  }

  renderQueries() {
    return this.state.versions[this.state.currentVersion].queries.map((query, i) => {
      const chosen = query.name === this.state.currentQuery;
      const style = chosen ? {
        backgroundColor: '#f4f4f4'
      } : null;

      const buttonsOpen = chosen && this.state.buttonsOpen;

      const deviceButtons = buttonsOpen ? (
        <div key={'device-buttons'} className="versions-row-buttons" onClick={() => {
            }}>
            <div className="hoverHighlight" style={{flex: 1, justifyContent: 'center', borderRightWidth: '1px',
                fontSize: '10px', color: '', borderRight: '2px solid gray'}}>
                iOS
            </div>
            <div className="hoverHighlight" style={{flex: 1, justifyContent: 'center', borderRightWidth: '1px', fontSize: '10px', color: ''}}>
                android
            </div>
        </div>
        ) : null;

      const actionButtons = buttonsOpen ? (
        <div key={'action-buttons'} className="versions-row-icons">
            <i key={'copy'} className="fa fa-clone hoverHighlight" aria-hidden="true"
               style={{flex: 1, justifyContent: 'center', borderRight: '2px solid gray', color: 'blue', fontSize: '13px'}}
               onClick={() => {
                    var newOperationName = this.props.operationName;
                    newOperationName += 'Cloned';
                    var currentQueries = this.state.versions[this.state.currentVersion].queries;
                    _.each(currentQueries, (query, i) => {
                        const chosen = query.name === this.state.currentQuery;
                        if (chosen) {
                            var newQuery = _.clone(query);
                            newQuery.name = newOperationName;
                            console.log('newQuery before: ', newQuery);
                            console.log('current query: ', this.state.currentQuery);

                            newQuery.value = newQuery.value.replace(this.state.currentQuery, newOperationName);

                            console.log('newQuery after: ', newQuery);

                            currentQueries.splice(i + 1, 0, newQuery);
                            return false;
                        }
                    });

                    this.setState({
                        versions: this.state.versions,
                        currentQuery: newOperationName,
                        shouldUpdateQueryEditor: true,
                    })
               }}></i>
            <i key={'save'} className="fa fa-floppy-o hoverHighlight" aria-hidden="true"
               style={{flex: 1, justifyContent: 'center', borderRight: '2px solid gray', color: 'green', fontSize: '14px'}}
               onClick={() => {
                    const newOperationName = this.props.operationName;
                    _.each(this.state.versions[this.state.currentVersion].queries, (query, i) => {
                        const chosen = query.name === this.state.currentQuery;
                        if (chosen) {
                            query.name = newOperationName;
                            query.value = this.props.query;
                            return false;
                        }
                    });
                    this.setState({
                        versions: this.state.versions,
                        currentQuery: newOperationName
                    })
               }}></i>
            <i key={'delete'} className="fa fa-trash-o hoverHighlight" aria-hidden="true"
               style={{flex: 1, justifyContent: 'center', color: 'red', fontSize: '14px'}}
               onClick={() => {
                    _.remove(this.state.versions[this.state.currentVersion].queries, (query) => {
                        return query.name === this.state.currentQuery;
                    });
                    this.setState({
                        versions: this.state.versions,
                        currentQuery: '',
                        shouldUpdateQueryEditor: true,
                    })
               }}></i>
        </div>
        ) : null;

      return (
        <div>
            {deviceButtons}
            <div key={i} className="versions-row-query" onClick={() => {
                    this.setState({
                        currentQuery: query.name,
                        shouldUpdateQueryEditor: true,
                        buttonsOpen: !this.state.buttonsOpen
                    });
                }} style={style}>
                {query.name}
            </div>
            {actionButtons}
        </div>
      );
    });
  }

  render() {
    const versionNodes = this.renderVersions();
    const queryNodes = this.renderQueries();

    return (
      <div>
        <div className="history-title-bar">
          <div className="history-title">Versions</div>
          <div className="doc-explorer-rhs">
            {this.props.children}
          </div>
        </div>
        <div className="history-title-bar">
          <div className="history-title" style={{backgroundColor: '#008000', cursor: 'pointer', color: 'white'}}>
              id
          </div>
          <div className="history-title" style={{backgroundColor: '#b2d582', cursor: 'pointer'}}>
              queries
          </div>
        </div>
        <div className="versions-contents">
            <div className="versions-major">
              {versionNodes}
            </div>
            <div className="versions-queries">
              {queryNodes}
            </div>
        </div>
      </div>
    );
  }
}
