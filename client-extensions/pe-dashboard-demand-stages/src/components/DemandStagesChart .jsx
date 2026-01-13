import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';
const DemandStagesChart = () => {
  const stageData = {
    demandInitiation: 12,
    demandIntake: 134,
    preAnalysis: 86,
    moveToDelivery: 6
  };

  const total =
    stageData.demandInitiation +
    stageData.demandIntake +
    stageData.preAnalysis +
    stageData.moveToDelivery;

  const donePercentage = ((stageData.moveToDelivery / total) * 100).toFixed(1);

  const options = {
    chart: {
      type: 'bar',
      height: 290,
      marginRight: 80 
    },

    title: {
      text: 'Demand Stages',
      align: 'left'
    },

    xAxis: {
      categories: [''],
      visible: false
    },

    yAxis: {
      visible: false,
      max: 100
    },

    legend: {
      align: 'center',
      verticalAlign: 'bottom'
    },

    tooltip: {
      pointFormat: '<b>{point.percentage:.1f}%</b>'
    },

    plotOptions: {
      bar: {
        stacking: 'percent',
        borderRadius: 6,
        pointPadding: 0,
        groupPadding: 0.05
      }
    },

    series: [
      {
        name: 'Demand Initiation',
        data: [stageData.demandInitiation],
        color: '#2ecc71'
      },
      {
        name: 'Demand Intake',
        data: [stageData.demandIntake],
        color: '#0b7a4b'
      },
      {
        name: 'Pre-Analysis Phase',
        data: [stageData.preAnalysis],
        color: '#5b9bff'
      },
      {
        name: 'Move to Delivery',
        data: [stageData.moveToDelivery],
        color: '#d9d9d9'
      }
    ],

    accessibility: {
      enabled: false
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <HighchartsReact highcharts={Highcharts} options={options} />

      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          fontWeight: 600
        }}
      >
        {donePercentage}% Done
      </div>
    </div>
  );
};

export default DemandStagesChart;
