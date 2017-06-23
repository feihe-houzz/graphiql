import { parse } from 'graphql';
import React from 'react';
import PropTypes from 'prop-types';
import HistoryStore from '../utility/HistoryStore';
import HistoryQuery from './HistoryQuery';
import StripIndent from 'strip-indent';
import _ from 'lodash';
var ReactToastr = require("react-toastr");
var {ToastContainer} = ReactToastr; // This is a React Element.
// For Non ES6...
// var ToastContainer = ReactToastr.ToastContainer;
var ToastMessageFactory = React.createFactory(ReactToastr.ToastMessage.animation);


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
            var queryValue = query.value ? query.value : query.devices[this.state.currentDevice];
            selectQueryFn(StripIndent(queryValue), '', query.name); // notify parent
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
            v {i}
        </div>
      );
    });
  }

  renderToast(msg) {

    return (
        <div style={{
            position: 'absolute', right: '40%', bottom: '20px',
            backgroundColor: 'black', color: '#f2f2f2', padding: '5px 10px',
            justifyContent: 'center', alignItems: 'center'
        }}>
            {msg}
        </div>
    );
  }

  toast(msg, method = 'success') {
    this.refs.container[method](
        "",
        msg, {
            timeOut: 3000,
        }
    );
  }

  renderQueries() {
    return this.state.versions[this.state.currentVersion].queries.map((query, i) => {
      const chosen = query.name === this.state.currentQuery;
      const style = chosen ? {
        backgroundColor: '#f4f4f4'
      } : null;

      const showDeviceButtons = chosen && !query.value;
      const deviceButtons = showDeviceButtons ? (
        <div key={'device-buttons'} className="versions-row-buttons" onClick={() => {
            }}>
            <div className="hoverHighlight" style={{flex: 1, justifyContent: 'center', borderRightWidth: '1px',
                fontSize: '10px', color: '', borderRight: '2px solid gray', backgroundColor: this.state.currentDevice === 'iOS' ? '#f4f4f4' : ''}}
                onClick={() => {
                    this.setState({
                        currentDevice: 'iOS',
                        shouldUpdateQueryEditor: true,
                    })
                }}>
                iOS
            </div>
            <div className="hoverHighlight" style={{flex: 1, justifyContent: 'center', borderRightWidth: '1px',
                    fontSize: '10px', color: '', backgroundColor: this.state.currentDevice === 'android' ? '#f4f4f4' : ''}}
                onClick={() => {
                    this.setState({
                        currentDevice: 'android',
                        shouldUpdateQueryEditor: true,
                    })
                }}>
                android
            </div>
        </div>
        ) : null;

      var forkClass = "fa fa-code-fork hoverHighlight";
      forkClass += query.value ? "" : " fa-rotate-180";

      var forkStyle = {flex: 1, justifyContent: 'center', color: '', fontSize: '13px', borderRight: '2px solid gray'};

      const actionButtons = chosen ? (
        <div key={'action-buttons'} className="versions-row-icons">
            <i key={'fork'} className={forkClass} aria-hidden="true"
               style={forkStyle}
               onClick={() => {
                    var currentQueries = this.state.versions[this.state.currentVersion].queries;
                    _.each(currentQueries, (query, i) => {
                        const chosen = query.name === this.state.currentQuery;
                        if (chosen) {
                            if (query.value) {
                                query.devices = {};
                                query.devices.iOS = query.value;
                                query.devices.android = query.value;
                                query.value = null;

                                this.toast('splitted into iOS and android');
                                this.setState({
                                    versions: this.state.versions,
                                    currentDevice: 'iOS',
                                    shouldUpdateQueryEditor: true,
                                })
                            } else {
                                if (query.devices.iOS !== query.devices.android) {
                                    this.toast('merge failed: device query mismatch', 'error');
                                } else {
                                    query.value = query.devices.iOS;
                                    delete query.devices;
                                    this.toast('merged iOS and android');
                                }
                                this.setState({
                                    versions: this.state.versions,
                                    shouldUpdateQueryEditor: true,
                                })
                            }

                            return false;
                        }
                    });
               }}></i>
            <i key={'clone'} className="fa fa-clone hoverHighlight" aria-hidden="true"
               style={{flex: 1, justifyContent: 'center', borderRight: '2px solid gray', color: '#5ac0df', fontSize: '13px'}}
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

                            if (newQuery.value) {
                                newQuery.value = newQuery.value.replace(this.state.currentQuery, newOperationName);
                            } else {
                                newQuery.devices.iOS = newQuery.devices.iOS.replace(this.state.currentQuery, newOperationName);
                                newQuery.devices.android = newQuery.devices.android.replace(this.state.currentQuery, newOperationName);
                            }

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
                    this.refs.container.success(
                        "",
                        "cloned", {
                            timeOut: 3000,
                        });
               }}></i>
            <i key={'save'} className="fa fa-floppy-o hoverHighlight" aria-hidden="true"
               style={{flex: 1, justifyContent: 'center', borderRight: '2px solid gray', color: '#3C9450', fontSize: '14px'}}
               onClick={() => {
                    const newOperationName = this.props.operationName;

                    _.each(this.state.versions[this.state.currentVersion].queries, (query, i) => {
                        const chosen = query.name === this.state.currentQuery;
                        if (chosen) {
                            query.name = newOperationName;

                            if (query.value) {
                                query.value = this.props.query;
                            } else {
                                query.devices[this.state.currentDevice] = this.props.query;
                            }
                            return false;
                        }
                    });
                    this.setState({
                        versions: this.state.versions,
                        currentQuery: newOperationName
                    })
                    this.refs.container.success(
                        "",
                        "saved", {
                            timeOut: 3000,
                        });
                }}></i>
            <i key={'delete'} className="fa fa-trash-o hoverHighlight" aria-hidden="true"
               style={{flex: 1, justifyContent: 'center', color: '#f88664', fontSize: '14px'}}
               onClick={() => {
                    _.remove(this.state.versions[this.state.currentVersion].queries, (query) => {
                        return query.name === this.state.currentQuery;
                    });
                    this.setState({
                        versions: this.state.versions,
                        currentQuery: '',
                        shouldUpdateQueryEditor: true,
                    })
                    this.refs.container.warning(
                        "",
                        "deleted", {
                            timeOut: 3000,
                        });
               }}></i>
        </div>
        ) : null;

      return (
        <div>
            {deviceButtons}
            <div key={i} className="versions-row-query" onClick={() => {
                    var currentQuery = query.name;
                    if (this.state.currentQuery === query.name) {
                        currentQuery = '';
                    }
                    this.setState({
                        currentQuery,
                        shouldUpdateQueryEditor: true,
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
        <ToastContainer ref="container"
                        toastMessageFactory={ToastMessageFactory}
                        style={{position: 'absolute', right: '0px', bottom: '30px'}} />
    </div>
    );
  }
}
