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
       pointers: {
           prod: 4,
           staging: 5,
           live: 4
       },
       versions: [
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
        ]
    };
  }

  componentDidMount() {
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

  promote() {
    var versions = this.state.versions;
    var stagingVersion = versions[0];
    var newStagingVersion = _.cloneDeep(stagingVersion);
    newStagingVersion.id = stagingVersion.id + 1;

    // insert new version to head of the list
    versions.splice(0, 0, newStagingVersion);

    // update pointers as well
    var pointers = this.state.pointers;
    pointers.prod = pointers.staging;
    pointers.staging = pointers.staging + 1;

    this.setState({
        versions,
        pointers,
    });

    setTimeout(() => {
        this.setState({
            currentVersion: 1
        });
    }, 1000);

    this.toast('v ' + pointers.prod + ' promoted to production');
  }

  goLive(versionId) {
    // check if there's any prod versions between this one and live one
    // if so, alert user and abort
    const versions = this.state.versions;
    var needDropFirst = false;
    _.each(versions, (version) => {
        if (version.id < versionId && version.id > this.state.pointers.live) {
            needDropFirst = true;
            return false;
        }
    });
    if (needDropFirst) {
        this.toast('drop those between (live,prod) first', 'error');
        return;
    }

    // update pointer
    var pointers = this.state.pointers;
    pointers.live = versionId;

    setTimeout(() => {
        this.setState({
            pointers
        });
    }, 1000);

    this.toast('v ' + versionId + ' is now live');
  }

  drop(versionId) {
    // update pointer
    var versions = this.state.versions;
    _.remove(versions, (version) => {
        return version.id === versionId;
    });

    var pointers = this.state.pointers;
    if (pointers.prod === versionId) {
        // scan for the next existing lower versionId
        var newProdPointer = null;
        _.each(versions, (version) => {
            if (version.id < versionId) {
                newProdPointer = version.id;
                return false;
            }
        });
        pointers.prod = newProdPointer;
    }

    setTimeout(() => {
        this.setState({
            versions,
            pointers
        });
    }, 1000);

    this.toast('v ' + versionId + 'is dropped');
  }

  renderVersions() {
    console.log('currentVersion: ', this.state.currentVersion);
    return this.state.versions.map((version, i) => {
      const chosen = i === this.state.currentVersion;
      const style = chosen ? {
        backgroundColor: '#cccccc'
      } : null;
      const pointers = this.state.pointers;
      var pointer = null;
      var pointerStyle = {
          position: 'absolute', left: 5, top: 2, padding: 3, borderWidth: 1, width: 28,
          borderRadius: 4, backgroundColor: 'red', color: 'white', fontSize: 9
      };
      if (pointers.prod === version.id) {
          pointer = <div style={pointerStyle}>PROD</div>
      }
      else if (pointers.staging === version.id) {
          pointerStyle.backgroundColor = 'green';
          pointer = <div style={pointerStyle}>STG</div>
      }

      var livePointer = null;
      var livePointerStyle = {
          position: 'absolute', right: 2, top: 2, padding: 3, borderWidth: 1, width: 23,
          borderRadius: 4, backgroundColor: '#088DA5', color: 'white', fontSize: 9
      };
      if (pointers.live === version.id) {
          livePointer = <div style={livePointerStyle}>LIVE</div>;
      }

      var versionActions = null;
      console.log('version id: ', version.id);
      if (chosen && version.id === this.state.pointers.staging) {
        versionActions = (
            <div className='hoverPromote'
                style={{fontSize: 10, padding: 3, borderWidth: 1, borderRadius: 2}}
                onClick={ () => {
                    this.promote();
                }}
                >
                <i className="fa fa-thumbs-up" aria-hidden="true"
                   style={{fontSize: '14px'}}/>
                &nbsp;promote
            </div>
        )
      }
      else if (chosen && version.id > this.state.pointers.live) {
        versionActions = (
            <div>
                <div className='hoverPromote'
                    style={{fontSize: 10, padding: 3, borderWidth: 1, borderRadius: 2}}
                    onClick={ () => {
                        this.goLive(version.id);
                    }}
                    >
                    <i className="fa fa-feed" aria-hidden="true"
                       style={{fontSize: '14px'}}/>
                    &nbsp;air
                </div>
                <div className='hoverPromote'
                    style={{fontSize: 10, padding: 3, borderWidth: 1, borderRadius: 2}}
                    onClick={ () => {
                        this.drop(version.id);
                    }}
                    >
                    <i className="fa fa-trash-o" aria-hidden="true"
                       style={{fontSize: '14px'}}/>
                    &nbsp;drop
                </div>
            </div>
        )
      }

      return (
        <div key={i} className="versions-row-query" onClick={() => this.setState({
                currentVersion: i,
                shouldUpdateQueryEditor: true
            })} style={style}>
             {pointer} v {version.id} {livePointer}
             {versionActions}
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

  renderActionButtons(query, index, isProd) {

    if (isProd && !query.unlocked) {
        return (
            <div className="versions-row-icons" style={{fontSize: 10, color: '#FF3E50'}}
                onClick={() => {
                    query.unlocked = true;
                    var versions = this.state.versions;
                    this.setState({
                        versions
                    })
                }}>
                <i className={'fa fa-unlock'} aria-hidden="true" style={{fontSize: 16}}/>
                &nbsp;unlock this query
            </div>
        );
    }

    var forkClass = "fa fa-code-fork hoverHighlight";
    forkClass += query.value ? "" : " fa-rotate-180";
    var forkStyle = {flex: 1, justifyContent: 'center', color: '', fontSize: '13px', borderRight: '2px solid gray'};

    var lockButton = isProd ? (
        <i key={'lock'} className="fa fa-lock" aria-hidden="true"
           style={{flex: 1, justifyContent: 'center', color: 'darkgray', fontSize: '14px', borderLeft: '2px solid gray'}}
           onClick={() => {
                query.unlocked = false;
                var versions = this.state.versions;
                this.setState({
                    versions
                });
            }}/>
    ) : null;

    return (
        <div key={'action-buttons'} className="versions-row-icons">
            <i key={'fork'} className={forkClass} aria-hidden="true"
               style={forkStyle}
               onClick={() => {
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
               }}></i>
            <i key={'clone'} className="fa fa-clone hoverHighlight" aria-hidden="true"
               style={{flex: 1, justifyContent: 'center', borderRight: '2px solid gray', color: '#5ac0df', fontSize: '13px'}}
               onClick={() => {
                    var newOperationName = this.props.operationName;
                    newOperationName += 'Cloned';
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
                    var currentQueries = this.state.versions[this.state.currentVersion].queries;
                    currentQueries.splice(index + 1, 0, newQuery);

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
                    query.name = newOperationName;

                    if (query.value) {
                        query.value = this.props.query;
                    } else {
                        query.devices[this.state.currentDevice] = this.props.query;
                    }

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
            {lockButton}
        </div>
    );
  }

  renderQueries() {
    var currentVersion = this.state.versions[this.state.currentVersion];

    return currentVersion.queries.map((query, i) => {
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

      const isProdQuery = this.state.pointers.prod >= currentVersion.id;
      const actionButtons = chosen ? this.renderActionButtons(query, i, isProdQuery) : null;

      var lockIcon = isProdQuery && !query.unlocked ? (
        <i className={'fa fa-lock'} aria-hidden="true" style={{position: 'absolute', right: 2, top: 2, fontSize: 14, color: 'gray'}}/>
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
                {lockIcon}
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
          <div className="history-title" style={{flex: 2, backgroundColor: '#008000', cursor: 'pointer', color: 'white'}}>
              id
          </div>
          <div className="history-title" style={{flex: 3, backgroundColor: '#b2d582', cursor: 'pointer'}}>
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
