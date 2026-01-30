import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import React, { useEffect, useState } from 'react';
import { axiosPrivate } from '../common/axios';

const DemandTypesPieChart = () => {

  const [chartData, setChartData] = useState([]);

  const scopeGroupId = Liferay.ThemeDisplay.getScopeGroupId();
  const constructedUrl = `/o/c/demandintakes/scopes/${scopeGroupId}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosPrivate.get(constructedUrl, {
          params: {
            nestedFields:
              'r_categoryId_c_categoryTypeId,r_priorityId_c_priorityTypeId,r_demandStageId_c_demandStageTypeId',
            restrictFields: 'actions,status,creator',
            pageSize: 500
          }
        });

        const items = response.data.items || [];
        const grouped = {};

        items.forEach(item => {
          const categoryObj = item.r_categoryId_c_categoryType;
          if (!categoryObj) return;

          const name = categoryObj.categoryType || 'Unknown';
          const color = categoryObj.color || '#CCCCCC';

          if (!grouped[name]) {
            grouped[name] = {
              name,
              y: 0,
              color
            };
          }

          grouped[name].y += 1;
        });

        setChartData(Object.values(grouped));

      } catch (error) {
        console.error('Error fetching demand types:', error);
      }
    };

    fetchData();
  }, [constructedUrl]);

  const options = {
    chart: {
      type: 'pie'
    },

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
        showInLegend: true
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

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
    />
  );
};

export default DemandTypesPieChart;
