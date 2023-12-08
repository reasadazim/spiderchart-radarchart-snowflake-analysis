

        var margin = { top: 100, right: 100, bottom: 100, left: 100 },
        width = Math.min(700, window.innerWidth - 10) - margin.left - margin.right,
        height = Math.min(width, window.innerHeight - margin.top - margin.bottom - 20);

        var data = [
            [
                {axis:"Earning per share",value:0.10},
                {axis:"Return on assets",value:0.36},
                {axis:"Net margin",value:0.15},
                {axis:"Shares",value:0.21},
                {axis:"Leverage",value:0.24},
            ]
        ];


        // ************************** Draw the Chart **************************

        var color = d3.scale.ordinal().range(["#C75532", "#00A0B0", "#CC333F"]);

        var radarChartOptions = {
            w: width,
            h: height,
            margin: margin,
            maxValue: 0.5,
            levels: 5,
            roundStrokes: true,
            color: color
        };
        //Call function to draw the Radar chart
        RadarChart(".radarChart", data, radarChartOptions);



        function RadarChart(id, data, options) {
            var cfg = {
                w: 600, //Width of the circle
                h: 600, //Height of the circle
                margin: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                }, //The margins of the SVG
                levels: 3, //How many levels or inner circles should there be drawn
                maxValue: 0, //What is the value that the biggest circle will represent
                labelFactor: 1.25, //How much farther than the radius of the outer circle should the labels be placed
                wrapWidth: 60, //The number of pixels after which a label needs to be given a new line
                opacityArea: 0.7, //The opacity of the area of the blob
                dotRadius: 4, //The size of the colored circles of each blog
                opacityCircles: 0.1, //The opacity of the circles of each blob
                strokeWidth: 2, //The width of the stroke around each blob
                roundStrokes: false, //If true the area and stroke will follow a round path (cardinal-closed)
                color: d3.scale.category10() //Color function
            };

            //Put all of the options into a variable called cfg
            if ('undefined' !== typeof options) {
                for (var i in options) {
                    if ('undefined' !== typeof options[i]) {
                        cfg[i] = options[i];
                    }
                } //for i
            } //if

            //If the supplied maxValue is smaller than the actual one, replace by the max in the data
            var maxValue = Math.max(cfg.maxValue, d3.max(data, function(i) {
                return d3.max(i.map(function(o) {
                    return o.value;
                }))
            }));

            var allAxis = (data[0].map(function(i, j) {
                    return i.axis
                })), //Names of each axis
                total = allAxis.length, //The number of different axes
                radius = Math.min(cfg.w / 2, cfg.h / 2), //Radius of the outermost circle
                Format = d3.format('%'), //Percentage formatting
                angleSlice = Math.PI * 2 / total; //The width in radians of each "slice"

            //Scale for the radius
            var rScale = d3.scale.linear()
                .range([0, radius])
                .domain([0, maxValue]);

            // ************************** Create the container SVG and g **************************

            //Remove whatever chart with the same id/class was present before
            d3.select(id).select("svg").remove();

            //Initiate the radar chart SVG
            var dim = Math.min(width, height)
            var svg = d3.select(id).append("svg")
                .attr("width", '75%')
                .attr("height", '75%')
                .attr('viewBox', '0 0 ' + (dim + (dim / 2)) + ' ' + (dim + (dim / 2)))
                .attr('preserveAspectRatio', 'xMinYMin')
                .attr("class", "radar" + id);
            //Append a g element		
            var g = svg.append("g")
                .attr("transform", "translate(" + (dim + (dim / 2)) / 2 + "," + (dim + (dim / 2)) / 2 + ")");

            // ************************** Glow filter for some extra pizzazz *************************

            //Filter for the outside glow
            var filter = g.append('defs').append('filter').attr('id', 'glow'),
                feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2.5').attr('result', 'coloredBlur'),
                feMerge = filter.append('feMerge'),
                feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
                feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

            // ************************** Draw the Circular grid ***************************

            //Wrapper for the grid & axes
            var axisGrid = g.append("g").attr("class", "axisWrapper");

            //Draw the background circles
            axisGrid.selectAll(".levels")
                .data(d3.range(1, (cfg.levels + 1)).reverse())
                .enter()
                .append("circle")
                .attr("class", "gridCircle")
                .attr("r", function(d, i) {
                    return radius / cfg.levels * d;
                })
                .style("fill", function(d, i) {
                    if (i % 2 == 0) {
                        return "#2D3642"
                    } else {
                        return "#424B58"
                    }
                }).style("stroke", "#1B222D")
                .style("fill-opacity", 1)
                .style("filter", "url(#glow)");

            // *********************** Draw the axes ***************************

            //Create the straight lines radiating outward from the center
            var axis = axisGrid.selectAll(".axis")
                .data(allAxis)
                .enter()
                .append("g")
                .attr("class", "axis");
            //Append the lines
            axis.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", function(d, i) {
                    return rScale(maxValue * 1) * Math.cos(angleSlice * i - Math.PI / 2);
                })
                .attr("y2", function(d, i) {
                    return rScale(maxValue * 1) * Math.sin(angleSlice * i - Math.PI / 2);
                })
                .attr("class", "line")
                .style("stroke", "#424B58")
                .style("stroke-width", "2px");

            //Append the labels at each axis
            axis.append("text")
                .attr("class", "legend")
                .style("font-size", "1.4em")
                .attr("text-anchor", "middle")
                .attr("dy", "0.3em")
                .attr("x", function(d, i) {
                    return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2);
                })
                .attr("y", function(d, i) {
                    return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2);
                })
                .text(function(d) {
                    return d
                })
                .call(wrap, cfg.wrapWidth);

            // *********************** Draw the radar chart blobs ****************************

            //The radial line function
            var radarLine = d3.svg.line.radial()
                .interpolate("linear-closed")
                .radius(function(d) {
                    return rScale(d.value);
                })
                .angle(function(d, i) {
                    return i * angleSlice;
                });

            if (cfg.roundStrokes) {
                radarLine.interpolate("cardinal-closed");
            }

            //Create a wrapper for the blobs	
            var blobWrapper = g.selectAll(".radarWrapper")
                .data(data)
                .enter().append("g")
                .attr("class", "radarWrapper");

            //Append the backgrounds	
            blobWrapper
                .append("path")
                .attr("class", "radarArea")
                .attr("d", function(d, i) {
                    return radarLine(d);
                })
                .style("fill", function(d, i) {
                    return cfg.color(i);
                })
                .style("fill-opacity", cfg.opacityArea)
                .on('mouseover', function(d, i) {
                    //Dim all blobs
                    d3.selectAll(".radarArea")
                        .transition().duration(200)
                        .style("fill-opacity", 0.1);
                    //Bring back the hovered over blob
                    d3.select(this)
                        .transition().duration(200)
                        .style("fill-opacity", 0.7);
                })
                .on('mouseout', function() {
                    //Bring back all blobs
                    d3.selectAll(".radarArea")
                        .transition().duration(200)
                        .style("fill-opacity", cfg.opacityArea);
                });

            //Create the outlines	
            blobWrapper.append("path")
                .attr("class", "radarStroke")
                .attr("d", function(d, i) {
                    return radarLine(d);
                })
                .style("stroke-width", cfg.strokeWidth + "px")
                .style("stroke", function(d, i) {
                    return cfg.color(i);
                })
                .style("fill", "none")
                .style("filter", "url(#glow)");




        // ************************************ Interactivity ***********************************


	
		// set the dimensions and margins of the graph
		var margin1 = { top: 100, right: 100, bottom: 100, left: 100 },
			 width1 = Math.min(900, window.innerWidth - 10) - margin.left - margin.right,
			 height1 = Math.min(900, window.innerWidth - 10) - margin.left - margin.right;


		// The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
		var radius = Math.min(width1, height1) / 2 - margin1.left

		// append the svg object to the div called 'my_dataviz'
		var svg = d3.select(".radarChart")
			.append("svg")
				.attr("width", width1)
				.attr("height", height1)
			.append("g")
				.attr("transform", "translate(" + width1 / 2 + "," + height1 / 2 + ")");

		// Create dummy data
		var data = {a: 50, b: 50, c:50, d:50, e:50} //do not change it.

		// set the color scale
		var color = d3.scaleOrdinal()
			.domain(data)
			.range(["transparent", "transparent", "transparent", "transparent", "transparent"])

		// Compute the position of each group on the pie:
		var pie = d3.pie()
			.value(function(d) {return d.value; })
		var data_ready = pie(d3.entries(data))


		blobWrapper.selectAll('whatever').data(data_ready)
			.enter()
			.append('path')
			.attr('d', d3.arc()
				.innerRadius(0)
				.outerRadius(radius)
			)
			.attr('fill', function(d){ return(color(d.data.key)) })
			.attr("class", "cone")
			.style("stroke-width", "2px")
			.style("opacity", 0.4)
			.style("rotate", "38deg")
			.style("cursor", "pointer")

		g.selectAll('.cone').on("mouseover", function(d, blobWrapper){
		

			this.setAttribute("fill", "#ffffff")
			
            // Change this data as per requirements
			var tooltip_data = { 
				earning_per_share : ["Earning per share", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt 1", 2],
				return_on_assets : ["Return on assets", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt 2", 3],
				net_margin : ["Net margin", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt 3", 2],
				shares :  ["Shares", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt 4", 6],
				leverage : ["Leverage", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt 5", 5],
			}
			
			if(d.data.key == 'e'){
						d3.select("#tooltip")
						.style("left", d3.event.pageX + "px")
						.style("top", d3.event.pageY + "px")
						.style("opacity", 1)
						.select("#number")
						.text("1 | ");

                        d3.select("#heading_text")
                        .text(tooltip_data.earning_per_share[0]);

                        d3.select("#text")
						.text(tooltip_data.earning_per_share[1]);

						d3.select("#text")
						.text(tooltip_data.earning_per_share[1]);
				
						d3.select("#analysis_number")
						.text(tooltip_data.earning_per_share[2]+"/6");
				
					var icons = '';
					for(var counter = 0; counter < tooltip_data.earning_per_share[2]; counter++){
						icons += '<i class="fa fa-check-circle" aria-hidden="true" style="color:#40ff00;"></i> ';
					}
				
					for(var counter = 0; counter < 6-tooltip_data.earning_per_share[2]; counter++){
						icons += '<i class="fa fa-times-circle" aria-hidden="true" style="color:#ff0000;"></i> ';
					}
				
					d3.select("#icons").html(icons);

			}

			
			if(d.data.key == 'a'){
                    d3.select("#tooltip")
                    .style("left", d3.event.pageX + "px")
                    .style("top", d3.event.pageY + "px")
                    .style("opacity", 1)
                    .select("#number")
                    .text("2 | ");

                    d3.select("#heading_text")
                    .text(tooltip_data.return_on_assets[0]);

                    d3.select("#text")
                    .text(tooltip_data.return_on_assets[1]);

                    d3.select("#text")
                    .text(tooltip_data.return_on_assets[1]);
            
                    d3.select("#analysis_number")
                    .text(tooltip_data.return_on_assets[2]+"/6");
        
                    var icons = '';
                    for(var counter = 0; counter < tooltip_data.return_on_assets[2]; counter++){
                        icons += '<i class="fa fa-check-circle" aria-hidden="true" style="color:#40ff00;"></i> ';
                    }
                
                    for(var counter = 0; counter < 6-tooltip_data.return_on_assets[2]; counter++){
                        icons += '<i class="fa fa-times-circle" aria-hidden="true" style="color:#ff0000;"></i> ';
                    }
                
                    d3.select("#icons").html(icons);
			}
			
		if(d.data.key == 'b'){
                d3.select("#tooltip")
                .style("left", d3.event.pageX + "px")
                .style("top", d3.event.pageY + "px")
                .style("opacity", 1)
                .select("#number")
                .text("3 | ");

                d3.select("#heading_text")
                .text(tooltip_data.net_margin[0]);

                d3.select("#text")
                .text(tooltip_data.net_margin[1]);

                d3.select("#text")
                .text(tooltip_data.net_margin[1]);
        
                d3.select("#analysis_number")
                .text(tooltip_data.net_margin[2]+"/6");
    
                var icons = '';
                for(var counter = 0; counter < tooltip_data.net_margin[2]; counter++){
                    icons += '<i class="fa fa-check-circle" aria-hidden="true" style="color:#40ff00;"></i> ';
                }
            
                for(var counter = 0; counter < 6-tooltip_data.net_margin[2]; counter++){
                    icons += '<i class="fa fa-times-circle" aria-hidden="true" style="color:#ff0000;"></i> ';
                }
            
                d3.select("#icons").html(icons);
			}
			
			
		if(d.data.key == 'c'){
                d3.select("#tooltip")
                .style("left", d3.event.pageX + "px")
                .style("top", d3.event.pageY + "px")
                .style("opacity", 1)
                .select("#number")
                .text("4 | ");

                d3.select("#heading_text")
                .text(tooltip_data.shares[0]);

                d3.select("#text")
                .text(tooltip_data.shares[1]);

                d3.select("#text")
                .text(tooltip_data.shares[1]);
        
                d3.select("#analysis_number")
                .text(tooltip_data.shares[2]+"/6");

                var icons = '';
                for(var counter = 0; counter < tooltip_data.shares[2]; counter++){
                    icons += '<i class="fa fa-check-circle" aria-hidden="true" style="color:#40ff00;"></i> ';
                }
            
                for(var counter = 0; counter < 6-tooltip_data.shares[2]; counter++){
                    icons += '<i class="fa fa-times-circle" aria-hidden="true" style="color:#ff0000;"></i> ';
                }
            
                d3.select("#icons").html(icons);
			}

			
		if(d.data.key == 'd'){
                d3.select("#tooltip")
                .style("left", d3.event.pageX + "px")
                .style("top", d3.event.pageY + "px")
                .style("opacity", 1)
                .select("#number")
                .text("5 | ");

                d3.select("#heading_text")
                .text(tooltip_data.leverage[0]);

                d3.select("#text")
                .text(tooltip_data.leverage[1]);

                d3.select("#text")
                .text(tooltip_data.leverage[1]);
        
                d3.select("#analysis_number")
                .text(tooltip_data.leverage[2]+"/6");

                var icons = '';
                for(var counter = 0; counter < tooltip_data.leverage[2]; counter++){
                    icons += '<i class="fa fa-check-circle" aria-hidden="true" style="color:#40ff00;"></i> ';
                }
            
                for(var counter = 0; counter < 6-tooltip_data.leverage[2]; counter++){
                    icons += '<i class="fa fa-times-circle" aria-hidden="true" style="color:#ff0000;"></i> ';
                }
            
                d3.select("#icons").html(icons);
			}
			

		
		});


        
		g.selectAll('.cone').on("mouseout", function(d, blobWrapper){
			this.setAttribute("fill", "transparent")
			           // Hide the tooltip
              d3.select("#tooltip").style("opacity", 0)
		});
	


        //  ******************************** Helper Function *************************

            //Taken from http://bl.ocks.org/mbostock/7555321
            //Wraps SVG text	
            function wrap(text, width) {
                text.each(function() {
                    var text = d3.select(this),
                        words = text.text().split(/\s+/).reverse(),
                        word,
                        line = [],
                        lineNumber = 0,
                        lineHeight = 1.4, // ems
                        y = text.attr("y"),
                        x = text.attr("x"),
                        dy = parseFloat(text.attr("dy")),
                        tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

                    while (word = words.pop()) {
                        line.push(word);
                        tspan.text(line.join(" "));
                    }
                });
            } 
        } 
