import React from 'react';
import PropTypes from 'prop-types';
var _ = require('lodash');

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

    shouldComponentUpdate(nextProps) {
        return this.props.value !== nextProps.value;
    }

    componentDidMount() {
    }

    componentDidUpdate(prevProps) {
    }

    componentWillUnmount() {
    }

    checkPerformanceOnZipkin() {
        var zipKin = this.zipKin;
        var traceId = zipKin ? zipKin.traceId : 'unknown';
        var win = window.open('https://zipkin-police.stghouzz.com/zipkin/traces/' + traceId, '_blank');
        win.focus();
    }

    perfCounters(perfData, metricNames) {
        var countersMap = {};
        _.each(perfData, (perServicePerfData, serviceName) => {

            _.each(perServicePerfData, (perMetricData, metricDataName) => {
                metricNames.map(metricName => {
                    if (metricDataName.includes(metricName)) {
                        if (perMetricData) {
                            if (!countersMap[metricName]) {
                                countersMap[metricName] = 0;
                            }
                            countersMap[metricName] += perMetricData.counts;
                        }
                    }
                });
            });

        })

        return countersMap;
    }

    render() {
        var response, perfData, zipkin;
        var perfCounters = {};
        if (this.props.value) {
            response = JSON.parse(this.props.value);
            perfData = response && response._gtrace ? response._gtrace.perfData : null;
            this.zipKin = response && response._gtrace ? response._gtrace.zipKin : null;

            console.log('status bar got response: ', perfData);
            perfCounters = this.perfCounters(perfData, ['sql_reads_slave', 'redis_reads_']);
        }

        console.log('perfCounters: ', perfCounters);

        return (
            <div className="variable-editor">
            <div
            className="variable-editor-title"
            >
            {'Status'} | &nbsp;
            <span onClick={this.checkPerformanceOnZipkin}>
                SQL: {perfCounters.sql_reads_slave} -
                REDIS: {perfCounters.redis_reads_}
            </span>
            </div>
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
