/*jshint quotmark: double, unused: false*/
"use strict";
/* global d3, 
Integrator
 */


function Simulation() {
    this.integrateTimer = null;
    this.w = 700;
    this.h = 390;

    this.x = d3.scale.linear()
            .range([0, this.w]);
    this.y = d3.scale.linear()
            .range([this.h, 0]);
    
    this.lineFunction = d3.svg.line()
        .x(function(d) { return this.x(d[0]); }.bind(this))
        .y(function(d) { return this.y(d[1]); }.bind(this))
        .interpolate("linear");
}

Simulation.prototype.selectType = function(theme, N) {
    this.N = N;
    this.theme = theme;
    this.starApexes = [];
    this.apexStorage = [];
    
    this.integrator = null; //clear old integrator
    this.integrator = new Integrator(this.N, this.theme);

    if(this.theme !== "keplerPlanet") {
        this.sps = 60; /* steps per second */
        this.redraw = 2;
        this.transitiontime = 250;
        this.integrator.dt = 0.002;
    }
    if(this.theme === "keplerPlanet") {
        this.sps = 40; /* steps per second */
        this.redraw = 1;
        this.transitiontime = 100;
        this.integrator.dt = 0.03;
    }
        
    this.setBackgroundImage();
    $(".selector.selected").removeClass("selected");
    $("#"+theme+"Chooser").addClass("selected");
    $("#starLayer").empty();
    
    this.integrator.calcAccels();
    this.initializeStarPlot();

    this.launchSimulation();
};

Simulation.prototype.initializeStarPlot = function() {
    var xrange,
        yrange;
    var colorChoices,
        colorChoices2,
        colors,
        colors2,
        c,
        x = this.x,
        y = this.y;
    var starContainer;
        
    var stars = this.integrator.cluster.stars;
    
    // creates the svg representation of the stars
    if (this.theme === "jeffers") {
    
        xrange = 12;
        yrange = xrange * this.h / this.w;
        var i, a;
  
        x.domain([-8, 4]);
        y.domain([2.5-yrange, 2.5]);
            
        // raw shape of the star. these get scaled by the sqrt of mass
        // and stretched / flipped randomly to make the stars look more organic
        var rawApexes = [
            [-2.5, -0.5],
            [-2, -6.5],
            [1, -1.6],
            [2, -7.5],
            [2.5, -0.5],
            [5, 2],
            [2, 1.5],
            [0.5, 5.5],
            [-1.5, 1],
            [-5.5, 0.7]
        ];
        
        for (i = 0; i < this.N; i++) {
            var thisApexes = [];
            var thisApexStorage = [];
            var mscale = 0.0007/stars[this.N-1].mass,
                flip,
                stretchx,
                stretchy;
            flip = (Math.random() < 0.5) ? 1.0 : -1.0;
            for (a = 0; a < rawApexes.length; a++) {
                stretchx = (0.4 * Math.random() - 0.2 + 1) * flip;
                stretchy = (0.4 * Math.random() - 0.2 + 1);
                thisApexes.push([
                    Math.sqrt(stars[i].mass*mscale)*rawApexes[a][0]*stretchx + stars[i].pos[0],
                    Math.sqrt(stars[i].mass*mscale)*rawApexes[a][1]*stretchy + stars[i].pos[1]]);
                thisApexStorage.push([
                    Math.sqrt(stars[i].mass*mscale)*rawApexes[a][0]*stretchx,
                    Math.sqrt(stars[i].mass*mscale)*rawApexes[a][1]*stretchy]);
            }
            thisApexes.push([thisApexes[0][0], thisApexes[0][1]]);
            thisApexStorage.push([thisApexStorage[0][0], thisApexStorage[0][1]]);
            this.starApexes.push(thisApexes);
            this.apexStorage.push(thisApexStorage);
        }
        
        d3.select("#starLayer").selectAll(".star")
            .data(this.starApexes)
          .enter()
            .append("path")
            .attr("d", this.lineFunction)
            .attr("class", "jeffers star");       
    }
    else if (this.theme === "kepler" || this.theme === "keplerPlanet") {
        xrange = 5;
        yrange = xrange * this.h / this.w;
        x.domain([-xrange/2, xrange/2]);
        y.domain([-yrange/2, yrange/2]);
        var massExtent,
            maxmass = stars[0].mass;
        
        if (this.theme === "kepler") {
            colorChoices =  ["rgb(221, 56, 0)", "rgb(221, 137, 20)", "rgb(235, 170, 24)", "rgb(106, 137, 234)"];
            colorChoices2 = ["rgb(221, 38, 33)", "rgb(221, 56, 0)", "rgb(238, 128, 15)", "rgb(141, 125, 234)"];
            massExtent = [stars[this.N-1].mass, stars[0].mass];
        } else {
            colorChoices =  ["rgb(221, 56, 0)", "rgb(235, 170, 24)"];
            colorChoices2 = ["rgb(221, 38, 33)", "rgb(238, 128, 15)"];
            massExtent = [stars[3].mass, stars[0].mass];
        }

        colors = d3.scale.linear()
            .domain(d3.range(0, 1.01, 1.0 / (colorChoices.length - 1)))
            .range(colorChoices);
        colors2 = d3.scale.linear()
            .domain(d3.range(0, 1.01, 1.0 / (colorChoices2.length - 1)))
            .range(colorChoices2);   
        c = d3.scale.log()
            .domain(massExtent)
            .range([0, 1]);
            
        starContainer = d3.select("#starLayer").selectAll("g")
            .data(stars)
          .enter()
            .append("g")
            .attr("class", "starContainer");
            
        starContainer
          .append("circle")
          .attr("class", "kepler star")
          .attr("cx", function(d) { return x(d.pos[0]); })
          .attr("cy", function(d) { return y(d.pos[1]); })
          .attr("r", function(d) { 
              if (d.mass > 0.01) {
                  return 27 * Math.sqrt(d.mass/maxmass);
              } else {
                  return 4;
              }
          })
          .attr("fill", function(d) {
              if (d.mass > 0.01) {
                  return colors(c(d.mass)); 
              } else {
                    return "rgb(43, 15, 118)";
              }
          })
          .attr("stroke", function(d) { 
              if (d.mass > 0.01) { 
                  return colors2(c(d.mass));
              } else { 
                  return "rgb(163, 182, 247)";
              }
          })
          .attr("stroke-width", 1)
          .attr("opacity", 0.9);
          
        starContainer
          .append("circle")
          .attr("class", "kepler star")
          .attr("cx", function(d) { return x(d.pos[0]); })
          .attr("cy", function(d) { return y(d.pos[1]); })
          .attr("r", function(d) { return 27 * Math.sqrt(d.mass/maxmass); })
          .attr("fill", "none")
          .attr("stroke", function(d) { return colors2(c(d.mass)); })
          .attr("stroke-width", function(d) { return 9 * Math.sqrt(d.mass/maxmass); })
          .attr("opacity", 0.9)
          .attr("filter", "url(#gaussblur2)");
        
        starContainer  
          .append("circle")
          .attr("class", "kepler star")
          .attr("cx", function(d) { return x(d.pos[0]); })
          .attr("cy", function(d) { return y(d.pos[1]); })
          .attr("r", function(d) { 
              if (d.mass > 0.01) { 
                  return 8 * Math.sqrt(d.mass/maxmass);
              } 
              else {
                  return 0;
              } 
          })
          .attr("fill", "rgba(255, 255, 255, .8)")
          .attr("filter", "url(#gaussblur3)");
    }
};

Simulation.prototype.launchSimulation = function() {
    var count = 0;
    var starselection = d3.selectAll(".star");
    var containerselection = d3.selectAll(".starContainer");

    if (this.integrateTimer !== null) {
        clearInterval(this.integrateTimer);
    }

    this.integrateTimer = setInterval( function() {
        this.integrator.leapfrogStep(); 
        count++;
        if (count === this.redraw) {
            this.transitionStars(1.75*this.transitiontime, starselection, containerselection);
            count = 0;
        }
    }.bind(this), 1000/this.sps);
};

Simulation.prototype.initializeSvgLayers = function() {
    var svg = d3.select("#nbodycanvas").append("svg")
        .attr("width", this.w)
        .attr("height", this.h)
        .attr("id", "svg")
        .attr("overflow", "hidden");
    svg.append("image") // background image layer
        .attr("width", this.w)
        .attr("height", this.h)
        .attr("id", "backgroundImage");
    svg.append("g") // stars layer
        .attr("width", this.w)
        .attr("height", this.h)
        .attr("id", "starLayer");
    var defs = svg.append("defs");
    defs.append("filter")
        .attr("id", "gaussblur2")
        .attr("x", "-30%")
        .attr("y", "-30%")
        .attr("width", "160%")
        .attr("height", "160%")
      .append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", 2);
    defs.append("filter")
        .attr("id", "gaussblur3")
        .attr("x", "-40%")
        .attr("y", "-40%")
        .attr("width", "180%")
        .attr("height", "180%")
      .append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", 3);
};

Simulation.prototype.setBackgroundImage = function() {
    var fBgImg;
    if (this.theme === "jeffers") {
        fBgImg = "images/htcas_small.jpg";
    }
    else if (this.theme === "kepler" || this.theme === "keplerPlanet") {
        fBgImg = "images/blue-nebula.jpg";
    }
    d3.select("#backgroundImage").attr("xlink:href", fBgImg);
};


Simulation.prototype.transitionStars = function(duration, starselection, containerselection) {
    if (this.theme === "jeffers") {
        var i, a;
        var stars = this.integrator.cluster.stars;
        for (i = 0; i < this.N; i++) {
            for (a = 0; a < 11; a++){   
                this.starApexes[i][a][0] = this.apexStorage[i][a][0] + stars[i].pos[0];
                this.starApexes[i][a][1] = this.apexStorage[i][a][1] + stars[i].pos[1];
            }
        }
        starselection
          .transition()
            .ease("linear")
            .attr("d", this.lineFunction)
            .duration(duration);
    } else {
        if(this.theme === "keplerPlanet") {
          // sort the planets and stars by z so that they occult each other correctly
          containerselection
            .sort( function(a, b) {
              if (a.pos[2] < b.pos[2] - 0.01){   
                  return -1;
              } else { 
                  return 1;
              }
          });
        }
        starselection
            .attr("cx", function(d) { return this.x(d.pos[0]); }.bind(this))
            .attr("cy", function(d) { return this.y(d.pos[1]); }.bind(this));
    }
};




