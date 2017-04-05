function generateMap(mapData, data, key, elementID) {

    /* Initial value */
    var inputWidth = 1000,
        inputHeight = 500;

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

    svg.append("g")
        .selectAll("path")
        .data(mapData.features) /* mapData = topojson.feature(mapData, mapData.properties.name) */
        .enter().append("path") /* Draw Countries */
        .attr("class", function(d) { return d.id })
        .attr("d", path)
        .attr("fill",
            function(d) {
                return (countPlayer[d.properties.name] == undefined) ? "#fff" : color((countPlayer[d.properties.name]) / maxCount);
            })
        .attr("stroke", "#333333")
        .attr("stroke-width", "0.5")
        .append("title")
            .text(function(d) {
                return (countPlayer[d.properties.name] == undefined) ? "" : d.properties.name + ": " + countPlayer[d.properties.name];
            })
        .append("defs").append("path") /* Create Outline stroke path */
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

}

function generateForce(teammateData, mensData, elementID) {

    /* Initial value */
    var inputWidth = 1000,
        inputHeight = 800,
        radius = 6,
        fontSize = 11,
        fontFamily = "Helvetica, Arial, sans-serif";

    /* Initial nodes and links */
    nodes = [];
    links = [];

    /* Count Player */
    var countPlayer = _.countBy(mensData, "Nationality");
    /* Map counted players and put each key and value in separate object in an array */
    var nations = _.map(countPlayer, function(value, key) { return { key: key, value: value }; });
    /* Sort the array in descending order */
    var orderNation = _.orderBy(nations, ['value'], ['desc']);
    /* Chunk the first 9 nations */
    var chunkNation = _.chunk(orderNation, 9)[0];
    /* Map and push object "Other" */
    var nationalities = _.map(chunkNation, 'key');
    nationalities.push("Other");

    teammateData.map(function(players) {
        players.map(function(player) {
            /* Filter mensData(value, index|key, collection) to get nationality from each player name */
            nationality = (_.filter(mensData, function(o) { return player == o.Name; })[0]["Nationality"]);
            /* includes(collection, value, [fromIndex=0]) return true if value is found, else false */
            node = { "id": player, "nation": (_.includes(nationalities, nationality)) ? nationality : "Other" };
            nodes.push(node);
        });
        /* Add object "source" and "target" to each value */
        link  = { "source": players[0], "target": players[1] };
        links.push(link);
    });

    nodes = _.uniqBy(nodes, "id");

    teammateData = { "nodes": nodes, "links": links };

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    /* Overall SVG Container */
    var margin = { top: 10, left: 10, right: 10, bottom: 10},
        width = inputWidth - margin.left - margin.right,
        height = inputHeight - margin.top - margin.bottom;

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(0))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2));

    simulation
        .nodes(teammateData.nodes)
        .on("tick", ticked);

    simulation
        .force("link")
        .links(teammateData.links);

    /* Create SVG Container & Group Element */
    var svg = d3.select(elementID)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);

    /* Create border for Froce Simulation */
    svg.append("rect")
        .attr("x", .5)
        .attr("y", .5)
        .attr("width", width + margin.left + margin.right - 1)
        .attr("height", height + margin.top + margin.bottom -1)
        .attr("stroke", "black")
        .attr("opacity", 0.7)
        .attr("fill", "none")
        .attr("stroke-width", 0.7);

    var link = svg.selectAll("line")
        .data(teammateData.links)
        .enter().append("line")
        .attr("stroke-width", 0.3)
        .attr("stroke", "black")
        .attr("opacity", 0.4);

    var node = svg.selectAll("g")
        .data(teammateData.nodes)
        .enter().append("g");

    node.append("circle")
        .attr("r", 7)
        .attr("fill", function(d) { return color(d.nation); })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("title")
        .text(function(d) { return d.id; });

    node.append("text")
        .attr("font-size", fontSize)
        .attr("font-family", fontFamily)
        .attr("opacity", 0.8)
        .attr("dx", 12)
        .attr("dy", 5)
        .text(function(d) { return d.id; });

    function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.select("circle")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });

        node.select("text")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
    }

    /* Draw Legend */
    var legend = svg.append("g")
        .attr("class", "legend")
        .selectAll("g")
        .data(nationalities)
        .enter().append("g")
        .attr("class", function(d) { return d; })
        .attr("transform", function(d, i) { return "translate(0," + (i * radius * 3.5) + ")"; });

    /* Legend countries name */
    legend.append("text")
        .attr("font-size", fontSize)
        .attr("font-family", fontFamily)
        .attr("text-anchor", "end")
        .attr("x", width - radius * 4.2)
        .attr("y", radius * 4.7)
        .text(function(d) { return d; });

    /* Legend color circle */
    legend.append("circle")
        .attr("cx", width - radius * 1.5)
        .attr("cy", radius * 4)
        .attr("r", radius)
        .attr("fill", color);

};

function createVis(errors, mapData, womensData, mensData, teammateData) {

    if (errors) throw errors;

    generateMap(mapData, womensData, "Country", "#map-women");
    generateMap(mapData, mensData, "Nationality", "#map-men");
    generateForce(teammateData, mensData, "#teammates");

}

d3.queue()
    .defer(d3.json, "https://cdn.rawgit.com/johan/world.geo.json/master/countries.geo.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/fifa-17-women.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/guardian-16-men.json")
    .defer(d3.json, "https://cdn.rawgit.com/dakoop/e4fa063e3f3415f3d3c79456bc4b6dc5/raw/a9e01691802c8e70d94ce33a59e98529cc4324af/soccer-teammates-men.json")
    .await(createVis);







