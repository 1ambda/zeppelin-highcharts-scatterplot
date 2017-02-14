import Visualization from 'zeppelin-vis'
import ColumnselectorTransformation from 'zeppelin-tabledata/columnselector'

import Highcharts from 'highcharts/highcharts'
require('highcharts/modules/exporting')(Highcharts)

import randomColor from 'randomcolor'

export default class ScatterPlot extends Visualization {
    constructor(targetEl, config) {
        super(targetEl, config)

        this.props = [
            { name: 'xAxis', },
            { name: 'yAxis', },
            { name: 'category', },
        ]

        this.transformation = new ColumnselectorTransformation(
            config, this.props)
    }

    /**
     * @param tableData {Object} includes cols and rows. For example,
     *                           `{columns: Array[2], rows: Array[11], comment: ""}`
     *
     * Each column includes `aggr`, `index`, `name` fields.
     *  For example, `{ aggr: "sum", index: 0, name: "age"}`
     *
     * Each row is an array including values.
     *  For example, `["19", "4"]`
     */
    render(tableData) {
        const conf = this.config

        /** column range chart can be rendered when all axises are defined */
        if (!conf.xAxis || !conf.yAxis || ! conf.category) {
            return
        }

        const rows = tableData.rows

        const [xAxisIndex, xAxisName] = [conf.xAxis.index, conf.xAxis.name]
        const [yAxisIndex, yAxisName] = [conf.yAxis.index, conf.yAxis.name]
        const [categoryIndex, categoryName] = [conf.category.index, conf.category.name]

        const category = extractCategory(categoryIndex, rows)
        const series = createDataStructure(xAxisIndex, yAxisIndex,
            categoryIndex, category, rows)

        const chartOption = createHighchartOption(
            xAxisName, yAxisName, categoryName, series)
        Highcharts.chart(this.targetEl[0].id, chartOption)
    }

    getTransformation() {
        return this.transformation
    }
}

/**
 * @return {Array}
 *
 * See also: http://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/scatter/
 */
export function extractCategory(categoryIndex, rows) {
    const categories = {}

    for(let i = 0; i < rows.length; i++) {
        const row = rows[i]

        const categoryValue = row[categoryIndex]
        if (!categories[categoryValue]) {
            categories[categoryValue] = true
        }
    }

    return Object.keys(categories);
}

/**
 * @return {Array<Array<Object>>}
 *
 * See also: http://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/demo/scatter/
 */
export function createDataStructure(xAxisIndex, yAxisIndex,
                                    categoryIndex, category, rows) {

    const colors = randomColor({
        count: category.length,
        luminosity: 'dark',
        hue: 'blue',
        format: 'rgba',
        alpha: 0.2,
    })

    let series = []

    // set each category and its color
    for(let i = 0; i < category.length; i++) {
        series.push({ name: category[i], data: [], color: colors[i] })
    }

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]

        const xAxisValue = parseFloat(row[xAxisIndex])
        const yAxisValue = parseFloat(row[yAxisIndex])

        // get category value index
        const categoryValue = row[categoryIndex]
        const categoryValueIndex = category.indexOf(categoryValue)

        // push each row
        series[categoryValueIndex].data.push([xAxisValue, yAxisValue])
    }

    return series
}

export function createHighchartOption(xAxisName, yAxisName, yAxisCategories, data) {
    return {
        chart: { type: 'scatter', zoomType: 'xy' },
        title: { text: '', },

        xAxis: {
            title: { text: xAxisName, enable: true, },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            title: { text: yAxisName, },
        },

        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x}, {point.y}'
                }
            }
        },

        legend: {
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
            x: 100,
            y: 70,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },

        series: data,
    }
}
