import React from 'react';
import PropTypes from 'prop-types';
const _ = require('lodash');
import { ToastContainer, toast } from 'react-toastify';


/**
 * ResultStatusBar
 */
export class ResultStatusBar extends React.Component {
  static propTypes = {
    value: PropTypes.string
  }

  constructor(props) {
    super();
    this.checkPerformanceOnZipkin = this.checkPerformanceOnZipkin.bind(this);
  }

  /*
  shouldComponentUpdate(nextProps) {
    return this.props.value !== nextProps.value;
  }*/

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
      console.log('status updated!!');
  }

  componentWillUnmount() {
      console.log('ResultStatusBar will unmount');
  }

  checkPerformanceOnZipkin() {
    const zipKin = this.zipKin;
    const traceId = zipKin ? zipKin.traceId : 'unknown';
    const win = window.open('https://zipkin-police.stghouzz.com/zipkin/traces/' + traceId, '_blank');
    win.focus();
  }

  perfCounters(perfData, metricNames) {
    const countersMap = {};
    metricNames.map(metricName => {
        countersMap[metricName] = 0;
    });
    
    _.each(perfData, (perServicePerfData, serviceName) => {

      _.each(perServicePerfData, (perMetricData, metricDataName) => {
        metricNames.map(metricName => {
          if (metricDataName.includes(metricName)) {
            if (perMetricData) {
              countersMap[metricName] += perMetricData.counts;
            }
          } 
        });
      });

    });

    return countersMap;
  }

  render() {
    let response, perfData, zipkin;
    let perfCounters = {};
    if (this.props.value) {
      try {
        response = JSON.parse(this.props.value);

        if (response && response._gtrace) {
            perfData = response._gtrace.perfData;
            this.zipKin = response._gtrace.zipKin;

            console.log('status bar got response: ', perfData);
            perfCounters = this.perfCounters(perfData, [ 'sql_reads_slave', 'redis_reads_' ]);

            // non-batching call detection
            const qLB = response._gtrace.Q_LB;
            var uniqResolverNames = {};
            var servicesDeclared = 1;
            _.each(qLB, (uniqResolvers, queryPath) => {
                if (uniqResolvers.length > 1 ) {
                    uniqResolvers.map(uniqResolver => {
                        if (uniqResolver.servicesDeclared) {
                            servicesDeclared = uniqResolver.servicesDeclared;
                        } else {
                            uniqResolverNames[uniqResolver.split('-')[0]] = null;
                        }
                    })
                }
            });

            var uniqResolverNames = Object.keys(uniqResolverNames);
            const msg = "Un-batched resolvers: \n" + JSON.stringify(uniqResolverNames);
            if (uniqResolverNames && uniqResolverNames.length > 0 &&
                // either there's only one @service, or there's multiple @service but
                // uniq resolver calls is still a multiplier of it.
                (servicesDeclared === 1 || uniqResolverNames.length / servicesDeclared > 1)) {
                setTimeout(() => {
                    alert(msg);
                    /* XXX - this doesn't work
                    toast.warn(msg, {
                        position: toast.POSITION.TOP_CENTER,
                        autoClose: 6000
                    });
                    */
                }, 1000);
            }
        }

      } catch (e) {
        console.log('ResultStatusBar: exception:', e);
      }
    }

    console.log('perfCounters: ', perfCounters);

    return (
      <div className="variable-editor">
        <div
          className="resultStatusBar">
          {'Status'} | &nbsp;
            <span onClick={this.checkPerformanceOnZipkin}>
                SQL: {perfCounters.sql_reads_slave} -
                REDIS: {perfCounters.redis_reads_}
            </span>
        </div>
        <ToastContainer />
      </div>
    );
  }


    /**
    * Public API for retrieving the DOM client height for this component.
    */
  getClientHeight() {
    return this._node && this._node.clientHeight;
  }
}
