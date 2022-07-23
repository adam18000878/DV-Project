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
        updateText(d.properties.name)
        console.log(d);

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
function updateText(state){
    arrayTitle =['Selangor','W.P Kuala Lumpur','Johor','Sabah','Sarawak','Negeri Sembilan','Penang','Kelantan','Perak','Kedah','Melaka','Pahang','Terengganu','W.P Putrajaya','Perlis'] 
    arrayText =['In first graph, the vaccine X death Selangor Scatter Plot which shows there are cluster of plot in the left side of the plot and this is during the early time of the virus. One of the plot which shows the most of the death which is 3417 and vaccinated at that time was 864225. This is caused by a variant of the virus which make it more deadly causing people to take another shot of vaccine. Next, The Selangor Vaccine Distribution shows a bar chart of type of vaccine distributed and amout of recipients. Most of the recipient get Pfizer and next is Sinovac. For sniopharm and CanSino which is not common vaccine in Malaysia have the lowest amongst other. After that, The Selangor Death line chart which show the amout of people who die because of the virus over a specific duration. It peak on September 2021 which have the total death of 3417. During this time, the variant of the virus is very deadly. However, after that it keep decreasing with a little spike during March 2022. Lastly, Selangor Vaccine Line chart which show amout of vaccine distributed during a specific duration. It peak on July 2021 which amount of 3356650 and it decrease after that since everyone get vaccine. Next spike is in January 2022 with 1676014 which is the booster of the vaccine is introduced and it keep decreasing after that.',
    'In first graph, it shows that most plot is at the beginning of the plot. The pattern shows that it keep increasing and it decrease when people got vaccinated with amount of 1594227. Next graph shows that the vaccine distribution in Kuala Lumpur. We can see that Pfizer have the highest amount of distribution with 3,168,137 doses. Next, Sinovac is the 2nd highest with 3,133,516 doses. For Sinopharm and Cansino still have very low value. Next, The death line chart for Kuala Lumpur. In August 2021, the graph peak at 972 and keep decreasing after that. As we all know it is caused by the variant of virus causing the fatality. Lastly, The Vaccine line chart in Kuala Lumpur. It peak at July 2021 with amount of 2136627 doses distributed and it keep decreasing. It rises back and reach spike during January 2022 with 739715 doses o f vaccine distributed.',
    'In first graph, it shows that most plot is at the beginning of the plot. This is caused by the early of the virus since people were not expoed to the danger of the virus at that time. The highest death which is 1297 and with amount of vaccinated distributed is 1595179. Next, Johor Vaccine Distribution which have total of 8,778,618 doses distrubuted. The highes vaccine distributed is Pfizer with having 3,769,262 doses. Followed by Sinovac with 2,102,012 doses distributed among the citizen in Johor. Sinopharm and Cansino is the most lowest in the chart. Next, Death line chart for Johor. the line chart peak at 1297 which can be connected with the first graph which have the amount of 1595179 people who have vaccinated. It keep decreasing after it peak and it start rises back on March 2022. Next, Vaccine line chart for Johor. It peaked on August 2021 and keep decreasing after that. It start to rise back on January 2022 which is when the booster was introduced.',
    'In first graph, it shows that most plot is at the beginning of the plot. Most vaccinated people is 1512762 with death of 529 which shows the vaccine works. Next, Vaccine distribution in sabah bar chart. It shows that pfizer have the highest distribution with total of 4,468,654 doses followed by Sinovac, AstraZeneca, Cansino and Sinoparhm. Cansino have the amount of 137,762 doses which is the uncommon vaccine used in Malaysia. Next Death line chart for Sabah. It peaked on September 2021 with amount of 1058 deceased. It decrease after that since the vaccine work. Next, Vaccine line chart for Sabah. It peaked on 1512762 on August 2021. It keep decreasing after spike since everyone got their own vaccine. Next, Sarawak Death line chart shows amount of deceased people during the pandemic. It peak on October 2021 with total of 496. During this time, a new variant of virus have been found. The line keep decreasing after the spike since many of the people already taken the vaccine. Next, Vaccine line chart for Sarawak. It peak on July 2021 with 1778669 of vaccine distributed. The line chart keep decreasing after that.,',
    'In first graph, it shows that most plot is at the beginning of the plot. It is during the early time of the virus appear. In Sarawak, it have the highest vaccination is 1778669 and with death total is 53. However, the highest death is 496 which having 390508 vaccine distributed. Next, In sarawak, 6,489,937 Doses was distributed. Major of the vaccine distributed is pfizer which have 3,199,794 doses distrubuted. Followed by Sinovac with 3,190, 147 doses distributed. For Sinopham and Cansino, it does distributed only a little. Next, Death line chart for Sarawak which have the highest total death of 496 in October 2021 and it keep decreasing after that. Next Vaccine line chart for Sarawak. It peaked on July 2021 with amount of 1778669 and it keep decreasing after that with a little spike during November 2021 and April 2021.',
    'In first graph, it shows that most plot is at the beginning of the plot. It is during the early time of the virus appear. In Negeri Sembilan, highest vaccination which is 556179 have the highest death which is 276. Next, Vaccine distribution in Negeri sembilan which have 2,709,317 doses distributed. Most of the recipients receive Pfizer with amount of 2,089,749 doses. Follwed by Sinovac, AstraZeneca, Cansino then Sinopharm. Next, Death line chart for Negeri Sembilan. The death line chart peak on July 2021 with 370 amount of deceased people. It keep decreasing with little spike on March 2022 and it keep decreasing after that. Next, line chart for Negeri Sembilan vaccine distributed. It peak on July 2021 with amount of 598239 and it keep decreasing after that. The chart have spike during January 2022 and it keep decreasing after that since everyone got their vaccine to protect themselves from the virus. This time the vaccine distributed keep increasing until it reach on August 2021 with amount of 934890 doses of vaccine distributed. It keep decreasing until November 2021 and it keep increasing until it reach January 2022 with amount of vaccine distributed is 421567. ',
    'In first graph, it shows that most plot is at the beginning of the plot which is the beginning of the virus appeared. The pattern keep increasing. It have the highest death of 751 with total of vaccinated people is 630457. Next, Vaccine distributed among penang which is 4,326,035 doses. Pfizer have the most distributed with amount of 2,547,194 doses. Next is Sinovac with amount of 1,259,911 doses distributed. Sinopharm and CanSino have the lowest amount of doses distributed. Next death line chart for penang. It peak on September 2021 with amount of 751 death and this time is the when government lifted the travelling restrictions causing the virus spread. The line chart keep decreasing after that. Next, Vaccine line chart for penang. The graph keep increasing until it reach August 2021 with amount of 934890 total vaccine distributed. it keep decreasing and it start to increase at November 2021 until it reach January 2022 with amount of vaccine 421547 distributed.',
    'The first graph shows Vaccine x Death Kelantan scatter plot. Most of the plot is scattered around the left side and bottom side of the chart. This is during the early stage of the virus. It keep increasing everyday. The highest death is 400 with amount of vaccinated people is 623591. Next, Vaccine distribution in Kelantan. Pfizer is the highest type of vaccine distributed with amount of 2,168,057 doses. Followed by Sinovac, Astrazeneca, Sinopharm and Cansino. Next, Kelantan Death line chart, The chart peak at September 2021 with amount of 400 death and it keep decreasing after that. Next, Vaccine line chart for Kelantan. The graph increase until it reach peak with total of 667506 during August 2021 It keep decreasing after that.',
    'The first graph shows Vaccine x Death Perak scatter plot. It shows that most plot is at the beginning of the plot which is the beginning of the virus appeared. The patter in the plot keep increasing. The highest vaccinated is 941401 with amount of death with 373. Next, Vaccine Distribution in Perak with total of 5,161,807 doses. Pfizer is the most distributed vaccine which have 3,752,966 doses distributed. Followed by Sinovac, Astrazeneca, Sinopharm and Cansino. Next, Death Line Chart for Perak. The chart peak at September 2021 with total death of 373 and it keep decreasing after that. However, during March 2022 it have the total death of 320 and keep decreasing after that. Lastly, Vaccine line chart for Perak. The chart peak at August 2021 with total vaccine distributed 958789 and it keep decreasing.',
    'The first graph shows Vaccine x Death Kedah scatter plot. Most of the plot is scattered around the left side and bottom side of the chart. It have the highest death of 951 with 834145 total vaccinated people. Next, Vaccine distribution for Kedah. Pfizer is the most doses distributed followed by Sinovac, AstraZeneca, Sinopharm and CanSino. Next, Death Line Chart for Kedah. This chart keep increasing until it reach its peak with total of 951 deceased people and it decrease and have a little spike on March 2022. Next, Vaccine line chart for Kedah. It keep increasing until it reach 994826 total vaccine distributed on August 2021. The chart keep decreasing until November 2021 and it rises back until January 2022 with total vaccine of 275354 distributed. ',
    'The first graph shows Vaccine x Death Melaka scatter plot. In first graph, it shows that most plot is at the beginning of the plot which is the beginning of the virus appeared. The pattern keep increasing. It have the highest vaccine of 437683 with 297 total of death. Next, Vaccine distribution for Melaka. Pfizer which 1,453,758 doses distributed have the highest distribution amongst other. Next, Sinovac have the 2nd highest which is 601,691 doses. Total of doses distributed in Melaka is 2,119,801 doses. Next, death line chart for Melaka. It keep increasing until it reach August 2021 with total death of 297. The graph keep decreasing after it reach its peak. Next, Vaccine line chart for Melaka. It keep rising until it reach August 2021 with total of 437683 and it kee decreasing until it reach November 2021. In January, the line spike with total of vaccine distributed 201793 and it keep decreasing after that.',
    'The first graph shows Vaccine x Death Pahang scatter plot. In first graph, it shows that most plot is at the beginning of the plot which is the beginning of the virus appeared. The highest death is 182 with 622812 total vaccinated people. Next, Vaccine Distribution in Pahang. Pfizer is the most vaccine distributed with amount of 2,435,592 doses. Followed by Sinovac, AstraZeneca, Cansino and Sinopharm accordingly. Next, death line chart for pahang. It peak on August 2021 with total death of 182 and it keep decreasing after that. Spike also can been during March 2022 with total death of 102. Lastly, vaccine line chart for Pahang. It peak on September 2021 with 636074 total of vaccine distributed. It keep decreasing after it reach its peak. On january 2022, the line chart goes up with total of total vaccine of 271131 distributed.  ',
    'The first graph shows Vaccine x Death Terengganu scatter plot. It shows that most plot is at the beginning of the plot which is the beginning of the virus appeared. The highest death is 142 with 57355 vaccinated people. Next, vaccine distribution in Terengganu. Pfizer is the most distributed vaccine with total of 1,506,789 doses. Followed by Sinovac, Astrazeneca, CanSino and Sinopharm accordingly. Next, death line chart for terengganu. first of all, it peak on September 2021 with total death of 139 then it keep decreasing until October 2021. Next, it keep increasing until November 2021 with the highest total of death 142 and it keep decreasing after it reach peak. Next, Vaccine line chart for Terengganu. It reach its peak on August 2021 and it keep decreasing after that. It started to rises back from November 2021 until January 2022.',
    'The first graph shows Vaccine x Death Putrajaya scatter plot. Putrajaya have the lowest death causes by the virus. The highest death which is 5 can be seen at the plot which have 92913 total of vaccinated people. Next, Vaccine Distribution in Putrajaya with total of 414,396 doses. Pfizer still the most vaccine distributed with total of 287,268. Next, Sinovac is the 2nd highest with total of 124,335 doses distributed. 3rd ranking is AstraZeneca follwed by Cansino and Sinopharm. Next, Death Line chart for Putrajaya. It reach its peak on July 2021 with total death of 5 and keep falling. On April 2022, it spike again and reach total death of 3. Next, Vaccine line chart for Putrajaya. It reach its peak on July 2021 with 92913 total vaccine distributed and it keep decrease after it reach its peak.',
    'The first graph shows Vaccine x Death Putrajaya scatter plot. Most of the plot is scattered at the beginning of the plot. When 77977 people already vaccinated, 44 death occured. Next, Vaccine distribution in Perlis. Pfizer is the highest distribution which have 404,291 doses. Followed by Sinovac, AstraZeneca, CanSino and Sinopharm accordingly. Next, death line chart for Perlis. the chart reach its peak on September 2021 with total death of 44 and followed by 43 on October 2021. It keep decreasing until it reach January 2022. Howeverr it rises back until March 2022 with total death of 32 and it keep decreasing after that. Lastly, vaccine line chart for Perlis. The chart reach its peak on August 2021 with 91608 total of vaccine distributed. The chart keep decreasing after it reach its own peak.']
    
    if (state == 'Selangor'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[0];
        document.getElementById('discussion').innerHTML = arrayText[0];
    }else if (state == 'Federal Territory of Kuala Lumpur'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[1];
        document.getElementById('discussion').innerHTML = arrayText[1];
    }else if (state == 'Johor'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[2];
        document.getElementById('discussion').innerHTML = arrayText[2];
    }else if (state == 'Sabah'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[3];
        document.getElementById('discussion').innerHTML = arrayText[3];
    }else if (state == 'Sarawak'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[4];
        document.getElementById('discussion').innerHTML = arrayText[4];
    }else if (state == 'Negeri Sembilan'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[5];
        document.getElementById('discussion').innerHTML = arrayText[5];
    }else if (state == 'Penang'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[6];
        document.getElementById('discussion').innerHTML = arrayText[6];
    }else if (state == 'Kelantan'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[7];
        document.getElementById('discussion').innerHTML = arrayText[7];
    }else if (state == 'Perak'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[8];
        document.getElementById('discussion').innerHTML = arrayText[8];
    }else if (state == 'Kedah'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[9];
        document.getElementById('discussion').innerHTML = arrayText[9];
    }else if (state == 'Melaka'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[10];
        document.getElementById('discussion').innerHTML = arrayText[10];
    }else if (state == 'Pahang'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[11];
        document.getElementById('discussion').innerHTML = arrayText[11];
    }else if (state == 'Terengganu'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[12];
        document.getElementById('discussion').innerHTML = arrayText[12];
    }else if (state == 'Federal Territory of Putrajaya'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[13];
        document.getElementById('discussion').innerHTML = arrayText[13];
    }else if (state == 'Perlis'){
        document.getElementById('title').innerHTML = "Insights for " + arrayTitle[14];
        document.getElementById('discussion').innerHTML = arrayText[14];
    }
}



create()