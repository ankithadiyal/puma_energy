import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../../../pe-dashboard-demand-types-cx/src/common/axios';
const DemandInitiatorTeamChart = () => {

  const [categories, setCategories] = useState([]);
  const [seriesData, setSeriesData] = useState([]);
  const [colors, setColors] = useState([]);

  const scopeGroupId = Liferay.ThemeDisplay.getScopeGroupId();
  const constructedUrl = `/o/c/demandintakes/scopes/${scopeGroupId}`;

  useEffect(() => {
    const container = document.querySelector('.demand-initiator .dashboard-card');

    if (!container) {
      console.error('dashboard-card not found inside demand-initiator');
      return;
    }

    const styles = getComputedStyle(container);

    const extractedColors = styles
      .getPropertyValue('--chart-colors')
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    setColors(extractedColors);

    console.log('DemandInitiatorTeamChart Colors:', extractedColors);
  }, []);



  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosPrivate.get(constructedUrl, {
          params: {
            restrictFields: 'actions,status,creator',
            pageSize: 200
          }
        });

        const items = response.data.items || [];

        const grouped = {};

        items.forEach(item => {
          const team = item.initiatorTeam || 'Unknown';
          grouped[team] = (grouped[team] || 0) + 1;
        });

        const dynamicCategories = Object.keys(grouped);
        const dynamicData = Object.values(grouped);

        setCategories(dynamicCategories);
        setSeriesData(dynamicData);

      } catch (error) {
        console.error('Error fetching initiator team data:', error);
      }
    };

    fetchData();
  }, []);



  const options = {
    chart: {
      type: 'column'
    },

    colors: colors,

    title: {
      text: null
    },

    xAxis: {
      categories: categories,
      crosshair: true,
      labels: {
        rotation: 0, 
        style: {
          whiteSpace: 'nowrap'
        }
      }
    },

    yAxis: {
      min: 0,
      title: {
        text: 'Count'
      },
      allowDecimals: false
    },

    tooltip: {
      headerFormat: '<b>{point.key}</b><br/>',
      pointFormat: 'Count: <b>{point.y}</b>'
    },

    plotOptions: {
      column: {
        borderRadius: 6,        
        pointPadding: 0.2,
        groupPadding: 0.15,
        dataLabels: {
          enabled: true,       
          format: '{y}'
        }
      }
    },

    legend: {
      enabled: false           
    },

    series: [
      {
        name: 'Count',
        data: seriesData,
      }
    ],

    accessibility: {
      enabled: false
    }
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default DemandInitiatorTeamChart;
