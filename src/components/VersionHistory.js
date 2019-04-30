import { parse } from 'graphql';
import React from 'react';
import PropTypes from 'prop-types';
import HistoryStore from '../utility/HistoryStore';
import HistoryQuery from './HistoryQuery';
import StripIndent from 'strip-indent';
import _ from 'lodash';
var ReactToastr = require("react-toastr");
var {ToastContainer} = ReactToastr; // This is a React Element.
import apiHelper from '../utility/apiHelper';
import md5 from 'md5';
import CopyToClipboard from 'react-copy-to-clipboard';
import fetch from 'node-fetch';
import CJSON from 'circular-json';
var urlUtil = require('url');

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
    selected: PropTypes.string,
  }

  constructor(props) {
    super(props);
    this.state = {
       currentVersionIdx: 0,
       currentQuery: 0,
       currentQueryIdx: 0,
       currentPlatform: 0,
       shouldUpdateQueryEditor: false,
       currentQueries:[],
       copied: false,
       currentDevice: '',
       initialized: false,
       version2ClientId:[]
    };
  }

  componentDidMount() {
  }

  componentWillMount() {

  }

  componentDidUpdate() {
    if (this.props.selected != undefined && this.props.selected && !this.state.initialized) {
        this.setState({
            currentPlatform: 0,
            currentDevice: 'IOS',
        })

        this.getGQLClients(0);
        this.setState({
          initialized: true
        });
    }
    if (this.state.shouldUpdateQueryEditor) {
        const selectQueryFn = this.props.onSelectQuery;
        if (!selectQueryFn) {
            return;
        }

        var hasChosen = false;

        if (this.state.currentQueries === undefined || this.state.currentQueries.length === 0) {
            return ;
        }
        this.state.currentQueries.map((query, i) => {

          const chosen = i === this.state.currentQueryIdx;

          if (chosen) {
            hasChosen = true;
            var queryValue = query.value ? query.value : null;
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

  generateSignature(query) {
      query = query.replace("\r","");
      let signature = md5(query);
      return signature;
  }

  checkPQEditPermission() {
      var url = window.location.href;
      var urlObject = urlUtil.parse(url);
      var host = urlObject.host;
      var protocol = urlObject.protocol;

      let curUrl = protocol + "//" + host + "/j/graphiql-auth?auth=editGraphouzzPQ";
      var headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'compress': false,
      };

      return apiHelper.fetchUrl(curUrl, headers).then(json => {
          return json;
      }).catch((err) => {
          this.toast(err.name, 'error');
      });
  }

  updateGQLsWithPQPermission() {
      let checkPQEditPermissionPromise = this.checkPQEditPermission();
      checkPQEditPermissionPromise.then(res => {
         if (res.status === 0) {
             this.updateGQLs();
         } else {
             this.toast('No Permission to Edit', 'error');
         }
      });
  }

  updateGQLs() {
      // get current query from the edited board
      let editedQuery = this.props.query;
      let curQuery = this.state.currentQueries[this.state.currentQueryIdx].value;

      let editSignature = this.generateSignature(editedQuery);
      let curSignature = this.generateSignature(curQuery);

      if (editSignature === curSignature) {
          this.toast('Current GQL NOT Changed', 'error');
          return ;
      }

      let headers = {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'compress': false,
        },
        body: editedQuery,
      };

      let curVersion = this.state.version2ClientId[this.state.currentVersionIdx].version;
      let oldSignature = this.state.currentQueries[this.state.currentQueryIdx].signature;
      let curPlatform = this.state.currentPlatform;

      var url = apiHelper.getUrl('app=test1&release=' + curVersion + '&method=uploadGQL&format=json&dateFormat=sec&req=P&signature=' + oldSignature + '&platform=' + curPlatform);
      fetch(url, headers).then(res => {
        this.getCurrentQueries(this.state.currentVersionIdx);
        this.toast('Updated', 'success');
      }).catch((err) => {
        this.toast(err.name, 'error');
      });
  }

  retrieveInfoFromRes(res) {
      let versionToClientId = [];
      for (let key in res.Clients) {
          let elem = res.Clients[key];

          // ignore the test clients, the test queries won't show on the tool
          if (elem && elem.is_test === '1') {
              continue;
          }

          let curVersion = elem.version;
          let curClidntId = elem.client_id;

          let e = {
            "version": curVersion,
            "clientId": curClidntId
          };

          versionToClientId.push(e);
      }

      // sort by version in descreading order
      versionToClientId.sort((a,b) => {
          var a1 = a.version.split('.');
          var b1 = b.version.split('.');
          var len = Math.max(a1.length, b1.length);

          for(var i = 0; i< len; i++){
              var _a = +a1[i] || 0;
              var _b = +b1[i] || 0;
              if(_a === _b) continue;
              else return _a > _b ? -1 : 1;
          }
          return 0;
      });

      if (versionToClientId && versionToClientId.length) {
          this.setState({
              version2ClientId: versionToClientId
          });

          this.getCurrentQueries(0);
      }
  }

  getCurrentQueries(versionIdx) {
      this.setState(
        {
            shouldUpdateQueryEditor: true,
        }
      );

      let elem = this.state.version2ClientId[versionIdx];
      let clientId = this.state.version2ClientId[versionIdx].clientId;
      this.getGQLsByClientId(clientId);
  }

  // get getGQLClients by platform
  getGQLClients(platform) {
      this.setState(
        {
          version2ClientId:[],
          currentQueries:[],
          currentVersionIdx: 0,
        }
      );

      var query = this.props.query;

      var url = apiHelper.getUrl('app=test1&version=180&method=getGQLClients&format=json&platform=' + platform);

      var headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'compress': false,
      };

      apiHelper.fetchUrl(url, headers).then(json => {
          this.retrieveInfoFromRes(json);
      }).catch((err) => {
          this.toast(err.name, 'error');
      });
  }

  // get GQLs by client id
  getGQLsByClientId(clientId) {
     var url = apiHelper.getUrl('app=test1&version=180&method=getGQLs&format=json&dateFormat=sec&clientid='+clientId);
     var headers = {
         'Accept': 'application/json',
         'Content-Type': 'application/json',
         'compress': false,
     };

     apiHelper.fetchUrl(url, headers).then(json => {
         let gqls = [];
         for (let key in json.GQLs) {
             let gql = json.GQLs[key];
             let e = {
                "name": gql.name,
                "signature": gql.signature,
                "value": gql.query
             };
             gqls.push(e);
         }

         if (gqls.length != 0) {
            this.setState(
            {
               currentQueries: gqls,
               shouldUpdateQueryEditor: true
            });
         }
     }).catch((err) => {
        this.toast(err.name, 'error');
     });
 }

 getShortSignature(signature) {
    if (signature.length > 8) {
        return signature.substring(0, 8);
    } else {
        return signature;
    }
 }

 getCurrentSignature() {
     let curIdx = this.state.currentQueryIdx;
     let curQuery = this.state.currentQueries[curIdx];
     return curQuery.signature;
 }



 renderVersions() {
    return this.state.version2ClientId.map((elem, i) => {
      const chosen = i === this.state.currentVersionIdx;
      const style = chosen ? {
        backgroundColor: '#A9A9A9',
      } : null;

      return (
        <div key={i} className="versions-row-query"
            onClick={() => {
              this.setState({
                currentVersionIdx: i,
                currentQueryIdx: 0,
                shouldUpdateQueryEditor: true,
                currentQueries: this.getCurrentQueries(i)
              })
            }
          } style={style}>
             {elem.version}
        </div>
      );
    });
  }

  toast(msg, method) {
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
                    var versions = this.state.currentQueries;
                    this.setState({
                        versions
                    })
                }}>
                <i className={'fa fa-unlock'} aria-hidden="true" style={{fontSize: 16}}/>
                &nbsp;unlock this query
            </div>
        );
    }

    var lockButton = isProd ? (
        <i key={'lock'} className="fa fa-lock" aria-hidden="true"
           style={{flex: 1, justifyContent: 'center', color: 'darkgray', fontSize: '20px', borderLeft: ''}}
           title="Lock cur GQL"
           onClick={() => {
                query.unlocked = false;
                var versions = this.state.currentQueries;
                this.setState({
                    versions
                });
            }}/>
    ) : null;

    return (
        <div key={'action-buttons'} className="versions-row-icons">
            <i key={'save'} className="fa fa-floppy-o  hoverHighlight" aria-hidden="true"
               style={{flex: 1, justifyContent: 'center', borderRight: '2px solid gray', color: '#3C9450', fontSize: '20px'}}
               title="Save Updated GQL"
               onClick={() => {
                    // this.updateGQLs();
                    this.updateGQLsWithPQPermission();
                }}></i>

                <CopyToClipboard text={this.getCurrentSignature()}
                    onCopy={() => {
                        this.setState({copied: true})
                        this.refs.container.success(
                            "",
                            "Signature Copied To Clipboard", {
                                timeOut: 3000,
                            });
                    }}>
                    <i key={'saveToClipboard'} className="fa fa fa-clipboard fa-lg hoverHighlight" aria-hidden="true"
                       style={{flex: 1, justifyContent: 'center', borderRight: '2px solid gray', color: '#3C9450', fontSize: '20px'}}
                       title="Copy Signature To Clipboard"></i>
                </CopyToClipboard>
            {lockButton}
        </div>
    );
  }

  renderQueries() {
    var currentQueries = this.state.currentQueries;
    if (currentQueries == undefined || currentQueries.length == 0) {
      return ;
    }
    return currentQueries.map((query, i) => {
      const chosen = i === this.state.currentQueryIdx;
      const style = chosen ? {
        backgroundColor: '#dbdbdb'
      } : null;

      const isProdQuery = true;
      const actionButtons = chosen ? this.renderActionButtons(query, i, isProdQuery) : null;

      var lockIcon = !query.unlocked ? (
        <i className={'fa fa-lock'} aria-hidden="true" style={{position: 'absolute', right: 2, top: 2, fontSize: 20, color: 'gray'}}/>
      ) : null;

      return (
        <div>
            <div key={i} className="versions-row-query"
                onClick={() => {
                    var currentQuery = query.name;

                    this.setState({
                        currentQuery,
                        shouldUpdateQueryEditor: true,
                        currentQueryIdx: i,
                    });
                }} style={style}>
                {lockIcon}
                {query.name} ({this.getShortSignature(query.signature)})
            </div>
            {actionButtons}
        </div>
      );
    });
  }

  render() {
    const versionNodes = this.renderVersions();
    const queryNodes = this.renderQueries();

    const IOSStyle = this.state.currentDevice == 'IOS' ?
        {flex: 4, backgroundColor: '#698dae', cursor: 'pointer'} :
        {flex: 4, backgroundColor: '#5DADE2', cursor: 'pointer'};

    const AndroidStyle = this.state.currentDevice == 'Android' ?
        {flex: 4, backgroundColor: '#698dae', cursor: 'pointer'} :
        {flex: 4, backgroundColor: '#5DADE2', cursor: 'pointer'};

    return (
      <div>
        <div className="history-title-bar">
          <div className="history-title">Persisted Queries</div>
          <div className="doc-explorer-rhs">
            {this.props.children}
          </div>
        </div>

        <div className="qms-title-bar">
        <div className="platform-title" style={{flex: 2, backgroundColor: '#5DADE2', cursor: 'pointer'}}>
          Platform:
        </div>
            <div className="history-title" style={IOSStyle}
                onClick={
                    () => {
                        this.setState({
                            currentPlatform: 0,
                            currentDevice: 'IOS',
                        })
                        this.getGQLClients(0);
                    }
                }>
              IOS
            </div>
            <div className="history-title" style={AndroidStyle}
                onClick={
                    () => {
                        this.setState({
                            currentPlatform: 1,
                            currentDevice: 'Android',
                          })
                        this.getGQLClients(1);
                    }
                }>
              Android
            </div>
        </div>
        <div className="qms-title-bar">
          <div className="qms-title" style={{flex: 1, backgroundColor: '#87CEEB', cursor: 'pointer'}}>
              release#
          </div>
          <div className="history-title-left" style={{flex: 4, backgroundColor: '#87CEEB', cursor: 'pointer'}}>
              queries (signature)
          </div>

        </div>

        <div className="versions-contents">
            <div className="versions-version">
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
