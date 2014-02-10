//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
/*
* Application Activity Visualization
* ==================================
* Author: Sidharth Thakur, RENCI (sthakur@renci.org)
* 
* The visualization provides a temporal view of status of applications 
* such as activation, deactivation, launch, and termination. 
*/
//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

// Global data structure to hold application activity data
var Data = "";


//--------------------------------------------------//
// FUNCTION: READY(args NONE)
// Function called when DOM is loaded.
//--------------------------------------------------//

$(document).ready(function () {

    console.log("ready");

    InitApp();
});



//--------------------------------------------------//
// FUNCTION: InitApp(args NONE)
// Function called to initialize the application.
//--------------------------------------------------//

function InitApp() {

    queue()
        .defer(csv, "./data/console.csv")
        .await(function (error, data) {

            // Save out list of datasets to a global variable
            Data = data;

            console.log('Data size :' + Data.length);

            ProcessData();

            Visualize();
        });
}


//--------------------------------------------------//
// Function: csv
// Params: file path, callback reference
// Purpose: Read a csv file.
//--------------------------------------------------//

function csv(path, callback) {
    console.log("reading " + path);
    d3.csv(path, function (csv) {
        csv ? callback(null, csv) : callback("error", null);
    });
}

// Data structures to hold application activity data
var TimeRange = [];         // array of oldest and latest time stamps
var Apps = [];              // list of names of applications
var numHours = 0;           // number of hours in the data set for drawing time axis minor/major axis lines

function ProcessData() {

    // Get time range
    var startTime = +Data[0]["Time"]*1000;
    var endTime = +Data[Data.length - 1]["Time"]*1000;
    var diffTime = (endTime - startTime);
    
    numHours = Math.ceil(diffTime / (1000 * 60 * 60));

    TimeRange.push ((startTime));
    TimeRange.push((endTime));
    
    console.log("Time range: " + TimeRange[0] + " to " + TimeRange[1] + ", diff in milliseconds: " + diffTime);
    console.log("Times: " + (new Date(+TimeRange[0])) + " <> " + (new Date(+TimeRange[1])) );

    Data.forEach(function (d, i) {
        d.ts = (new Date(+d["Time"]*1000));
    });

    Data.forEach(function (d, i) {
        var found = false;
        for (var c = 0; c < Apps.length; c++) {

            if (d["Application"] == Apps[c])
                found = true;
            if (found)
                break;
        }
        if (!found)
            Apps.push(d["Application"]);
    });
    Apps.sort();

    Data.forEach(function (d, i) {
        var found = false;
        for (var c = 0; c < Apps.length; c++) {
            if (d["Application"] == Apps[c])
                found = true;
            if (found) {
                d.idx = c;
                break;
            }
        }
    });
}


//--------------------------------------------------//
// FUNCTION: Visualize(args none)
// Function called to render visualization. The function
// internally calls other functions that actually 
// do the drawing on screen.
//--------------------------------------------------//

function Visualize() {

    if (Data.length == 0)
        return;

    var width = 1200,
        height = 1000;

    var margin = { top: 5, right: 15, bottom: 40, left: 155 };
    
    // Update width and height
    width = width - margin.left - margin.right,
    height = height - margin.top - margin.bottom;

    var vis = d3.select('#vis').append('svg')
        .attr('class', 'chartArea')
        .attr('width', (width + margin.left + margin.right))
        .attr('height', height + margin.top + margin.bottom)
        .attr('style', 'background-color:#fdfdfd; float: left;')
        .append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define scale for x and y axes
    var y = d3.scale.linear().domain([0, Apps.length]).range([height, 0]),
	    x = d3.time.scale().domain([new Date(+TimeRange[0]), new Date(+TimeRange[1])]).range([10, width]);


    // Create and append axes
    var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
        .ticks(0);

    vis.append("g")
	    .attr("class", "axis")
        .style({ 'stroke': 'Black', 'fill': 'none', 'stroke-width': '1px' })
        .attr("transform", "translate(-153,0)")
        .call(yAxis);

    var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")
		.ticks(16);

    vis.append("g")
		.attr("class", "axis")
        .style({ 'stroke': '#aaa', 'fill': 'none', 'stroke-width': '1px' })
	    .attr("transform", "translate(0," + (height) + ")")
        .call(xAxis)
        .selectAll("text")
            .attr("y", 10)
            .attr("x", 9)
            .attr("dy", ".35em")
            .attr("stroke", "none")
            .attr("fill", "#bbb")
            .attr("font-size", "9px")
            .attr("transform", "rotate(35)")
            .style("text-anchor", "start");

    vis.selectAll('.yAxisMajorLine').remove();
    vis.selectAll('.chartArea')
        .data(Apps)
        .enter()
        .append('svg:line')
            .attr('class','.yAxisMajorLine')
            .attr('x1', 0)
            .attr('y1', function (d, i) {
                return height - i * ((height-10) / Apps.length);
            })
            .attr('x2', width)
            .attr('y2', function (d, i) {
                return height - i * ((height - 10) / Apps.length);
            })
            .attr('fill', 'none')
            .attr('stroke', '#f6f6f6');

    
    vis.selectAll('.xAxisMajorBands').remove();

    // Get a reference date that starts at previous hour (0 min, 0 sec, 0 millisec)
    var refDate = new Date(+TimeRange[0]);
    refDate.setHours(refDate.getHours() - 1);
    refDate.setMinutes(0);
    refDate.setSeconds(0);
    refDate.setMilliseconds(0);

    for (var nh = 0; nh <= numHours; nh++) {
        vis.selectAll('.chartArea')
            .data([0])
            .enter()
            .append('svg:rect')
                .attr('x', function (d, i) {
                    return x(new Date((+new Date(refDate)) + nh * 1000 * 3600));
                })
                .attr('y', 0)
                .attr('width', function (d, i) {
                    return x(new Date((+new Date(refDate)) + (nh + 1) * 1000 * 3600)) - x(new Date((+new Date(refDate)) + nh * 1000 * 3600));
                })
                .attr('height', height)
                .attr('fill', function () {
                    if ((new Date((+new Date(refDate)) + nh * 1000 * 3600)).getHours() == 0 ||
                        (new Date((+new Date(refDate)) + nh * 1000 * 3600)).getHours() == 12)
                        return '#aaa';
                    else {
                        if (nh % 2 == 0)
                            return '#ddd';
                        else
                            return '#fff';
                    }
                })
                .attr('opacity', .1);
    }

    vis.selectAll('.chartArea')
        .data(Apps)
        .enter()
        .append('svg:text')
            .attr('class', 'xAxisText')
            .attr('x', function (d, i) {
                return -150;
            })
            .attr('y', function (d, i) {
                return height - i*(height-10)/Apps.length;
            })
            .attr('font-size', '11')
            .attr('font-family', 'Sans-Serif')
            .attr('fill', '#000')
            .text(function (d, i) {
                return d;
            });

    vis.selectAll('.chartArea')
        .data([0])
        .enter()
        .append('svg:text')
        .attr('id','tip');

    vis.selectAll('.chartArea')
        .data(Data)
        .enter()
        .append('svg:circle')
            .attr('class', 'dataPoint')
            .attr('id', function (d, i) {
                return 'data_point_' + i;
            })
            .attr('fill', function (d, i) {
                if (d["Status"] == "Activated")
                    return '#2288ff';
                else if (d["Status"] == "Deactivated")
                    return '#ff8822';
                else
                    return 'none';
            })
            .attr('stroke', function(d,i) {
                if (d["Status"] == "Activated" || d["Status"] == "Deactivated")
                    return 'none';
                else if (d["Status"] == "Launched")
                    return '#080';
                else if (d["Status"] == "Terminated")
                    return '#f00';
            })
            .attr('opacity', .5)
            .attr('cx', function (d, i) {
                return x(d.ts);
            })
            .attr('cy', function (d, i) {
                if (d["Status"] == "Activated")
                    return height - d.idx * (height - 10) / Apps.length + 4;
                else if (d["Status"] == "Deactivated")
                    return height - d.idx * (height - 10) / Apps.length - 4;
                else
                    return height - d.idx * (height - 10) / Apps.length;
            })
            .attr('r', 2);
//            .on('mouseover', function (d, i) {
//                d3.select(this)
//                    .enter()
//                    .append("text")
//                    .text(function (d) { return d.x; })
//                    .attr("x", function (d) { return x(d.x); })
//                    .attr("y", function (d) { return y(d.y); });
//            });

}
