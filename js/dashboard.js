let geojsonData = []
var cholData = d3.map();
var lineData = [];
var parseDate = d3.timeParse("%Y-%m-%d");
var formateDate = d3.timeFormat("%d");
const colorRange = ["#F44236", '#EA1E63', '#9C28B1', '#673AB7', '#009788', '#00BCD5', '#03A9F5', '#2196F3', '#3F51B5', '#4CB050', '#8BC24A', '#CDDC39', '#FFEB3C', '#FEC107', '#FE5721']
    // const stateCode = ['slg', 'kl', 'jhr', 'sbh', 'srw', 'ngs', 'png', 'kel', 'prk', 'kdh', 'mlk', 'phg', 'tg', 'pj', 'pls']
const stateCode = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
var colorScale = d3.scaleThreshold()
    .domain(stateCode)
    .range(colorRange);

Promise.all([
    d3.json("data/map.geojson"),
    d3.csv("data/stateName.csv", function(d) { cholData.set(d.code, +d.id) }),
    d3.csv("data/dummyLineChart.csv").then(function(d) {
        for (i in d) {
            if (i != "columns") {
                d[i].date = formateDate(parseDate(d[i].date));
                lineData.push(d[i])
                console.log(d[i].date)
            }
        }
    })
]).then(function(loadData) {
    createChoropleth(loadData[0])
    createLine()
})

function createChoropleth(topo) {

    var svg = d3.select("#choroplethChart"),
        width = +svg.attr("width"),
        height = +svg.attr("height");
    var projection = d3.geoMercator()
        .scale(2000) // adjust size map
        .center([119.6, 0])
        .translate([width, height]);
    var path = d3.geoPath().projection(projection);


    var tooltip = d3.select("div")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "2px")
        .style("padding", "1px")
        .style("position", "absolute")

    let mouseOver = function(d) {
        d3.selectAll(".Country")
            .transition()
            .duration(10)
            .style("opacity", .5)
        d3.select(this)
            .transition()
            .duration(10)
            .style("opacity", 1)
            .style("stroke", "black")

        tooltip
            .transition()
            .duration(10)
            .style("opacity", 1);
    }

    let mouseLeave = function(d) {
        d3.selectAll(".Country")
            .transition()
            .duration(0)
            .style("opacity", .8)
        d3.select(this)
            .transition()
            .duration(0)
            .style("stroke", "transparent")

        tooltip
            .transition()
            .duration(10)
            .style("opacity", 0)
            .style('pointer-events', 'none');
    }

    let mouseMove = function(d) {
        tooltip
            .html(d.properties.name)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 30) + "px")
    }

    let mouseClick = function(d) {}


    svg.append("g")
        .selectAll("path")
        .data(topo.features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath().projection(projection))
        // set the color of each country
        .attr("fill", function(d) {
            d.total = cholData.get(d.properties.id);
            return colorScale(d.total);
        })
        .style("stroke", "transparent")
        .attr("class", function(d) {
            return "Country"
        })
        .style("opacity", .8)
        .on("mouseenter", mouseOver)
        .on("mouseleave", mouseLeave)
        .on("mousemove", mouseMove)
        .on("click", mouseClick);
}

function createLine() {
    var svg = d3.select("#lineChart"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    var maxYear = d3.max(lineData, function(d) { return d.date });
    var minYear = d3.min(lineData, function(d) { return d.date });
    var maxY = d3.max(lineData, function(d) { return d3.max([+d.vaccine, +d.death]) });
    var minY = d3.min(lineData, function(d) { return d3.min([+d.vaccine, +d.death]) });
    console.log(width)
    console.log(height)

    let y = d3.scaleLinear()
        .domain([minY - 50, maxY + 50])
        .range([height - 80, 0]);

    let x = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([0, width - 80]);

    let yAxis = d3.axisLeft(y).ticks(7);
    let xAxis = d3.axisBottom().scale(x);

    svg.append('svg')
        .attr('height', height - 30)
        .attr('width', width - 100);

    var chartGroup = svg.append('g')
        .attr('transform', 'translate(50,50)');

    var lineVacc = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(+d.vaccine); })
    var lineDeath = d3.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(+d.death); })

    chartGroup.append('path').attr('d', lineVacc(lineData)).attr('id', 'lineVacc')
    chartGroup.append('path').attr('d', lineDeath(lineData)).attr('id', 'lineDeath')
    chartGroup.append('g').attr('class', 'x axis').attr('transform', 'translate(0,320)').call(xAxis)
    chartGroup.append('g').attr('class', 'y axis').call(yAxis)

    chartGroup.select('#lineVacc').attr('fill', 'none').attr('stroke', 'green')
    chartGroup.select('#lineDeath').attr('fill', 'none').attr('stroke', 'red')

    chartGroup.append('g')
        .attr('id', 'dotsVacc')
        .selectAll("dot")
        .data(lineData)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(+d.vaccine); })
        .attr("r", 4)
        .style("fill", "blue")
        .on("mouseover", mouseOverVacc)
        .on("mouseleave", mouseLeave);

    chartGroup.append('g')
        .attr('id', 'dotsDeath')
        .selectAll("dot")
        .data(lineData)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(d.date); })
        .attr("cy", function(d) { return y(+d.death); })
        .attr("r", 4)
        .style("fill", "black")
        .on("mouseover", mouseOverDeath)
        .on("mouseleave", mouseLeave);

    var tooltip = d3.select("#dtip")
        .append("div")
        .attr('id', 'tipLine')
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "5px")
        .style("position", "absolute")

    function mouseOverVacc(d) {
        tooltip
            .transition()
            .duration(10)
            .style("opacity", 1);
        tooltip
            .html("Date: " + d.date + "<br>Total Vaccine: " + d.vaccine)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 90) + "px")
    }

    function mouseOverDeath(d) {
        tooltip
            .transition()
            .duration(10)
            .style("opacity", 1);
        tooltip
            .html("Date: " + d.date + "<br>Total Death: " + d.death)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 90) + "px")
    }

    function mouseLeave(d) {
        tooltip
            .transition()
            .duration(100)
            .style("opacity", 0)
            .style('pointer-events', 'none');
    }
}