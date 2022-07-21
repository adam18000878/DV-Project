let geojsonData = []
var cholData = d3.map();
var lineAllData = []
var parseDate = d3.timeParse("%Y-%m");
var formatDate = d3.timeFormat("%b %Y");
var dates = []
var datas = []
const colorRange = ["#F44236", '#EA1E63', '#9C28B1', '#673AB7', '#009788', '#00BCD5', '#03A9F5', '#2196F3', '#3F51B5', '#4CB050', '#8BC24A', '#CDDC39', '#FFEB3C', '#FEC107', '#FE5721','red']
const stateCode = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
const vacCode = ['Pfizer','Sinovac','AstraZeneca','Sinopharm','CanSino']
var colorScale = d3.scaleOrdinal()
    .domain(stateCode)
    .range(colorRange);

var vacColor = d3.scaleOrdinal()
        .domain(vacCode)
        .range(['#F25F0F','#019EC8','#580501','#013279','#0CDD97']);

function create(){
    Promise.all([
        d3.json("data/map.geojson"),
        d3.csv("data/stateName.csv", function(d) { cholData.set(d.code, +d.id) }),
        d3.csv("data/death_to_vacc_dataset.csv").then(function(d) {
            datas = d
            tempAllDataDeath = 0
            tempAllDataVaccine = 0
            tempAllPfizer = 0
            tempAllSinovac = 0
            tempAllAstraZeneca = 0
            tempAllSinopharm = 0
            tempAllCanSino = 0
            for (i in d) {
    
                if (i==0){
                    tempDate = d[i].Date
                }
                if (tempDate != d[i].Date){
                    lineAllData.push({
                        Date:parseDate(tempDate),
                        Death:tempAllDataDeath,
                        Vaccine:tempAllDataVaccine,
                        VaccineType: {
                            Pfizer:tempAllPfizer,
                            Sinovac:tempAllSinovac,
                            AstraZeneca:tempAllAstraZeneca,
                            Sinopharm:tempAllSinopharm,
                            CanSino:tempAllCanSino
                        }
                    })
                    tempDate = d[i].Date
                    dates.push(d[i].Date)
                    tempAllDataDeath = 0
                    tempAllDataVaccine = 0
                    tempAllPfizer = 0
                    tempAllSinovac = 0
                    tempAllAstraZeneca = 0
                    tempAllSinopharm = 0
                    tempAllCanSino = 0
                }
                tempAllDataDeath = tempAllDataDeath + Number(d[i]['Total Death'])
                tempAllDataVaccine = tempAllDataVaccine + Number(d[i]['Total Vaccination'])
                tempAllPfizer = tempAllPfizer + Number(d[i]['Pfizer'])
                tempAllSinovac = tempAllSinovac + Number(d[i]['Sinovac'])
                tempAllAstraZeneca = tempAllAstraZeneca + Number(d[i]['AstraZeneca'])
                tempAllSinopharm = tempAllSinopharm + Number(d[i]['Sinopharm'])
                tempAllCanSino = tempAllCanSino + Number(d[i]['CanSino'])
            }
                
                d[i].Date = formatDate(parseDate(d[i].Date));
        })
    ]).then(function(loadData) {
        createChoropleth(loadData[0])
        createLineDeath()
        createLineVaccine()
        createScatter()
        pieData = []
        tempPieData = []
        totalSum = 0
        pieGroup = Object.keys(lineAllData[0].VaccineType)
        temp = []
    
        for (i in pieGroup){
            sum = 0
            for( j in lineAllData){
                sum = sum + Number(lineAllData[j].VaccineType[pieGroup[i]]);
                totalSum = totalSum + Number(lineAllData[j].VaccineType[pieGroup[i]]);
            }
            pieData.push({
                name:pieGroup[i],
                value:sum
            })
            temp.push({
                name:pieGroup[i],
                value:sum
            })
        }
        
        // for (i in pieData){
        //     pieData[i].value = (pieData[i].value/totalSum).toFixed(2)
        // }
        // createPie(pieData,totalSum)
        createBar(temp,totalSum)
    })
}

function createChoropleth(topo) {

    var svg = d3.select("#choroplethChart"),
        width = (+svg.attr("width").replace("%","") /100)* screen.width,
        height = +svg.attr("height");
    var projection = d3.geoMercator()
        .scale(2800) // adjust size map
        .center([107, 4])
        .translate([width/2, height/2]);


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
            if (datas[i].id == d.properties.cartodb_id){
                lineData.push({
                    Date:parseDate(datas[i].Date),
                    Death:datas[i]['Total Death'],
                    Vaccine:datas[i]['Total Vaccination']
                })
            }
        }

        updateLineDeath(lineData,d.properties.name,colorScale(d.total))
        updateLineVaccine(lineData,d.properties.name,colorScale(d.total))
        updateScatter(lineData,d.properties.name,colorScale(d.total))

        pieData = []
        barData = []
        totalSum = 0
        for (i in pieGroup){
            sum = 0
            for (j in datas){
                if (datas[j].id == d.properties.cartodb_id){
                    if (j != 'columns'){                    
                        sum = sum + Number(datas[j][pieGroup[i]]);
                        totalSum = totalSum + Number(datas[j][pieGroup[i]]);
                    }
                }
            }
            pieData.push({
                name:pieGroup[i],
                value:sum
            })
            barData.push({
                name:pieGroup[i],
                value:sum
            })
        }

        for (i in pieData){
            pieData[i].value = (pieData[i].value/totalSum).toFixed(2)
        }
        // createPie(pieData,totalSum)
        // updatePie(pieData,totalSum)
        updateBar(barData,totalSum,d.properties.name)
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
        width = (+svg.attr("width").replace("%","") /100)* screen.width,
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

    chartGroup.append('path').attr('d', lineDeath(lineAllData)).attr('id', 'lineDeath').attr('transform', 'translate(20,0)')
    chartGroup.append('g').attr('class', 'x axis').attr('transform', 'translate(20,'+height*0.8+')').call(xAxis)
    chartGroup.append('g').attr('class', 'y axis').attr('transform', 'translate(20,0)').call(yAxis)

    chartGroup.select('#lineDeath').attr('fill', 'none').attr('stroke', 'black')

    chartGroup.append('g')
        .attr('id', 'dotsDeath')
        .selectAll("dot")
        .data(lineAllData)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(d.Date); })
        .attr("cy", function(d) { return y(+d.Death); })
        .attr("r", 5)
        .attr('transform', 'translate(20,0)')
        .style("fill", "black")
        .on("mouseover", mouseOverDeath)
        .on("mouseleave", mouseLeave);
    
    var legend = svg.append("g")
        .attr("id", "legend");
    
    legend.append("text")
        .attr('x',width/2)
        .attr('y',height*0.075)
        .attr('text-align', 'center')
        .text("Overall's Death Line Chart")
        .attr('font-weight', 'bold')
        .attr('font-size', "24" + "px")
        .attr('text-anchor', 'middle');

    var tooltip = d3.select("#MainViz")
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
            .html("Date: " + formatDate(d.Date) + "<br>Total Death: " + d.Death.toLocaleString())
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
        width = (+svg.attr("width").replace("%","") /100)* screen.width,
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
        .style('fill', color)
        .attr("cy", function(d) { return y(+d.Death); })
        .attr("cx", function(d) { return x(+d.Date); })
        .attr('transform', 'translate(20,0)');
    
        var legend = svg.select("g#legend")

        legend.select("text")
            .text(country +"'s Death Line Chart")

}

function createLineVaccine() {
    var svg = d3.select("#lineChartVaccine"),
        width = (+svg.attr("width").replace("%","") /100)* screen.width,
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

    chartGroup.append('path').attr('d', lineVacc(lineAllData)).attr('id', 'lineVacc').attr('transform', 'translate(20,0)')
    chartGroup.append('g').attr('class', 'x axis').attr('transform', 'translate(20,'+height*0.8+')').call(xAxis)
    chartGroup.append('g').attr('class', 'y axis').attr('transform', 'translate(20,0)').call(yAxis)

    chartGroup.select('#lineVacc').attr('fill', 'none').attr('stroke', 'black')

    chartGroup.append('g')
        .attr('id', 'dotsVacc')
        .selectAll("dot")
        .data(lineAllData)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(d.Date); })
        .attr("cy", function(d) { return y(+d.Vaccine); })
        .attr("r", 5)
        .attr('transform', 'translate(20,0)')
        .style("fill", "blue")
        .on("mouseover", mouseOverVacc)
        .on("mouseleave", mouseLeave);
    
    var legend = svg.append("g")
        .attr("id", "legend");
    
    legend.append("text")
        .attr('x',width/2)
        .attr('y',height*0.075)
        .attr('text-align', 'center')
        .text("Overall's Vaccine Line Chart")
        .attr('font-weight', 'bold')
        .attr('font-size', "24" + "px")
        .attr('text-anchor', 'middle');

    var tooltip = d3.select("#MainViz")
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
            .html("Date: " + formatDate(d.Date) + "<br>Total Vaccine: " + d.Vaccine.toLocaleString())
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
        width = (+svg.attr("width").replace("%","") /100)* screen.width,
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
        .style('fill', color)
        .attr("cy", function(d) { return y(+d.Vaccine); })
        .attr("cx", function(d) { return x(+d.Date); })

    var legend = svg.select("g#legend")

    legend.select("text")
        .text(country +"'s Vaccine Line Chart")
}

function createScatter(){
    var svg = d3.select("#scatterChart"),
        width = (+svg.attr("width").replace("%","") /100)* screen.width,
        height = +svg.attr("height");
    
    var yDomain = d3.extent(lineAllData, function(d) { return +d.Vaccine});
    var xDomain = d3.extent(lineAllData, function(d) { return +d.Death});

    let y = d3.scaleLinear()
        .domain(yDomain)
        .range([(height * 0.8), 25]);

    let x = d3.scaleLinear()
        .domain(xDomain)
        .range([0, (width *0.8)]);
    
    let yAxis = d3.axisLeft(y).ticks(7);
    let xAxis = d3.axisBottom(x).ticks(5);

    svg.append('svg')
        .attr('height', height - 30)
        .attr('width', width - 100);

    var chartGroup = svg.append('g')
        .attr('transform', 'translate(50,50)');

    chartGroup.append('g').attr('class', 'x axis').attr('transform', 'translate(20,'+height*0.8+')').call(xAxis);
    chartGroup.append('g').attr('class', 'y axis').attr('transform', 'translate(20,0)').call(yAxis);

    chartGroup.append('g')
        .attr('id', 'dotsRel')
        .selectAll("dot")
        .data(lineAllData)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(+d.Death); })
        .attr("cy", function(d) { return y(+d.Vaccine); })
        .attr("r", 4)
        .attr('transform', 'translate(20,0)')
        .style("fill", "black")
        .on("mouseover", mouseOver)
        .on("mouseleave", mouseLeave);

    var legend = svg.append("g")
        .attr("id", "legend");
    
    legend.append("text")
        .attr('x',width/2)
        .attr('y',height*0.075)
        .attr('text-align', 'center')
        .text('Vaccine x Death Overall Scatter Plot')
        .attr('font-weight', 'bold')
        .attr('font-size', "24" + "px")
        .attr('text-anchor', 'middle');

    var tooltip = d3.select("#MainViz")
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
function updateScatter(scattterData, country, color){
    var svg = d3.select("#scatterChart"),
        width = (+svg.attr("width").replace("%","") /100)* screen.width,
        height = +svg.attr("height");
    
    var yDomain = d3.extent(scattterData, function(d) { return +d.Vaccine});
    var xDomain = d3.extent(scattterData, function(d) { return +d.Death});

    let y = d3.scaleLinear()
        .domain(yDomain)
        .range([(height * 0.8), 25]);

    let x = d3.scaleLinear()
        .domain(xDomain)
        .range([0, (width * 0.8)]);
    
    let yAxis = d3.axisLeft(y).ticks(7);
    let xAxis = d3.axisBottom(x).ticks(5);

    var chartGroup = svg.select('g')

    chartGroup.select('g.x.axis').call(xAxis);
    chartGroup.select('g.y.axis').call(yAxis);

    chartGroup.select('#dotsRel')
        .selectAll("circle")
        .data(scattterData)
        .transition()
        .duration(750)
        .style("fill", color)
        .attr("cx", function(d) { return x(+d.Death); })
        .attr("cy", function(d) { return y(+d.Vaccine); });

    var legend = svg.select("g#legend")
    
    legend.select("text")
        .text('Vaccine x Death '+country+' Scatter Plot')
}

function createPie(data,total){
    const div = d3.select('#p2'),
    width_s = (+div.attr('width').replace("%","")/100) * screen.width;
    const svg = d3.select('#pieChart'),
    width = (+svg.attr('width').replace("%","") /100) * width_s,
    height = +svg.attr('height'),
    outerRadius = (Math.min(width, height) / 2)-50,
    innerRadiusFinal3 = outerRadius * .3;

    const radius = 200;
    const g = svg.append('g').attr('transform', `translate(${width/2}, ${height/2})`);

    const pie = d3.pie().sort(null).value(d => d.value)

    const path = d3.arc()
        .outerRadius(outerRadius)
        .innerRadius(radius - 90);
    var path2 = d3.arc()
        .innerRadius(innerRadiusFinal3)
        .outerRadius(outerRadius);
    const label = d3.arc()
        .outerRadius(outerRadius)
        .innerRadius(radius - 90);
    
    const pies = g.selectAll('.slice')
        .data(pie(data))
        .enter()
        .append('g').attr('class', 'slice')
        .on("mouseover", mouseOver)
        .on("mouseleave", mouseLeave)
        .on("mousemove", mouseMove);
    
    pies.append('path')
        .attr('d', path)
        .attr('fill', d => vacColor(d.data.name));

    svg
        .append('text')
        .attr('id','totalDoses')
        .attr('x', (width / 2))
        .attr('y', (height / 2))
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr('font-size', "20" + "px")
        .text(Number(total).toLocaleString() + ' Doses')
    
    xoffset = 10
    yoffset = 30
    l = 1

    svg.selectAll("mydots")
        .data(vacCode)
        .enter()
        .append("circle")
            .attr("cx", 50)
            .attr("cy", function(d,i){ return 50 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
            .attr("r", 10)
            .style("fill", function(d){ return vacColor(d)})
    
    svg.selectAll("mylabels")
        .data(vacCode)
        .enter()
        .append("text")
            .attr("x", 70)
            .attr("y", function(d,i){ return 50 + i*25}) // 100 is where the first dot appears. 25 is the distance between dots
            .text(function(d){ return d})
            .attr("text-anchor", "left")
            .style("alignment-baseline", "middle")    
    
    var legend = svg.append("g")
        .attr("id", "legend");
    
    legend.append("text")
        .attr('x',width/2)
        .attr('y',height*0.06)
        .attr('text-align', 'center')
        .attr('font-weight', 'bold')
        .attr('font-size', "24" + "px")
        .attr('text-anchor', 'middle')
        .text('Vaccine Distribution Pie Chart');

    var tooltip = d3.select("#MainViz")
        .append("div")
        .attr('id','pieTip')
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("position", "absolute")


    function mouseOver(d) {
        tooltip
            .transition()
            .duration(10)
            .style("opacity", 1);

        d3.select(this).select("path").transition()
            .duration(400)
            .attr("d", path2);
    }

    function mouseMove(d) {
        tooltip
            .html(d.data.name +": "+Number((d.data.value * total).toFixed(0)).toLocaleString() + " Dose.")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 90) + "px")
    }

    function mouseLeave(d) {
        tooltip
            .transition()
            .duration(10)
            .style("opacity", 0)
            .style('pointer-events', 'none');

        d3.select(this).select("path").transition()
            .duration(400)
            .attr("d", path);
    }
}

function updatePie(data,total){
    const div = d3.select('#p2'),
        width_s = (+div.attr('width').replace("%","")/100) * screen.width;
    const svg = d3.select('#pieChart'),
        width = (+svg.attr('width').replace("%","") /100) * width_s,
        height = +svg.attr('height'),
        outerRadius = (Math.min(width, height) / 2)-50,
        innerRadiusFinal3 = outerRadius * .3;
    
        const radius = 200;

    const path = d3.arc()
        .outerRadius(outerRadius)
        .innerRadius(radius - 90);
    var path2 = d3.arc()
        .innerRadius(innerRadiusFinal3)
        .outerRadius(outerRadius);

    const g = svg.select('g')
    
    const pie = d3.pie().sort(null).value(d => d.value)

    const pies = g.selectAll('.slice')
        .data(pie(data))
        .transition()
        .duration(750)
        .select('path')
        .attr('d',path);
    
    g.selectAll('.slice')
        .on("mouseover", mouseOver)
        .on("mouseleave", mouseLeave)
        .on("mousemove", mouseMove);
    
    d3.select('#pieTip').remove()

    var tooltip = d3.select("#MainViz")
        .append("div")
        .attr('id','pieTip')
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("position", "absolute")


    function mouseOver(d) {
        tooltip
            .transition()
            .duration(10)
            .style("opacity", 1);

        d3.select(this).select("path").transition()
            .duration(400)
            .attr("d", path2);
    }

    function mouseMove(d) {
        tooltip
            .html(d.data.name +": "+Number((d.data.value * total).toFixed(0)).toLocaleString() + " Dose.")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 90) + "px")
    }

    function mouseLeave(d) {
        tooltip
            .transition()
            .duration(10)
            .style("opacity", 0)
            .style('pointer-events', 'none');

        d3.select(this).select("path").transition()
            .duration(400)
            .attr("d", path);
    }

    svg.select('#totalDoses').text(Number(total).toLocaleString() + ' Doses')
}

function createBar(data, total){

    const div = d3.select('#p2'),
    width_s = (+div.attr('width').replace("%","")/100) * screen.width;
    const svg = d3.select('#pieChart'),
    width = (+svg.attr('width').replace("%","") /100) * width_s,
    height = +svg.attr('height'),
    outerRadius = (Math.min(width, height) / 2)-50,
    innerRadiusFinal3 = outerRadius * .3;

    
    svg.append('svg')
        .attr('height', height - 30)
        .attr('width', width - 100);

    var chartGroup = svg.append('g')
        .attr('transform', 'translate(50,50)');

    var x = d3.scaleBand()
        .range([0,width*0.8])
        .domain(data.map(function(d) { return d.name; }))
        .padding(0.5)
    
    yDomain = d3.extent(data.map(function(d) { return d.value; }))
    var y = d3.scaleLinear()
        .range([height*0.8, 25])
        .domain([yDomain[0]-10000, yDomain[1]+10000000])
    
    chartGroup.append("g")
        .attr("transform", "translate(20," + (height*0.8) + ")")
        .attr('class', 'x axis')
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-size", "large")
        .on("mouseover", mouseOverText)
        .on("mouseleave", mouseLeave);
    
    chartGroup.append("g")
        .attr("transform", "translate(20,0)")
        .attr('class', 'y axis')
        .call(d3.axisLeft(y));
    
    chartGroup.selectAll("mybar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d.name); })
        .attr("width", x.bandwidth())
        .attr("fill", function(d) {return vacColor(d.name)})
        .attr("y", function(d) { return y(0); })
        .on("mouseover", mouseOverBar)
        .on("mouseleave", mouseLeave)
    
    chartGroup.selectAll("rect")
        .transition()
        .duration(500)
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return (height*0.8) - y(d.value); })
        .delay(function(d,i){return(i*100)})


    var legend = svg.append("g")
        .attr("id", "legend");
    
    legend.append("text")
        .attr('x',width/2)
        .attr('y',height*0.075)
        .attr('text-align', 'center')
        .attr('font-weight', 'bold')    
        .attr('font-size', "24" + "px")
        .attr('text-anchor', 'middle')
        .text('Vaccine Type Distribution');
    
    legend.append('text').attr('id','totalVac')
        .text(Number(total).toLocaleString() + " Doses")
        .style("font-weight","500")
        .style("font-size","24px")
        .attr('x',width/2)
        .attr('y',height*0.15)
        .attr('text-anchor', 'middle')

    var tooltip = d3.select("#MainViz")
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

    function mouseOverBar(d) {
        tooltip
            .transition()
            .duration(100)
            .style("opacity", 1);
        tooltip
            .html(Number(d.value).toLocaleString() + " Doses")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 90) + "px")
    }

    function mouseOverText(d) {
        temp = []
        for (i in data){
            if (data[i].name == d) temp = data[i].value;
        }
        tooltip
            .transition()
            .duration(100)
            .style("opacity", 1);
        tooltip
            .html(Number(temp).toLocaleString() + " Doses")
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

function updateBar(data, total, state){
    const div = d3.select('#p2'),
    width_s = (+div.attr('width').replace("%","")/100) * screen.width;
    const svg = d3.select('#pieChart'),
    width = (+svg.attr('width').replace("%","") /100) * width_s,
    height = +svg.attr('height');


    var chartGroup = svg.select('g')

    var x = d3.scaleBand()
        .domain(data.map(function(d) { return d.name; }))
        .range([0,width*0.8])
    
    yDomain = d3.extent(data.map(function(d) { return d.value; }))
    var y = d3.scaleLinear()
        .domain([yDomain[0]-10000, yDomain[1]+1000000])
        .range([height*0.8, 25])
    
    
    let yAxis = d3.axisLeft(y).ticks(7);
    let xAxis = d3.axisBottom(x).ticks(5);
    
    chartGroup.select('g.x.axis').call(xAxis);
    chartGroup.select('g.y.axis').call(yAxis);
    
    chartGroup.selectAll("rect")
        .data(data)
        .transition()
        .duration(500)
        .attr("y", function(d) { return y(d.value); })
        .attr("height", function(d) { return (height*0.8) - y(d.value); })
        .delay(function(d,i){return(i*100)})

    var legend = svg.select("g#legend")
    
    legend.select("text")
        .text(state + "'s Vaccine Distribution")
    
    
    legend.select('#totalVac')
        .text(Number(total).toLocaleString() + " Doses")
}

function reset(){
    var chor = document.getElementById("choroplethChart");
    var pie = document.getElementById("pieChart");
    var scatter = document.getElementById("scatterChart");
    var death = document.getElementById("lineChartDeath");
    var vaccine = document.getElementById("lineChartVaccine");
    chor.innerHTML = '';
    pie.innerHTML = '';
    scatter.innerHTML = '';
    death.innerHTML = '';
    vaccine.innerHTML = '';

    create()
}

create()