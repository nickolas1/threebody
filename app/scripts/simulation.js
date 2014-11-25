/*jshint quotmark: double, unused: false*/
"use strict";
/* global d3, 
  IntegratorIAS15
 */


function Simulation(system) {
  this.system = system;
  
  // get things centered
  this.system.moveToCenterOfMomentum();
  // grab initial energy
  this.system.calcTotalEnergy();
  this.initialEnergy = system.totalEnergy;
  
  // find timescale
  this.system.calcTimescale();
  
  // get an integrator and inject the system
  this.integrator = new IntegratorIAS15(this.system);
  // use integrator method to setup bodiesLast, then get system shape
  this.integrator.copyBodiesToBodiesLast();
  this.system.calcTriangleSizeAndShape();
  
  console.log(this.integrator);
  
  // set up timing
  this.tfinal = 100 * this.system.timescale;
  this.secondsPerTimescale = 5;
  this.fps = 24;
  this.calcDtAnimate();

  this.timeNextAnimate = this.dtAnimate;
  this.integrator.maxDt = this.dtAnimate;
  
  this.leaveTrails = true;

  // svg stuff
  this.integrateTimer = null;
  
  this.w = parseInt(d3.select("#spatial-canvas").style("width"), 10);
  this.h = this.w * 0.8;
  
  this.xSpatial = d3.scale.linear()
          .range([0, this.w]);
  this.ySpatial = d3.scale.linear()
          .range([this.h, 0]);
  this.xShape = d3.scale.linear()
          .range([0, this.w]);
  this.yShape = d3.scale.linear()
          .range([this.h, 0]);
  this.yShapeThermometer = d3.scale.linear()
          .range([this.h, 0]);
  
  this.lineFunction = d3.svg.line()
      .x(function(d) { return this.x(d[0]); }.bind(this))
      .y(function(d) { return this.y(d[1]); }.bind(this))
      .interpolate("linear");
  
  d3.select(window).on("resize", this.setPlotSizes);
  
}

Simulation.prototype.setSpeed = function(newSpeed) {
  this.secondsPerTimescale = newSpeed;
  this.calcDtAnimate();
};

Simulation.prototype.calcDtAnimate = function() {
  this.dtAnimate = this.system.timescale / (this.secondsPerTimescale * this.fps);
  console.log(this.system.timescale, this.dtAnimate);
};

Simulation.prototype.setPlotSizes = function() {
  console.log("resizing");
  this.w = parseInt(d3.select("#spatial-canvas").style("width"), 10);
  this.h = this.w * 0.8;
  
  var spacesvg = d3.select("#spatial-svg"),
    shapesvg = d3.select("#shape-svg");
  
  if (shapesvg !== null) {
    shapesvg
      .style("width", this.w)
      .style("height", this.h);
  }
  
  if (spacesvg !== null) {    
    spacesvg
      .style("width", this.w)
      .style("height", this.h);  
    console.log(spacesvg.style("width"), shapesvg.style("width"));
  }    
  
  this.xSpatial = d3.scale.linear()
          .range([0, this.w]);
  this.ySpatial = d3.scale.linear()
          .range([this.h, 0]);
  this.xShape = d3.scale.linear()
          .range([0, this.w]);
  this.yShape = d3.scale.linear()
          .range([this.h, 0]);
  this.yShapeThermometer = d3.scale.linear()
          .range([this.h, 0]);
};


Simulation.prototype.setSpatialPlotDomain = function(newRange) {
  var xrange = newRange,
    yrange = xrange * this.h / this.w;
    
  this.xSpatial.domain([-xrange/2, xrange/2]);
  this.ySpatial.domain([-yrange/2, yrange/2]);
  
  this.spatialPlotRange = newRange;
  
  this.refreshSpatialPlot();
  console.log("setting range ",this.spatialPlotRange);
};


Simulation.prototype.initializeSpatialPlot = function() {
  var xrange,
    yrange,
    x = this.xSpatial,
    y = this.ySpatial;

    
  var bodies = this.system.bodiesLast;

  // create the svg representation of the bodies
  xrange = 15;
  yrange = xrange * this.h / this.w;

  x.domain([-xrange/2, xrange/2]);
  y.domain([-yrange/2, yrange/2]);

  d3.select("#bodies-layer").selectAll("g")
    .data(bodies)
  .enter()
    .append("circle")
    .attr("cx", function(d) { return x(d.pos[0]); })
    .attr("cy", function(d) { return y(d.pos[1]); })
    .attr("r", 7)
    .attr("class", function(d, i) { return "nbody nbody-"+i; });       
};


Simulation.prototype.initializeShapePlot = function() {
  var xrange,
    yrange,
    x = this.xShape,
    y = this.yShape,
    yT = this.yShapeThermometer;
    
  var shape = this.integrator.system.shape;

  // creates the svg representation of the shape circle
  // want to contain a circle of radius 1
  yrange = 2.1;
  xrange = yrange * this.w / this.h;

  x.domain([-xrange/2, xrange/2]);
  y.domain([-yrange/2, yrange/2]);
  
  // plot background and the shape point
  d3.select("#shape-layer").append("circle")
    .attr("cx", x(0))
    .attr("cy", y(0))
    .attr("r", x(1) - x(0))
    .attr("class", "shape-circle");
    
  d3.select("#shape-layer").append("circle")
    .datum(shape)
    .attr("cx", function(d) { return x(d.x); })
    .attr("cy", function(d) { return y(d.y); })
    .attr("r", 6)
    .attr("class", "shape-point");
  
  // size temperature gauge and size point
  yT.domain([-0.05, 1.05]);
  d3.select("#shape-layer").append("line")
    .attr("x1", x(1.2))
    .attr("x2", x(1.2))
    .attr("y1", yT(0))
    .attr("y2", yT(1))
    .attr("class", "shape-size-gauge");
  
  d3.select("#shape-layer").append("circle")
    .datum(shape)
    .attr("cx", function(d) { return x(1.2); })
    .attr("cy", function(d) { return yT(d.r / (1 + d.r)); })
    .attr("r", 6)
    .attr("class", "shape-point-size");
};


Simulation.prototype.showShapeClues = function() {
  var xrange,
    yrange,
    x = this.xShape,
    y = this.yShape,
    angle,
    pairAngleSpread,
    rOuter,
    rInner,
    px,
    py,
    pr = 4;
  
  rOuter = 1.04;
  rInner = 0.05;
  pairAngleSpread = 1 * Math.PI / 180;
  
  // set up cues for double collision points
  // m0 - m1
  angle = 0 * Math.PI / 180;
  px = rOuter * Math.cos(angle + pairAngleSpread);
  py = rOuter * Math.sin(angle + pairAngleSpread);
  d3.select("#shape-layer").append("circle")
    .attr("cx", x(px))
    .attr("cy", y(py))
    .attr("r", pr)
    .attr("class", "shapeclue shapeclue-0");
    
  px = rOuter * Math.cos(angle - pairAngleSpread);
  py = rOuter * Math.sin(angle - pairAngleSpread);
  d3.select("#shape-layer").append("circle")
    .attr("cx", x(px))
    .attr("cy", y(py))
    .attr("r", pr)
    .attr("class", "shapeclue shapeclue-1");
    
  // m0 - m2
  angle = 120 * Math.PI / 180;
  px = rOuter * Math.cos(angle + pairAngleSpread);
  py = rOuter * Math.sin(angle + pairAngleSpread);
  d3.select("#shape-layer").append("circle")
    .attr("cx", x(px))
    .attr("cy", y(py))
    .attr("r", pr)
    .attr("class", "shapeclue shapeclue-0");
    
  px = rOuter * Math.cos(angle - pairAngleSpread);
  py = rOuter * Math.sin(angle - pairAngleSpread);
  d3.select("#shape-layer").append("circle")
    .attr("cx", x(px))
    .attr("cy", y(py))
    .attr("r", pr)
    .attr("class", "shapeclue shapeclue-2");  
  
  // m1 - m2
  angle = 240 * Math.PI / 180;
  px = rOuter * Math.cos(angle + pairAngleSpread);
  py = rOuter * Math.sin(angle + pairAngleSpread);
  d3.select("#shape-layer").append("circle")
    .attr("cx", x(px))
    .attr("cy", y(py))
    .attr("r", pr)
    .attr("class", "shapeclue shapeclue-1");
    
  px = rOuter * Math.cos(angle - pairAngleSpread);
  py = rOuter * Math.sin(angle - pairAngleSpread);
  d3.select("#shape-layer").append("circle")
    .attr("cx", x(px))
    .attr("cy", y(py))
    .attr("r", pr)
    .attr("class", "shapeclue shapeclue-2");
    
  // set up cues for equilateral configuration
  angle = 90 * Math.PI / 180;
  px = rInner * Math.cos(angle);
  py = rInner * Math.sin(angle);
  d3.select("#shape-layer").append("circle")
    .attr("cx", x(px))
    .attr("cy", y(py))
    .attr("r", pr)
    .attr("class", "shapeclue shapeclue-0");
    
  angle = 210 * Math.PI / 180;
  px = rInner * Math.cos(angle);
  py = rInner * Math.sin(angle);
  d3.select("#shape-layer").append("circle")
    .attr("cx", x(px))
    .attr("cy", y(py))
    .attr("r", pr)
    .attr("class", "shapeclue shapeclue-1");
  
  angle = 330 * Math.PI / 180;  
  px = rInner * Math.cos(angle);
  py = rInner * Math.sin(angle);
  d3.select("#shape-layer").append("circle")
    .attr("cx", x(px))
    .attr("cy", y(py))
    .attr("r", pr)
    .attr("class", "shapeclue shapeclue-2");
  
};



Simulation.prototype.initializeSvgLayers = function() {
  var spatialSvg = d3.select("#spatial-canvas").append("svg")
      .attr("width", this.w)
      .attr("height", this.h)
      .attr("id", "spatial-svg")
      .attr("overflow", "hidden");
  
  spatialSvg.append("g") // trail layer
      .attr("id", "bodies-trail-layer");
  
  spatialSvg.append("g") // bodies layer
      .attr("id", "bodies-layer");
  
  var shapeSvg = d3.select("#shape-canvas").append("svg")
      .attr("width", this.w)
      .attr("height", this.h)
      .attr("id", "shape-svg")
      .attr("overflow", "hidden");  
      
  shapeSvg.append("g") // shape point layer
      .attr("id", "shape-layer");
};


Simulation.prototype.transitionShapePoint = function(duration, shapeselection, svg) {
  var x = this.xShape,
    y = this.yShape,
    fadeTime = 4000;
  shapeselection
    .attr("cx", function(d) { return x(d.x); })
    .attr("cy", function(d) { return y(d.y); });
  if (this.leaveTrails) {
    svg.append("circle")
      .datum(this.system.shape) 
      .attr("cx", function(d) { return x(d.x); })
      .attr("cy", function(d) { return y(d.y); })
      .attr("r", 2)
      .attr("class", "shape-point-trail")
    .transition()
      .duration(fadeTime)
      .ease(Math.sqrt)
      .style("opacity", 0)
    .remove();  
  } 
};

Simulation.prototype.transitionShapePointSize = function(duration, shapeselection, svg) {
  shapeselection
    .attr("cy", function(d) { return this.yShapeThermometer(d.r / (1 + d.r)); }.bind(this)); 
};

Simulation.prototype.transitionBodies = function(duration, bodyselection, svg) {
  var x = this.xSpatial,
    y = this.ySpatial,
    fadeTime = 4000;
   // IC = typeof IC !== "undefined" ? IC : false;
    
  bodyselection
    .attr("cx", function(d) { return x(d.pos[0]); })
    .attr("cy", function(d) { return y(d.pos[1]); });
  if (this.leaveTrails) {
    svg.selectAll("g")
      .data(this.system.bodiesLast)
    .enter()
      .append("circle")
      .attr("cx", function(d) { return x(d.pos[0]); })
      .attr("cy", function(d) { return y(d.pos[1]); })
      .attr("r", 2)
      .attr("class", function(d, i) { return "nbody-trail-"+i; })
    .transition()
      .duration(fadeTime)
      .ease(Math.sqrt)
      .style("opacity", 0)
    .remove();  
  }
};

Simulation.prototype.refreshSpatialPlot = function() {
  var x = this.xSpatial,
    y = this.ySpatial,
    sel = d3.selectAll(".nbody, .nbody-trail");
    
  d3.selectAll(".nbody")
    .attr("cx", function(d) { return x(d.pos[0]); })
    .attr("cy", function(d) { return y(d.pos[1]); });
  d3.selectAll(".nbody-trail-0, .nbody-trail-1, .nbody-trail-2")
    .attr("cx", function(d) { return x(d.pos[0]); })
    .attr("cy", function(d) { return y(d.pos[1]); });
};

Simulation.prototype.transitionBodies2 = function(duration, bodyselection, svg) {
  var x = this.xSpatial,
    y = this.ySpatial,
    fadeTime = 4000;
    
  bodyselection.transition()
    .attr("cx", function(d) { return x(d.pos[0]); })
    .attr("cy", function(d) { return y(d.pos[1]); })
    .duration(duration);
  if (this.leaveTrails) {
    svg.selectAll("g")
      .data(this.system.bodiesLast)
    .enter()
      .append("circle")
      .attr("cx", function(d) { return x(d.pos[0]); })
      .attr("cy", function(d) { return y(d.pos[1]); })
      .attr("r", 2)
      .attr("class", function(d, i) { return "nbody-trail-"+i; })
    .transition()
      .duration(fadeTime)
      .ease(Math.sqrt)
      .style("opacity", 0)
    .remove();  
  }
};







