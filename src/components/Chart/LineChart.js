import React from 'react';
import * as d3 from 'd3';
import './LineChart.css';

const LineChart = (props) => {
    React.useEffect(() => {
        const data = formatData(props.data);
        drawLineChart(data);
    }, [props.data]);

    return (
        <>
            <div id={'lineChart'}/>
            <div id={'summaryChart'}/>
        </>
    );
};

const drawLineChart = (data) => {
    cleanupDOM();

    const margin = {top: 50, right: 50, bottom: 20, left: 50};
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;


    // create chart
    const svg = d3.select('#lineChart')
        .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // create x axis
    let x = d3.scaleLinear()
        .domain([d3.min(data, (d) => d.category), d3.max(data, (d) => d.category)])
        .range([0, width]);
    svg.append("g")
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0));

    // create y axis
    let y = d3.scaleLinear().domain([0, 100])
        .range([height, 0]);
    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).tickSize(-width).tickFormat(d => d + '%'));

    // create line
    let line = d3.line()
        .x((d) => x(d.category))
        .y((d) => y(d.percentage));
    svg.append('path')
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr('d', line);

    // create element for mouse hover target
    const target = svg.append("g").style("display", "none");

    // horizontal target line
    target.append('line')
        .attr("class", "x")
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr('x1', 0)
        .attr('x2', width);

    // vertical target line
    target.append('line')
        .attr("class", "y")
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr('y1', 0)
        .attr('y2', height);

    // point on target
    target.append('circle')
      .attr("r", "5")
        .style('fill');

    const toolTip = d3.select('#lineChart')
        .append('div')
        .style('display', 'none')
        .attr('class', 'tooltip');

    // create chart header text
    svg.append('div')
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Percent Value vs Category");

    const handleMouseOver = (event) => {
        const bisectCategory = d3.bisector(d => d.category).left;
        const x0 = x.invert(d3.pointer(event)[0]);
        const i = bisectCategory(data, x0, 1);
        const d0 = data[i - 1];
        const d1 = data[i];
        if (d0 === undefined || d1 === undefined) return;
        const d = x0 - d0.category > d1.category - x0 ? d1 : d0;

        const xc = x(d.category);
        const yc = y(d.percentage);

        target.select('circle')
            .attr('transform', `translate(${xc}, ${yc})`);

        target.select('.x')
            .attr('y1', yc)
            .attr('y2', yc);

        target.select('.y')
		    .attr('x1', xc)
            .attr('x2', xc);

        let toolTipHtml = '';
        d.users.forEach(user => {
            toolTipHtml += `${user}<br/>`
        });
        console.log(svg.node().getBoundingClientRect());
        toolTip
            .html(`${toolTipHtml}`)
            .style('left', `${svg.node().getBoundingClientRect().x + xc + 35}px`)
            .style('top', `${svg.node().getBoundingClientRect().y + yc - 35}px`)
            .style('display', 'unset');
    };

    // create dummy element for mousemove to calculate closest data point distance
    svg.append('rect')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseover', () => target.style('display', 'unset'))
        .on('mouseout', () => {
            target.style('display', 'none');
            toolTip.style('display', 'none');
        })
        .on('mousemove', handleMouseOver);


    // create brush chart
    const margin2 = {top: 10, right: 30, bottom: 30, left: 50};
    const height2 = 65 - margin2.top - margin2.bottom;

    const onBrush = (event) => { };

    const onBrushEnd = (event) => { };

    const x2 = d3.scaleLinear()
        .domain([d3.min(data, (d) => d.category), d3.max(data, (d) => d.category)])
        .range([0, width]);
    const y2 = d3.scaleLinear().domain([d3.min(data,(d) => d.percentage), d3.max(data,(d) => d.percentage)])
        .range([height2, 0]);

    const line2 = d3.line()
        .x((d) => x2(d.category))
        .y((d) => y2(d.percentage));

        // create chart
    const svg2 = d3.select('#summaryChart')
        .append('svg')
            .attr('width', width + margin2.left + margin2.right)
            .attr('height', height2 + margin2.top + margin2.bottom)
        .append('g')
            .attr('transform', `translate(${margin2.left},${margin2.top})`);

    svg2.append('path')
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr('d', line2);

    const brush = d3.brushX()
        .extent([[0, -2], [width, height2]])
        .on('brush', onBrush)
        .on("end", onBrushEnd);
    svg2.append("g")
      .call(brush)
      .call(brush.move, [0, width/3]);
};

/**
 * Create new array of objects sorted by category, contains calculated percentage by category, and combined names for
 * shared categories
 * @param data
 * @return formattedData [ { percentage: 42, category: 5 , users: [user1, user2, ...] }, ... ]
 */
const formatData = (data) => {
    const formattedData = [];
    let total = 0;

    // sort by category
    data.sort((a, b) => (a.category > b.category) ? 1 : -1);

    // calculate total
    data.forEach((d) => { total += d.value; });

    // create formatted data
    let currAggValue = 0;
    let currUsers = [];
    data.forEach((d, i) => {
        currAggValue += d.value;
        currUsers.push(d.user);
        let isLastElement = (i === data.length - 1);
        if (isLastElement || (!isLastElement && data[i+1].category !== d.category)) {
            formattedData.push({
                percentage: currAggValue / total * 100,
                category: d.category,
                users: currUsers
            });
            currUsers = [];
            currAggValue = 0;
        }
    });
    return formattedData;
};

/**
 * Clear old dom elements
 */
const cleanupDOM= () => {
    // remove existing chart and tooltip
    d3.select('#lineChart')
      .select('svg')
      .remove();

    d3.select('#lineChart')
      .select('.tooltip')
      .remove();

    d3.select('#summaryChart')
      .select('svg')
      .remove();
};

export default LineChart;