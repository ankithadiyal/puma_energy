import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../common/axios';

const DemandTypesPieChart = () => {

  const [chartData, setChartData] = useState([]);
  const [colors, setColors] = useState([]);

  const scopeKey = Liferay.ThemeDisplay.getScopeGroupId();
  const constructedUrl = `/o/c/demandintakes/scopes/${scopeKey}`;

  useEffect(() => {
  const container = document.querySelector('.demand-types .dashboard-card');

  if (!container) {
    console.error('dashboard-card not found inside demand-types');
    return;
  }

  const styles = getComputedStyle(container);

  const extractedColors = styles
    .getPropertyValue('--chart-colors')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);

  setColors(extractedColors);

  console.log('Colors:', extractedColors);
}, []);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosPrivate.get(constructedUrl, {
          params: {
            scopeKey: scopeKey,
            restrictFields: 'actions,status,creator',
            pageSize: 500
          }
        });

        const items = response.data.items || [];

        const grouped = {};

        items.forEach(item => {
          const categoryName = item.category?.name || 'Unknown';
          grouped[categoryName] = (grouped[categoryName] || 0) + 1;
        });

        const formattedData = Object.keys(grouped).map(key => ({
          name: key,
          y: grouped[key] 
        }));

        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching demand types:', error);
      }
    };

    fetchData();
  }, []);




  const options = {
    chart: {
      type: 'pie'
    },

    colors: colors,

    title: {
      text: null
    },

    tooltip: {
      pointFormat: '<b>{point.percentage:.1f}%</b>'
    },

    legend: {
      enabled: true,
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle',
      itemMarginTop: 10,
      itemMarginBottom: 10,

      labelFormatter: function () {
        return `${this.name} ${this.percentage.toFixed(1)}%`;
      }
    },

    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        showInLegend: true,
        // center: ['35%', '50%']
      }
    },

    series: [
      {
        name: 'Demands',
        colorByPoint: true,
        data: chartData
      }
    ],

    accessibility: {
      enabled: false
    }
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default DemandTypesPieChart;
