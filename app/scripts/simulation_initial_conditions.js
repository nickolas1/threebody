/*jshint quotmark: double, unused: false*/
"use strict";
/* global d3,
  Simulation
 */
 
/**
* Driver method to activate the chosen initial condition presets
*/ 
Simulation.prototype.choosePresetInitialConditions = function(choice) {
  this.setupFunction = this.initialConditionSetupFunctions[choice];
  this.setupFunction();
  this.activatePresetInitialConditions();
};

/**
* Sets up the figure 8 periodic solution.
* See e.g. {@link http://homepages.math.uic.edu/~jan/mcs320s07/Project_Two/sol_body.html}
*/ 
Simulation.prototype.setFigureEight = function() {
  var bodies = this.system.bodies;
  
  bodies[0].mass = 1;
  bodies[0].pos = [0.97000436, -0.24308753, 0];
  bodies[0].vel = [0.466203685, 0.43236573, 0];
  
  bodies[1].mass = 1;
  bodies[1].pos = [-0.97000436, 0.24308753, 0];
  bodies[1].vel = [0.466203685, 0.43236573, 0];

  bodies[2].mass = 1;
  bodies[2].pos = [0, 0, 0];
  bodies[2].vel = [-0.93240737, -0.86473146, 0];
  
  this.setSpatialPlotDomain(3);
  this.setSpeed(6);
};


/**
* Sets up the Brouke Henon periodic solution
*/ 
Simulation.prototype.setBroukeHenon = function() {
  var bodies = this.system.bodies;
  
  bodies[0].mass = 1/3;
  bodies[0].pos = [-0.685916, 0, 0];
  bodies[0].vel = [0, 1.32912, 0];
  
  bodies[1].mass = 1/3;
  bodies[1].pos = [1.53206, 0, 0];
  bodies[1].vel = [0, 0.132451, 0];

  bodies[2].mass = 1/3;
  bodies[2].pos = [-0.846147, 0, 0];
  bodies[2].vel = [0, -1.46157, 0];
  
  this.setSpatialPlotDomain(4);
  this.setSpeed(14);
};

/**
* Sets up an equilateral triangle solution with a dominant mass
*/
Simulation.prototype.setEquilateralStable = function() {
  var bodies = this.system.bodies,
    scale;
  
  bodies[0].mass = 50;
  bodies[1].mass = 1;
  bodies[2].mass = 0.1;
  
  // set bodies up at equilateral triangle
  bodies[0].pos = [Math.cos(0), Math.sin(0), 0];
  bodies[1].pos = [Math.cos(2 * Math.PI / 3), Math.sin(2 * Math.PI / 3), 0];
  bodies[2].pos = [Math.cos(-2 * Math.PI / 3), Math.sin(-2 * Math.PI / 3), 0];
  
  // move to center of mass (don't worry about velocity translation, it will be undone */
  this.system.moveToCenterOfMomentum();
  scale = 3;
  bodies[0].vel = [-scale * bodies[0].pos[1], scale * bodies[0].pos[0], 0];
  bodies[1].vel = [-scale * bodies[1].pos[1], scale * bodies[1].pos[0], 0];
  bodies[2].vel = [-scale * bodies[2].pos[1], scale * bodies[2].pos[0], 0];
  
  this.setSpatialPlotDomain(5);
  this.setSpeed(6);
};

/**
* Sets up an equilateral triangle solution with equal masses; unstable
*/
Simulation.prototype.setEquilateralUnstable = function() {
  var bodies = this.system.bodies,
    angle,
    scale;
  
  bodies[0].mass = 1;
  bodies[1].mass = 1;
  bodies[2].mass = 1;
  
  // set bodies up at equilateral triangle
  bodies[0].pos = [Math.cos(0), Math.sin(0), 0];
  bodies[1].pos = [Math.cos(2 * Math.PI / 3), Math.sin(2 * Math.PI / 3), 0];
  bodies[2].pos = [Math.cos(-2 * Math.PI / 3), Math.sin(-2 * Math.PI / 3), 0];
  
  // move to center of mass (don't worry about velocity translation, it will be undone */
  this.system.moveToCenterOfMomentum();
  
  scale = 0.5;
  bodies[0].vel = [-scale * bodies[0].pos[1], scale * bodies[0].pos[0], 0];
  bodies[1].vel = [-scale * bodies[1].pos[1], scale * bodies[1].pos[0], 0];
  bodies[2].vel = [-scale * bodies[2].pos[1], scale * bodies[2].pos[0], 0];
  
  this.setSpatialPlotDomain(5);
  this.setSpeed(4);
};

/**
* Sets up the historic Pythagorean problem
* See e.g. {@link http://www.ucolick.org/~laugh/oxide/projects/burrau.html}
*/
Simulation.prototype.setPythagorean = function() {
  var bodies = this.system.bodies,
    angle,
    scale;
  
  bodies[0].mass = 3;
  bodies[1].mass = 4;
  bodies[2].mass = 5;
  
  // set bodies up at pythagorean triangle
  bodies[0].pos = [1, 3, 0];
  bodies[1].pos = [-2, -1, 0];
  bodies[2].pos = [1, -1, 0];
  
  bodies[0].vel = [0, 0, 0];
  bodies[1].vel = [0, 0, 0];
  bodies[2].vel = [0, 0, 0];

  this.setSpatialPlotDomain(15);
  this.setSpeed(7.5);
};

/**
* Sets up a stylized Sun-Jupiter-Earth system
*/
Simulation.prototype.setSunJupiterEarth = function() {
  var bodies = this.system.bodies,
    angle,
    scale;
  
  bodies[0].mass = 1;
  bodies[1].mass = 0.001;
  bodies[2].mass = 3.0e-6;
  
  bodies[0].pos = [0, 0, 0];
  bodies[1].pos = [0, 5.2, 0];
  bodies[2].pos = [1, 0, 0];
  
  bodies[0].vel = [0, 0, 0];
  bodies[1].vel = [-0.4385, 0, 0];
  bodies[2].vel = [0, 1, 0];

  this.setSpatialPlotDomain(15);
  this.setSpeed(40);
};

/**
* Sets up an equal mass circular binary with a planet that chaotically bounces
* between the two stars
*/
Simulation.prototype.setTransferringPlanet = function() {
  var bodies = this.system.bodies,
    angle,
    scale;
  
  bodies[0].mass = 1;
  bodies[1].mass = 1;
  bodies[2].mass = 1.0e-3;
  
  bodies[0].pos = [-0.5, 0, 0];
  bodies[1].pos = [0.5, 0, 0];
  bodies[2].pos = [0.2, 0, 0];
  
  bodies[0].vel = [0, 0.707, 0];
  bodies[1].vel = [0, -0.707, 0];
  bodies[2].vel = [0.7, 0.8, 0];

  this.setSpatialPlotDomain(3);
  this.setSpeed(6);
};


/**
* Sets up Chen's retrograde orbit
*/
Simulation.prototype.setChenRetrograde = function() {
  var bodies = this.system.bodies,
    angle,
    scale;
  
  bodies[0].mass = 2;
  bodies[1].mass = 0.01;
  bodies[2].mass = 1;
  
  bodies[0].pos = [0.2209, 0, 0];
  bodies[1].pos = [0.7934, 0, 0];
  bodies[2].pos = [-0.4498, 0, 0];
  
  bodies[0].vel = [0, 0.7127, 0];
  bodies[1].vel = [0, -1.0786, 0];
  bodies[2].vel = [0, -1.4146, 0];

  this.setSpatialPlotDomain(2);
  this.setSpeed(10);
};

/**
* Sets up Suvakov and Dmitrasinovic moth
*/
Simulation.prototype.setMoth = function() {
  var bodies = this.system.bodies,
    angle,
    scale;
  
  bodies[0].mass = 1;
  bodies[1].mass = 1;
  bodies[2].mass = 1;
  
  bodies[0].pos = [-1, 0, 0];
  bodies[1].pos = [1, 0, 0];
  bodies[2].pos = [0, 0, 0];
  
  bodies[0].vel = [0.46444, 0.39606, 0];
  bodies[1].vel = [0.46444, 0.39606, 0];
  bodies[2].vel = [-2*0.46444, -2*0.39606, 0];

  this.setSpatialPlotDomain(4);
  this.setSpeed(8);
};


/**
* Sets up an equal mass circular binary with a planet that eventually escapes
*/
Simulation.prototype.setEscapingPlanet = function() {
  var bodies = this.system.bodies,
    angle,
    scale;
  
  bodies[0].mass = 1;
  bodies[1].mass = 1;
  bodies[2].mass = 1.0e-3;
  
  bodies[0].pos = [-0.5, 0, 0];
  bodies[1].pos = [0.5, 0, 0];
  bodies[2].pos = [-0.1, 0, 0];
  
  bodies[0].vel = [0, 0.707, 0];
  bodies[1].vel = [0, -0.707, 0];
  bodies[2].vel = [1.25, 0.5, 0];

  this.setSpatialPlotDomain(18);
  this.setSpeed(1.2);
};

/**
* Driver method to update the initial condition form and set the bodies
*/
Simulation.prototype.activatePresetInitialConditions = function() {
  this.populateInitialConditionsForm();
  this.resetInitialConditions();
};

/**
* Driver method to set the bodies and reset various timers, energies, etc.
*/
Simulation.prototype.resetInitialConditions = function() {
  this.integrator.clearIntegrator();
  this.timeNextAnimate = 0;
  this.applyInitialConditionsForm();
  this.system.calcTotalEnergy();
  this.system.initialEnergy = this.system.totalEnergy;
  this.system.calcTimescale(); 
  this.calcDtAnimate();
};


/**
* Set the initial conditions in the custom initial conditions form in the DOM
*/
Simulation.prototype.populateInitialConditionsForm = function() {
  var bodies = this.system.bodies,
    i,
    k;
    
  for (i = 0; i < this.system.N; i += 1) {
    $("#ic-b"+i+"m").val(bodies[i].mass);
    for (k = 0; k < 3; k += 1) {
      $("#ic-b"+i+"p"+k).val(bodies[i].pos[k]);
      $("#ic-b"+i+"v"+k).val(bodies[i].vel[k]);
    }
  }
};

/**
* Take values from the initial condition form and apply them to the bodies
* after verification of numerical values
*/
Simulation.prototype.applyInitialConditionsForm= function() {  
  var bodies = this.system.bodies,
    bodiesPlot = this.system.bodiesPlot,
    bodySelection = d3.selectAll(".nbody"),
    shapeSelection = d3.selectAll(".shape-point"),
    shapeSizeSelection = d3.selectAll(".shape-point-size"),
    bodySvg = d3.select("#bodies-trail-layer"),
    shapeSvg = d3.select("#shape-layer"),
    inputOK,
    i,
    k;

  inputOK = this.verifyInput();
  
  if (inputOK) {
    for (i = 0; i < this.system.N; i += 1) {
      bodies[i].mass = +$("#ic-b"+i+"m").val();
      for (k = 0; k < 3; k += 1) {
        bodies[i].pos[k] = +$("#ic-b"+i+"p"+k).val();
        bodies[i].vel[k] = +$("#ic-b"+i+"v"+k).val();
        bodiesPlot[i].pos[k] = +$("#ic-b"+i+"p"+k).val();
      }
    }
   
    this.system.moveToCenterOfMomentum();
    this.system.calcAccels();
    
    this.system.calcTriangleSizeAndShape();
    this.clearPathArrays();
    this.transitionBodies(10, bodySelection, bodySvg);
    this.transitionShapePoint(10, shapeSelection, shapeSvg);
    this.transitionShapePointSize(10, shapeSizeSelection);
  }
};

/**
* Driver method to check that the initial conditions form holds numbers
*
* @returns {Boolean} true if input is ok; false if there's at least one bad input
*/
Simulation.prototype.verifyInput = function() {
  var i,
    k,
    field,
    badField,
    badInput = true;
    
  for (i = 0; i < this.system.N; i += 1) {
    badField = this.verifyField($("#ic-b"+i+"m"));
    if (!badField) {
      badInput = false;
    }
    
    for (k = 0; k < 3; k += 1) {
      badField = this.verifyField($("#ic-b"+i+"p"+k));
      if (!badField) {
        badInput = false;
      }
      badField = this.verifyField($("#ic-b"+i+"v"+k));
      if (!badField) {
        badInput = false;
      }
    }
  }
  
  return badInput;
};

/**
* Verify that an input field holds a number
*/
Simulation.prototype.verifyField = function(field) {
  if (!($.isNumeric(+field.val()))) {
    field.val("enter a number here!");
    return false;
  }
  else {
    return true;
  }
};
