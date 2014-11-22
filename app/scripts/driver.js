/*jshint quotmark: double, unused: false*/
"use strict";
/*global Simulation */

$(function() {
    
  var stepMonitor;
  var system = new System(3);
  // log it to keep an eye on things in the console
  console.log(system);
  
  // set up the system here- presets, user defined, whatever
  
  var simulation = new Simulation(system);
  
  simulation.initializeSvgLayers();
  simulation.initializeSpatialPlot();
  simulation.initializeShapePlot();
  simulation.showShapeClues();
  
 /* // get things centered
  system.moveToCenterOfMomentum();
  
  // grab initial energy
  system.calcTotalEnergy();
  var initialEnergy = system.totalEnergy;
  
  // get an integrator and inject the system
  var integrator = new IntegratorIAS15(system);
  console.log(integrator);
  
  
  // set up timing
  var timescale = system.timescale;
  var tfinal = 100 * timescale;
  var secondsPerTimescale = 3;
  var fps = 20;
  var dtAnimate = timescale / (secondsPerTimescale * fps);
  var timeNextAnimate = dtAnimate;
  integrator.maxDt = dtAnimate;
  
*/
  var timelast = Date.now();
  var timenow;
  var timelast2 = Date.now();
  var timenow2;
  var deltaT;
  
  var bodySelection = d3.selectAll(".nbody");
  var shapeSelection = d3.selectAll(".shape-point");
  var shapeSizeSelection = d3.selectAll(".shape-point-size");
  console.log(bodySelection);
  function integrateToNextFrame() {
  //  timenow = Date.now()
    simulation.transitionBodies(10, bodySelection);
    simulation.transitionShapePoint(10, shapeSelection);
    simulation.transitionShapePointSize(10, shapeSizeSelection);
    system.calcTriangleSizeAndShape();
    
  //  deltaT = timenow - timelast;
  //  if (deltaT > 20) console.log(deltaT);
  //  timelast = timenow;
  //  console.log(simulation.system.bodies[0].pos);
    do {
      stepMonitor = simulation.integrator.integrationStep();
    } while (simulation.integrator.time < simulation.timeNextAnimate);

    simulation.timeNextAnimate += simulation.dtAnimate;
  }

 // var integrateTimer = setInterval(integrateToNextFrame, 1000/simulation.fps);
 

  
  /*
  var i = 0;
  do {
    stepMonitor = integrator.integrationStep();
    if (integrator.time > timeNextAnimate) {
      console.log(integrator.time, timeNextAnimate, integrator.dt);
      timeNextAnimate += dtAnimate;
    }
  } while (integrator.time < tfinal)
  */
  simulation.system.calcTotalEnergy();
  console.log("energy ",stepMonitor, simulation.system.totalEnergy,(simulation.initialEnergy - simulation.system.totalEnergy)/simulation.initialEnergy);
  console.log("\n");
});
