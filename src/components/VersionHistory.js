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
import md5 from 'php-md5';
import CopyToClipboard from 'react-copy-to-clipboard';
import fetch from 'node-fetch';

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
       currentVersionIdx: 0,
       currentBuildIdx:0,
       currentQuery: 0,
       currentQueryIdx: 0,
       currentPlatform: 0,
       shouldUpdateQueryEditor: false,
       version2Builds:[],
       currentQueries:[],
       build2ClientId:[],
       copied: false,
       currentDevice: ''
    };
  }

  generateSignature(query) {
      query = query.replace("\r","");
      let signature = md5(query);
      return signature;
  }

  getCurBuildNum() {
    if (this.state.version2Builds === undefined || this.state.version2Builds.length == 0) {
      return -1;
    }
    // console.log("************************");
    // console.log(this.state.version2Builds);
    var buildsArr = this.state.version2Builds[this.state.currentVersionIdx].builds;
    // console.log("buildsArr",JSON.stringify(buildsArr));
    // console.log(this.state.currentBuildIdx);
    // console.log("========================");
    var buildNum = buildsArr[this.state.currentBuildIdx].id;
    // console.log("buildsID", buildNum);
    return buildNum;
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

      let curBuildNum = this.getCurBuildNum();
      let curVersionNum = this.state.version2Builds[this.state.currentVersionIdx].version;
      let oldSignature = this.state.currentQueries[this.state.currentQueryIdx].signature;
      let curPlatform = this.state.currentPlatform;

      var url = apiHelper.getUrl('version=' + curVersionNum + '&method=uploadGQL&format=json&dateFormat=sec&req=P&signature=' + oldSignature + '&platform=' + curPlatform + '&build=' + curBuildNum);
      fetch(url, headers).then(res => {
        // console.log(res);
        this.getCurrentQueries(this.state.currentBuildIdx);
        this.toast('Updated', 'success');
      }).catch((err) => {
        // console.log(err);
        this.toast(err.name, 'error');
      });
  }

  retrieveInfoFromRes(res) {
      let versionToBuilds = [];
      let buildToClientId = [];

      for (let key in res.Clients) {
          let elem = res.Clients[key];

          let curVersion = elem.version;
          let curBuild = elem.build;
          let curClidntId = elem.client_id;

          let idx;
          // check whether the curVersion exists
          for (let i in versionToBuilds) {
              let elemVB = versionToBuilds[i];
              // console.log(elemVB);
              if (elemVB.version === curVersion) {
                  idx = i;
                  break;
              }
          }

          if (idx === undefined) {
              // this version doesn't exists
              let elembuild = [];
              elembuild.push({
                "id": curBuild
              });

              let e = {
                  "version": curVersion,
                  "builds": elembuild
              };

              versionToBuilds.push(e);
          } else {
              // this version already exist
              versionToBuilds[idx].builds.push(
                {"id": curBuild}
              );
          }

          buildToClientId.push({
              "build": curBuild,
              "clientId": curClidntId
          });
      }

      // console.log("=============");
      // console.log(JSON.stringify(versionToBuilds));

      // sort by version in descreading order
      versionToBuilds.sort((a,b) => {
          return b.version - a.version;
      });

      // sort build for each version
      versionToBuilds.forEach(elem => {
          elem.builds.sort((a, b) => {
              return b.id - a.id;
          });
      });

      this.setState({
          build2ClientId: buildToClientId,
          version2Builds: versionToBuilds,
      });
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

        // this.state.versions[this.state.currentVersionIdx].queries.map((query, i) => {
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

  getCurrentQueries(buildIdx) {
      this.setState(
        {
            currentBuildIdx: buildIdx,
            shouldUpdateQueryEditor: true,
        }
      );

      var buildsArr = this.state.version2Builds[this.state.currentVersionIdx].builds;
      // console.log("buildsArr",JSON.stringify(buildsArr));
      var buildId = buildsArr[buildIdx].id;
      // console.log("buildsID", buildId);

      let clientId;
      // get clientID
      this.state.build2ClientId.forEach((elem) => {
          if (elem.build === buildId) {
            clientId = elem.clientId;
          }
      });

      this.getGQLsByClientId(clientId);
      // console.log("clientId ==>", clientId);
  }

  getGQLClients(platform) {
      this.setState(
        {
          version2Builds:[],
          currentQueries:[],
          build2ClientId:[],
          currentVersionIdx: 0,
          currentBuildIdx: 0
        }
      );

      var query = this.props.query;

      var url = apiHelper.getUrl('app=test1&version=180&method=getGQLClients&format=json&platform=' + platform);
      console.log(url);

      var headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      };

      apiHelper.fetchUrl(url, headers).then(json => {
          this.retrieveInfoFromRes(json);
      }).catch((err) => {
          this.toast(err.name, 'error');
      });
  }

  getGQLsByClientId(clientId) {
     var url = apiHelper.getUrl('app=test1&version=180&method=getGQLs&format=json&dateFormat=sec&clientid='+clientId);
     console.log(url);

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

        //  console.log("gqls=> ", gqls);
         this.setState(
           {
             currentQueries: gqls,
             shouldUpdateQueryEditor: true
           }
         );
         return gqls;
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
    // console.log('currentVersionIdx: ', this.state.currentVersionIdx);
    // console.log('!!!version2Builds', this.state.version2Builds);
    return this.state.version2Builds.map((elem, i) => {
      const chosen = i === this.state.currentVersionIdx;
      const style = chosen ? {
        backgroundColor: '#A9A9A9'
      } : null;

      // console.log('version id: ', elem.version);

      return (
        <div key={i} className="versions-row-query"
            onClick={() => this.setState({
                currentVersionIdx: i,
                shouldUpdateQueryEditor: true,
            })} style={style}>
             {elem.version}
        </div>
      );
    });
  }

  renderBuilds() {
    // console.log('currentVersionIdx: ', this.state.currentVersionIdx);
    var currentBuilds = this.state.version2Builds[this.state.currentVersionIdx];
    // console.log('version2Builds', JSON.stringify(this.state.version2Builds));
    // console.log('currentBuilds', JSON.stringify(currentBuilds));
    if (currentBuilds == undefined || currentBuilds.length == 0) {
        return ;
    }

    return currentBuilds.builds.map((build, i) => {
        const chosen = i === this.state.currentBuildIdx;
        const style = chosen ? {
            backgroundColor: '#D3D3D3'
        } : null;

        return (
            <div key={i} className="versions-row-query"
                onClick={() => {
                    this.setState({
                        currentBuildIdx: i
                    })
                    this.getCurrentQueries(i)
                  }
                } style={style}>
                {build.id}
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
                    this.updateGQLs();
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
    const buildNodes = this.renderBuilds();
    const queryNodes = this.renderQueries();

    const IOSStyle = this.state.currentDevice == 'IOS' ? {flex: 1, backgroundColor: '#698dae', cursor: 'pointer'} :
    {flex: 1, backgroundColor: '#5DADE2', cursor: 'pointer'};

    const AndroidStyle = this.state.currentDevice == 'Android' ? {flex: 1, backgroundColor: '#698dae', cursor: 'pointer'} :
    {flex: 1, backgroundColor: '#5DADE2', cursor: 'pointer'};

    return (
      <div>
        <div className="history-title-bar">
          <div className="history-title">Query Management System (QMS)</div>
          <div className="doc-explorer-rhs">
            {this.props.children}
          </div>
        </div>

        <div className="qms-title-bar">
        <div className="platform-title" style={{flex: 1, backgroundColor: '#5DADE2', cursor: 'pointer'}}>
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
              <i class="fa fa-apple" aria-hidden="false"></i>
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
              version#
          </div>
          <div className="qms-title" style={{flex: 1, backgroundColor: '#87CEEB', cursor: 'pointer'}}>
              build#
          </div>
          <div className="history-title" style={{flex: 5, backgroundColor: '#87CEEB', cursor: 'pointer'}}>
              queries (signature)
          </div>

        </div>

        <div className="versions-contents">
            <div className="versions-version">
              {versionNodes}
            </div>
            <div className="versions-build">
              {buildNodes}
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
