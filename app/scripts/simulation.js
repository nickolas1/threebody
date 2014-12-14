/*jshint quotmark: double, unused: false*/
"use strict";
/* global d3, 
  IntegratorIAS15
 */
 
/**
* Creates an instance of Simulation
* the Simulation is in charge of setting up the plots and controlling the integrator.
* the Simulation holds a {@link System} which holds a collection of {@link Body}s
*
* @constructor
* @param {System} system the system this simulation is displaying
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
  /** @member {IntegratorIAS15} integrator the integrator that advances the system */
  this.integrator = new IntegratorIAS15(this.system);
  // setup bodiesLast, then get system shape
  this.system.copyBodiesToBodiesLast();
  
  // set up timing
  /** @member {Number} secondsPerTimescale  how many seconds to animate through one timescale */
  this._secondsPerTimescale = 6;
  /** @member {Number} fps how many frames per second to animate. hardwired default 24 */
  this._fps = 24;
  this.calcDtAnimate();

  /** @member {Number} timeNextAnimate the next drawing time */
  this.timeNextAnimate = this.dtAnimate;
  this.integrator.maxDt = this.dtAnimate;
  
  /** @member {Boolean} leaveTrails draw body trails or not. hardwired default true */
  this._leaveTrails = true;
  this._numberTrailPoints = 75;
  this._shapePoints = [];
  this._bodyPoints0 = [];
  this._bodyPoints1 = [];
  this._bodyPoints2 = [];

  this.initialConditionSetupFunctions = {
    "figure 8": this.setFigureEight,
    "equilateral, equal masses": this.setEquilateralUnstable,
    "equilateral, star-planet-planet": this.setEquilateralStable,
    "Pythagorean": this.setPythagorean,
    "Brouke-H\u00E9non": this.setBroukeHenon,
    "Sun, Jupiter, Earth": this.setSunJupiterEarth,
    "Binary star, transferring planet": this.setTransferringPlanet,
    "Binary star, escaping planet": this.setEscapingPlanet,
    "Chen retrograde orbit": this.setChenRetrograde,
    "\u0160uvakov-Dmitra\u0161inovi\u0107 moth": this.setMoth
  };


  // svg stuff
 // this.integrateTimer = null;
  
  /** @member {Number} w width of the plots */
  this.w = parseInt(d3.select("#spatial-canvas").style("width"), 10);
  /** @member {Number} h height of the plots */
  this.h = this.w * 0.8;
  
  /** @member {Object} xSpatial d3 scale for space plot */
  this.xSpatial = d3.scale.linear()
          .range([0, this.w]);
  /** @member {Object} ySpatial d3 scale for space plot */
  this.ySpatial = d3.scale.linear()
          .range([this.h, 0]);
  /** @member {Object} xShape d3 scale for shape plot */
  this.xShape = d3.scale.linear()
          .range([0, this.w]);
  /** @member {Object} yShape d3 scale for shape plot */
  this.yShape = d3.scale.linear()
          .range([this.h, 0]);
  /** @member {Object} yShapeThermometer d3 scale for shape plot size thermometer */
  this.yShapeThermometer = d3.scale.linear()
          .range([this.h, 0]);
  
  this.lineFunctionSpace = d3.svg.line()
      .x(function(d) { return this.xSpatial(d[0]); }.bind(this))
      .y(function(d) { return this.ySpatial(d[1]); }.bind(this))
      .interpolate("linear");
  this.lineFunctionShape = d3.svg.line()
      .x(function(d) { return this.xShape(d[0]); }.bind(this))
      .y(function(d) { return this.yShape(d[1]); }.bind(this))
      .interpolate("linear");
  
  d3.select(window).on("resize", this.setPlotSizes);
  
}

Simulation.prototype.setSpeed = function(newSpeed) {
  this._secondsPerTimescale = newSpeed;
  this.calcDtAnimate();
};

Simulation.prototype.multiplySpeed = function(factor) {
  this.setSpeed(this._secondsPerTimescale * factor);
};

Simulation.prototype.calcDtAnimate = function() {
  this.dtAnimate = this.system.timescale / (this._secondsPerTimescale * this._fps);
};

Simulation.prototype.setPlotSizes = function() {
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
};


Simulation.prototype.initializeSpatialPlot = function() {
  var xrange,
    yrange,
    x = this.xSpatial,
    y = this.ySpatial;

    
  var bodies = this.system.bodiesPlot;

  // create the svg representation of the bodies
  xrange = 15;
  yrange = xrange * this.h / this.w;

  x.domain([-xrange/2, xrange/2]);
  y.domain([-yrange/2, yrange/2]);

  this._bodyPath0 = d3.select("#bodies-layer").append("path")
    .data([this._bodyPoints0])
    .attr("class", "line line-body-0")
    .attr("d", this.lineFunctionSpace);    
  this._bodyPath1 = d3.select("#bodies-layer").append("path")
    .data([this._bodyPoints1])
    .attr("class", "line line-body-1")
    .attr("d", this.lineFunctionSpace);  
  this._bodyPath2 = d3.select("#bodies-layer").append("path")
    .data([this._bodyPoints2])
    .attr("class", "line line-body-2")
    .attr("d", this.lineFunctionSpace); 

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

  x.domain([-5*xrange/12, 7*xrange/12]);
  y.domain([-yrange/2, yrange/2]);
  
  // plot background and the shape point
  d3.select("#shape-layer").append("circle")
    .attr("cx", x(0))
    .attr("cy", y(0))
    .attr("r", x(1) - x(0))
    .attr("class", "shape-circle");
    
  this._shapePath = d3.select("#shape-layer").append("path")
    .data([this._shapePoints])
    .attr("class", "line line-shape")
    .attr("d", this.lineFunctionShape);

  d3.select("#shape-layer").append("circle")
    .datum(shape)
    .attr("cx", function(d) { return x(d.x); })
    .attr("cy", function(d) { return y(d.y); })
    .attr("r", 6)
    .attr("class", "shape-point");
  
  // size temperature gauge and size point
  yT.domain([-0.05, 1.05]);
  d3.select("#shape-layer").append("line")
    .attr("x1", x(1.25))
    .attr("x2", x(1.25))
    .attr("y1", yT(0))
    .attr("y2", yT(1))
    .attr("class", "shape-size-gauge");
  
  d3.select("#shape-layer").append("circle")
    .datum(shape)
    .attr("cx", function(d) { return x(1.25); })
    .attr("cy", function(d) { return yT(d.r / (1 + d.r)); })
    .attr("r", 6)
    .attr("class", "shape-point-size");
};


Simulation.prototype.showShapeClues = function() {
  var xrange,
    yrange,
    x = this.xShape,
    y = this.yShape,
    yT = this.yShapeThermometer,
    angle,
    pairAngleSpread,
    rOuter,
    rInner,
    px,
    py,
    pr = 3,
    i,
    cluePairs = [[0, 1], [0, 2], [1, 2]];
  
  rOuter = 1.04;
  rInner = 0.05;
  pairAngleSpread = 1 * Math.PI / 180;
  
  for (i = 0; i < 3; i += 1) {
    // set up cues for double collision points
    angle = (0 + 120*i) * Math.PI / 180;
    px = rOuter * Math.cos(angle + pairAngleSpread);
    py = rOuter * Math.sin(angle + pairAngleSpread);
    d3.select("#shape-layer").append("circle")
      .attr("cx", x(px))
      .attr("cy", y(py))
      .attr("r", pr)
      .attr("class", "shapeclue shapeclue-"+cluePairs[i][0]);
      
    px = rOuter * Math.cos(angle - pairAngleSpread);
    py = rOuter * Math.sin(angle - pairAngleSpread);
    d3.select("#shape-layer").append("circle")
      .attr("cx", x(px))
      .attr("cy", y(py))
      .attr("r", pr)
      .attr("class", "shapeclue shapeclue-" + cluePairs[i][1]);
    
    // set up cues for equilateral configuration  
    angle = (90 + 120*i) * Math.PI / 180;
    px = rInner * Math.cos(angle);
    py = rInner * Math.sin(angle);
    d3.select("#shape-layer").append("circle")
      .attr("cx", x(px))
      .attr("cy", y(py))
      .attr("r", pr)
      .attr("class", "shapeclue shapeclue-" + i);
  }
 
  // label zero and infinity for size guage  
  d3.select("#shape-layer").append("text")
    .attr("x", x(1.25))
    .attr("y", yT(1.0))
    .attr("text-anchor", "middle")
    .attr("class", "shape-size-clue")
    .text("\u221E");
  d3.select("#shape-layer").append("text")
    .attr("x", x(1.25))
    .attr("y", yT(-0.05))
    .attr("text-anchor", "middle")
    .attr("class", "shape-size-clue")
    .text("\u25cb");
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


Simulation.prototype.clearPathArrays = function(duration, shapeselection, svg) {
  var i,
    npts = this._shapePoints.length;
    
  for (i = 0; i < npts; i += 1){
    this._shapePoints.shift();
    this._bodyPoints0.shift();
    this._bodyPoints1.shift();
    this._bodyPoints2.shift();
  }
};



Simulation.prototype.transitionShapePoint = function(duration, shapeselection, svg) {
  var x = this.xShape,
    y = this.yShape,
    lineFunction = this.lineFunctionShape;

  shapeselection
    .attr("cx", function(d) { return x(d.x); })
    .attr("cy", function(d) { return y(d.y); });
  if (this._leaveTrails) {
    this._shapePath
      .attr("d", function(d) { return lineFunction(d); });
    
    this._shapePoints.push([this.system.shape.x, this.system.shape.y]);
    if(this._shapePoints.length > this._numberTrailPoints) {
      this._shapePoints.shift();
    }
  } 
};


Simulation.prototype.transitionShapePointSize = function(duration, shapeselection, svg) {
  shapeselection
    .attr("cy", function(d) { return this.yShapeThermometer(d.r / (1 + d.r)); }.bind(this)); 
};

Simulation.prototype.transitionBodies = function(duration, bodyselection, svg) {
  var x = this.xSpatial,
    y = this.ySpatial,
    lineFunction = this.lineFunctionSpace,
    bodies = this.system.bodies;

  bodyselection
    .attr("cx", function(d) { return x(d.pos[0]); })
    .attr("cy", function(d) { return y(d.pos[1]); });
  if (this._leaveTrails) {
    this._bodyPath0
      .attr("d", function(d) { return lineFunction(d); });
    this._bodyPath1
      .attr("d", function(d) { return lineFunction(d); });
    this._bodyPath2
      .attr("d", function(d) { return lineFunction(d); });
      
    this._bodyPoints0.push([bodies[0].pos[0], bodies[0].pos[1]]);
    this._bodyPoints1.push([bodies[1].pos[0], bodies[1].pos[1]]);
    this._bodyPoints2.push([bodies[2].pos[0], bodies[2].pos[1]]);
    if(this._bodyPoints0.length > this._numberTrailPoints) {
      this._bodyPoints0.shift();
      this._bodyPoints1.shift();
      this._bodyPoints2.shift();
    }
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








