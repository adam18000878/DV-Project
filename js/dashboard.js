let geojsonData = []
var cholData = d3.map();
var lineAllData = []
var parseDate = d3.timeParse("%Y-%m");
var formatDate = d3.timeFormat("%Y-%m");
var dates = []
var datas = []
const colorRange = ["#F44236", '#EA1E63', '#9C28B1', '#673AB7', '#009788', '#00BCD5', '#03A9F5', '#2196F3', '#3F51B5', '#4CB050', '#8BC24A', '#CDDC39', '#FFEB3C', '#FEC107', '#FE5721']
    // const stateCode = ['slg', 'kl', 'jhr', 'sbh', 'srw', 'ngs', 'png', 'kel', 'prk', 'kdh', 'mlk', 'phg', 'tg', 'pj', 'pls']
const stateCode = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
var colorScale = d3.scaleThreshold()
    .domain(stateCode)
    .range(colorRange);

Promise.all([
    d3.json("data/map.geojson"),
    d3.csv("data/stateName.csv", function(d) { cholData.set(d.code, +d.id) }),
    d3.csv("data/death_to_vacc_dataset.csv").then(function(d) {
        datas = d
        tempAllDataDeath = 0
        tempAllDataVaccine = 0
        for (i in d) {

            if (i==0){
                tempDate = d[i].Date
            }
            if (tempDate != d[i].Date){
                lineAllData.push({
                    Date:parseDate(tempDate),
                    Death:tempAllDataDeath,
                    Vaccine:tempAllDataVaccine
                })
                tempDate = d[i].Date
                dates.push(d[i].Date)
                tempAllDataDeath = 0
                tempAllDataVaccine = 0
            }
            tempAllDataDeath = tempAllDataDeath + Number(d[i]['Total Death'])
            tempAllDataVaccine = tempAllDataVaccine + Number(d[i]['Total Vaccination'])
        }
            
            d[i].Date = formatDate(parseDate(d[i].Date));
    })
]).then(function(loadData) {
    createChoropleth(loadData[0])
    createLineDeath()
    createLineVaccine()
    createScatter()
})

function createChoropleth(topo) {

    var svg = d3.select("#choroplethChart"),
        width = (+svg.attr("width").replace("%","") /100)* screen.width,
        height = +svg.attr("height");
    var projection = d3.geoMercator()
        .scale(2100) // adjust size map
        .center([121.5, -2])
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

    let mouseClick = function(d) {
        let lineData = []

        for (i in datas) {
            if (datas[i].State == d.properties.name){
                lineData.push({
                    Date:parseDate(datas[i].Date),
                    Death:datas[i]['Total Death'],
                    Vaccine:datas[i]['Total Vaccination']
                })
            }
            console.log(datas[i].State)
        }
        console.log(datas[i].State)
        console.log(d.properties.name)

        updateLineDeath(lineData,d.properties.name,colorScale(d.total))
        updateLineVaccine(lineData,d.properties.name,colorScale(d.total))
    }


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

function createLineDeath() {
    var svg = d3.select("#lineChartDeath"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    var maxY = d3.max(lineAllData, function(d) { return d3.max([+d.Death]) });
    var minY = d3.min(lineAllData, function(d) { return d3.min([+d.Death]) });

    domain = d3.extent(lineAllData, function(d) { return d.Date })

    let y = d3.scaleLinear()
        .domain([0, maxY + 1000])
        .range([(height * 0.8), 25]);

    let x = d3.scaleTime()
        .domain(domain)
        .range([0, (width * 0.8)]);

    let yAxis = d3.axisLeft(y).ticks(7);
    let xAxis = d3.axisBottom(x).ticks(5).tickFormat(formatDate);

    svg.append('svg')
        .attr('height', height - 30)
        .attr('width', width - 100);

    var chartGroup = svg.append('g')
        .attr('transform', 'translate(50,50)');

    var lineDeath = d3.line()
        .x(function(d) { return x(d.Date); })
        .y(function(d) { return y(+d.Death); })

    chartGroup.append('path').attr('d', lineDeath(lineAllData)).attr('id', 'lineDeath')
    chartGroup.append('g').attr('class', 'x axis').attr('transform', 'translate(0,320)').call(xAxis)
    chartGroup.append('g').attr('class', 'y axis').attr('transform', 'translate(0,0)').call(yAxis)

    chartGroup.select('#lineDeath').attr('fill', 'none').attr('stroke', 'red')

    chartGroup.append('g')
        .attr('id', 'dotsDeath')
        .selectAll("dot")
        .data(lineAllData)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(d.Date); })
        .attr("cy", function(d) { return y(+d.Death); })
        .attr("r", 2)
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

    function mouseOverDeath(d) {
        tooltip
            .transition()
            .duration(10)
            .style("opacity", 1);
        tooltip
            .html("Date: " + d.Date + "<br>Total Death: " + d.Death)
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

function updateLineDeath(lineData, country, color){
    var svg = d3.select("#lineChartDeath"),
        width = +svg.attr("width"),
        height = +svg.attr("height");
        
    var maxY = d3.max(lineData, function(d) { return d3.max([+d.Death]) });
    var minY = d3.min(lineData, function(d) { return d3.min([+d.Death]) });

    domain = d3.extent(lineData, function(d) { return d.Date })

    let y = d3.scaleLinear()
        .domain([minY, maxY + 10])
        .range([(height * 0.8), 25]);

    let x = d3.scaleTime()
        .domain(domain)
        .range([0, (width * 0.8)]);

    let yAxis = d3.axisLeft(y).ticks(7);
    let xAxis = d3.axisBottom(x).ticks(5).tickFormat(formatDate);

    var lineVacc = d3.line()
        .x(function(d) { return x(d.Date); })
        .y(function(d) { return y(+d.Vaccine); })
    var lineDeath = d3.line()
        .x(function(d) { return x(d.Date); })
        .y(function(d) { return y(+d.Death); })

    var chartGroup = svg.select('g')

    chartGroup.select('#lineDeath').transition().duration(750).attr('d', lineDeath(lineData)).attr('fill', 'none')
    chartGroup.select('g.x.axis').call(xAxis)
    chartGroup.select('g.y.axis').call(yAxis)
    
    chartGroup.select('#dotsDeath')
        .selectAll("circle")
        .data(lineData)
        .transition()
        .duration(750)
        .attr('fill', 'none')
        .attr("cy", function(d) { return y(+d.Death); })

}

function createLineVaccine() {
    var svg = d3.select("#lineChartVaccine"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    var maxY = d3.max(lineAllData, function(d) { return d3.max([+d.Vaccine]) });
    var minY = d3.min(lineAllData, function(d) { return d3.min([+d.Vaccine]) });

    domain = d3.extent(lineAllData, function(d) { return d.Date })

    let y = d3.scaleLinear()
        .domain([minY - 1000, maxY + 100000])
        .range([(height * 0.8), 25]);

    let x = d3.scaleTime()
        .domain(domain)
        .range([0, (width * 0.8)]);

    let yAxis = d3.axisLeft(y).ticks(7);
    let xAxis = d3.axisBottom(x).ticks(5).tickFormat(formatDate);

    svg.append('svg')
        .attr('height', height - 30)
        .attr('width', width - 100);

    var chartGroup = svg.append('g')
        .attr('transform', 'translate(50,50)');

    var lineVacc = d3.line()
        .x(function(d) { return x(d.Date); })
        .y(function(d) { return y(+d.Vaccine); })

    chartGroup.append('path').attr('d', lineVacc(lineAllData)).attr('id', 'lineVacc')
    chartGroup.append('g').attr('class', 'x axis').attr('transform', 'translate(0,320)').call(xAxis)
    chartGroup.append('g').attr('class', 'y axis').attr('transform', 'translate(0,0)').call(yAxis)

    chartGroup.select('#lineVacc').attr('fill', 'none').attr('stroke', 'green')

    chartGroup.append('g')
        .attr('id', 'dotsVacc')
        .selectAll("dot")
        .data(lineAllData)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(d.Date); })
        .attr("cy", function(d) { return y(+d.Vaccine); })
        .attr("r", 2)
        .style("fill", "blue")
        .on("mouseover", mouseOverVacc)
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
            .html("Date: " + d.Date + "<br>Total Vaccine: " + d.Vaccine)
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

function updateLineVaccine(lineData, country, color){
    var svg = d3.select("#lineChartVaccine"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    var maxY = d3.max(lineData, function(d) { return d3.max([+d.Vaccine]) });
    var minY = d3.min(lineData, function(d) { return d3.min([+d.Vaccine]) });

    domain = d3.extent(lineData, function(d) { return d.Date })

    let y = d3.scaleLinear()
        .domain([minY, maxY + 100000])
        .range([(height * 0.8), 25]);

    let x = d3.scaleTime()
        .domain(domain)
        .range([0, (width * 0.8)]);

    let yAxis = d3.axisLeft(y).ticks(7);
    let xAxis = d3.axisBottom(x).ticks(5).tickFormat(formatDate);

    var lineVacc = d3.line()
        .x(function(d) { return x(d.Date); })
        .y(function(d) { return y(+d.Vaccine); })

    var chartGroup = svg.select('g')

    chartGroup.select('#lineVacc').transition().duration(750).attr('d', lineVacc(lineData)).attr('fill', 'none')
    chartGroup.select('g.x.axis').call(xAxis)
    chartGroup.select('g.y.axis').call(yAxis)
    
    chartGroup.select('#dotsVacc')
        .selectAll("circle")
        .data(lineData)
        .transition()
        .duration(750)
        .attr('fill', 'none')
        .attr("cy", function(d) { return y(+d.Vaccine); })

}

function createScatter(){
    var svg = d3.select("#scatterChart"),
        width = +svg.attr("width"),
        height = +svg.attr("height");
    
    var yDomain = d3.extent(lineAllData, function(d) { return d3.max([+d.Vaccine])});
    var xDomain = d3.extent(lineAllData, function(d) { return d3.max([+d.Death])});

    let y = d3.scaleLinear()
        .domain(yDomain)
        .range([(height * 0.8), 25]);

    let x = d3.scaleLinear()
        .domain(xDomain)
        .range([0, (width * 0.8)]);
    
    let yAxis = d3.axisLeft(y).ticks(7);
    let xAxis = d3.axisBottom(x).ticks(5);

    svg.append('svg')
        .attr('height', height - 30)
        .attr('width', width - 100);

    var chartGroup = svg.append('g')
        .attr('transform', 'translate(50,50)');

    chartGroup.append('g').attr('class', 'x axis').attr('transform', 'translate(0,320)').call(xAxis);
    chartGroup.append('g').attr('class', 'y axis').attr('transform', 'translate(0,0)').call(yAxis);

    chartGroup.append('g')
        .attr('id', 'dotsRel')
        .selectAll("dot")
        .data(lineAllData)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(+d.Death); })
        .attr("cy", function(d) { return y(+d.Vaccine); })
        .attr("r", 4)
        .style("fill", "black")
        .on("mouseover", mouseOver)
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

    function mouseOver(d) {
        console.log(d)
        tooltip
            .transition()
            .duration(10)
            .style("opacity", 1);
        tooltip
            .html("Vaccinated: " + d.Vaccine.toLocaleString() + "<br>Death: " + d.Death.toLocaleString())
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