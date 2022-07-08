var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");
var projection = d3.geoMercator()
    .scale(2000) // adjust size map
    .center([119.6, 0])
    .translate([width, height]);
var path = d3.geoPath().projection(projection);

var data = d3.map();
const colorRange = ["#F44236", '#EA1E63', '#9C28B1', '#673AB7', '#009788', '#00BCD5', '#03A9F5', '#2196F3', '#3F51B5', '#4CB050', '#8BC24A', '#CDDC39', '#FFEB3C', '#FEC107', '#FE5721']
    // const stateCode = ['slg', 'kl', 'jhr', 'sbh', 'srw', 'ngs', 'png', 'kel', 'prk', 'kdh', 'mlk', 'phg', 'tg', 'pj', 'pls']
const stateCode = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
var colorScale = d3.scaleThreshold()
    .domain(stateCode)
    .range(colorRange);

d3.queue()
    .defer(d3.json, "map.geojson")
    .defer(d3.csv, "data/stateName.csv", function(d) { data.set(d.code, +d.id); })
    .await(ready);

function ready(error, topo) {
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
    }

    let mouseLeave = function(d) {
        d3.selectAll(".Country")
            .transition()
            .duration(10)
            .style("opacity", .8)
        d3.select(this)
            .transition()
            .duration(10)
            .style("stroke", "transparent")

        tooltip
            .transition()
            .duration(10)
            .style("opacity", 0)
    }

    let mouseMove = function(d) {
        tooltip
            .html(d.properties.name)
            .style("left", (d3.mouse(this)[0] + 150) + "px")
            .style("top", (d3.mouse(this)[1]) + "px")
    }

    let mouseClick = function(d) {
        console.log(d.properties.id)
        tooltip
            .style("opacity", 0.7)
    }
    svg.append("g")
        .selectAll("path")
        .data(topo.features)
        .enter()
        .append("path")
        .attr("d", d3.geoPath().projection(projection))
        // set the color of each country
        .attr("fill", function(d) {
            d.total = data.get(d.properties.id);
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