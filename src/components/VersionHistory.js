import { parse } from 'graphql';
import React from 'react';
import PropTypes from 'prop-types';
import HistoryStore from '../utility/HistoryStore';
import HistoryQuery from './HistoryQuery';
import StripIndent from 'strip-indent';

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
    this.versions = [
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
    ];
    this.state = {
       currentVersion: 0,
       currentQuery: 0
    };
  }

  componentDidUpdate() {

    if (this.state.shouldUpdateQuery) {
        const selectQueryFn = this.props.onSelectQuery;
        if (!selectQueryFn) {
            return;
        }

        var hasChosen = false;
        this.versions[this.state.currentVersion].queries.map((query, i) => {
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

        this.setState({shouldUpdateQuery: false});
    }
  }

  renderVersions() {
    return this.versions.map((version, i) => {
      const style = i === this.state.currentVersion ? {
        backgroundColor: '#cccccc'
      } : null;
      return (
        <div key={i} className="versions-row" onClick={() => this.setState({
                currentVersion: i,
                shouldUpdateQuery: true
            })} style={style}>
            version {i}
        </div>
      );
    });
  }

  renderQueries() {
    return this.versions[this.state.currentVersion].queries.map((query, i) => {
      const chosen = query.name === this.state.currentQuery;
      const style = chosen ? {
        backgroundColor: '#f4f4f4'
      } : null;

      return (
        <div>
            <div key={i} className="versions-row" onClick={() => {
                    this.setState({
                        currentQuery: query.name,
                        shouldUpdateQuery: true
                    });
                }} style={style}>
                {query.name}
            </div>
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
