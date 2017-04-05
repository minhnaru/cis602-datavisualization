function exMap(mapData, data, key, elementID) {

    /* Initial value */
    var inputWidth = 1000,
        inputHeight = 500
        fontSize = 11,
        fontFamily = "Helvetica, Arial, sans-serif";

    /* Overall SVG Container */
    var margin = { top: 10, left: 10, right: 10, bottom: 10},
        width = inputWidth - margin.left - margin.right,
        height = inputHeight - margin.top - margin.bottom;

    var color = d3.scaleSequential(d3.interpolateReds); // Red sequential color scheme range [0,1]

    /* Create a new projection */
    var projection = d3.geoNaturalEarth()
        .scale(160)
        .translate([ width / 2, height / 2 ]);

    /* Create a path using projection */
    var path = d3.geoPath()
        .projection(projection);

    /* Create SVG Container & Group Element */
    var svg = d3.select(elementID)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

    var countPlayer = {};
    data.forEach(function(d) {
        countPlayer[d[key]] = (countPlayer[d[key]] || 0) + 1;
    });

    var maxCount = Math.max.apply(null, Object.keys(countPlayer).map(function(d) { return countPlayer[d]; }));

    svg.append("use") /* Draw stroke */
        .attr("class", "stroke")
        .attr("xlink:href", "#sphere")
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-width", "1");

    var drawMap = svg.selectAll("g")
        .data(mapData.features)
        .enter().append("g");

    var focus = drawMap.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("rect")
        .attr("width", 130)
        .attr("height", 130)
        .attr("stroke", "#999999")
        .attr("opacity", 0.7)
        .attr("fill", "#ff7f7f")
        .attr("stroke-width", 0.7)
        .attr("rx", 6)
        .attr("ry", 6);

    focus.append("text")
        .attr("font-size", fontSize)
        .attr("font-family", fontFamily)
        .attr("opacity", 0.8)
        .attr("dx", 12)
        .attr("dy", 5);

    drawMap.append("path")
        .attr("class", function(d) { return d.id; })
        .attr("d", path)
        .attr("fill",
            function(d) {
                return (countPlayer[d.properties.name] == undefined) ? "#fff" : color((countPlayer[d.properties.name]) / maxCount);
            })
        .attr("stroke", "#333333")
        .attr("stroke-width", "0.5")
        .on("mouseover", function(d) {
            focus.style("display", null)
            focus.select("rect")
            .attr("transform", function(d) { return "translate(" + event.clientX + "," + (event.clientY - 220) + ")"; })
            focus.select("text")
            .attr("transform", function(d) { return "translate(" + event.clientX + "," + (event.clientY - 200) + ")"; })
            .text("Number of Player: " + countPlayer[d.properties.name])
            d3.select(this)
            .attr("fill", "#ff5454"); 
        })
        .on("mouseout", function(d) {
            focus.style("display", "none")
            d3.select(this)
            .attr("fill", function(d) {
                return (countPlayer[d.properties.name] == undefined) ? "#fff" : color((countPlayer[d.properties.name]) / maxCount);
            });
        });

    drawMap.append("title")
        .text(function(d) {
            return (countPlayer[d.properties.name] == undefined) ? "" : d.properties.name + ": " + countPlayer[d.properties.name];
        });

    drawMap.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

}

function exVis(errors, mapData, mensData) {

    if (errors) throw errors;

    exMap(mapData, mensData, "Nationality", "#extracredit");

}

d3.queue()
    .defer(d3.json, "https://cdn.rawgit.com/johan/world.geo.json/master/countries.geo.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/guardian-16-men.json")
    .await(exVis);