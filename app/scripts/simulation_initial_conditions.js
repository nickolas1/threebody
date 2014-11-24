/*jshint quotmark: double, unused: false*/
"use strict";
/* global d3,
  Simulation
 */
 
Simulation.prototype.choosePresetInitialConditions = function(choice) {
  if (choice === "figure 8") {
    this.setFigureEight();
  }
  else if (choice === "equilateral") {
    this.setEquilateral();
  }
  
};

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
  
  this.activateInitialConditions();
};

Simulation.prototype.setEquilateral = function() {
  var bodies = this.system.bodies;
  
  bodies[0].mass = 1;
  bodies[0].pos = [-1, -2, 0];
  bodies[0].vel = [0.466203685, 0.43236573, 0];
  
  bodies[1].mass = 1;
  bodies[1].pos = [-1, 1, 0];
  bodies[1].vel = [0.466203685, 0.43236573, 0];

  bodies[2].mass = 1;
  bodies[2].pos = [0, 0, 0];
  bodies[2].vel = [-0.93240737, -0.86473146, 0];
  
  this.activateInitialConditions();
};


Simulation.prototype.activateInitialConditions = function() {
  this.populateInitialConditionsForm();
  this.resetInitialConditions();
};

Simulation.prototype.resetInitialConditions = function() {
  this.integrator.clearIntegrator();
  this.timeNextAnimate = 0;
  this.applyInitialConditionsForm();
};



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

Simulation.prototype.applyInitialConditionsForm= function() {  
  var bodies = this.system.bodies,
    bodySelection = d3.selectAll(".nbody"),
    shapeSelection = d3.selectAll(".shape-point"),
    shapeSizeSelection = d3.selectAll(".shape-point-size"),
    bodySvg = d3.select("#bodies-trail-layer"),
    shapeSvg = d3.select("#shape-layer"),
    i,
    k;

  for (i = 0; i < this.system.N; i += 1) {
    bodies[i].mass = +$("#ic-b"+i+"m").val();
    for (k = 0; k < 3; k += 1) {
      bodies[i].pos[k] = +$("#ic-b"+i+"p"+k).val();
      bodies[i].vel[k] = +$("#ic-b"+i+"v"+k).val();
      bodies[i].pos[k] = +$("#ic-b"+i+"p"+k).val();
      bodies[i].vel[k] = +$("#ic-b"+i+"v"+k).val();
    }
  }
  
  this.system.moveToCenterOfMomentum();
  this.system.calcAccels();
  
  this.integrator.copyBodiesToBodiesLast();
  this.system.calcTriangleSizeAndShape();
 
  this.transitionBodies(10, bodySelection, bodySvg);
  this.transitionShapePoint(10, shapeSelection, shapeSvg);
  this.transitionShapePointSize(10, shapeSizeSelection);
};