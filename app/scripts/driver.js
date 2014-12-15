/*jshint quotmark: double, unused: false*/
"use strict";
/*global d3,
  Simulation */

$(function() {   
  var stepMonitor;
  var system = new System(3);
  // log it to keep an eye on things in the console
 /* console.log(system);*/
  
  // set up the system here- presets, user defined, whatever
  
  
  var simulation = new Simulation(system);
  
  simulation.initializeSvgLayers();
  simulation.initializeSpatialPlot();
  simulation.initializeShapePlot();
  simulation.showShapeClues();
  simulation.choosePresetInitialConditions("figure 8");
  
  var bodySelection = d3.selectAll(".nbody");
  var shapeSelection = d3.selectAll(".shape-point");
  var shapeSizeSelection = d3.selectAll(".shape-point-size");
  /* bodySvg = d3.select("#bodies-trail-layer");
  var shapeSvg = d3.select("#shape-layer");*/
  
  
  simulation.populateInitialConditionsForm();
  
  system.calcAngularMomentum();
  var L0 = system.angularMomentum.slice(0);
  
  function integrateToNextFrame() {
    system.estimateDrawingTime(simulation.integrator.time, 
      simulation.integrator.time - simulation.integrator.lastSuccessfulDt, 
      simulation.timeNextAnimate);
    simulation.transitionBodies(bodySelection);
    simulation.transitionShapePoint(shapeSelection);
    simulation.transitionShapePointSize(shapeSizeSelection);
    system.calcTriangleSizeAndShape();

    simulation.timeNextAnimate += simulation.dtAnimate;
    while (simulation.integrator.time < simulation.timeNextAnimate) {
      stepMonitor = simulation.integrator.integrationStep();
    }
  /*  console.log(simulation.integrator.time, simulation.timeNextAnimate, simulation.dtAnimate);
    console.log(system.bodies[0].pos,system.bodiesLast[0].pos);*/
    /*do {
      stepMonitor = simulation.integrator.integrationStep();
    } while (simulation.integrator.time < simulation.timeNextAnimate);*/
   /* system.calcTotalEnergy();
    console.log("energy ",(system.totalEnergy - system.initialEnergy) / system.initialEnergy);*/
    system.calcAngularMomentum();
    //console.log(system.angularMomentum,L0[0]-system.angularMomentum[0],L0[1]-system.angularMomentum[1],L0[2]-system.angularMomentum[2]);
  }

  var playControlPlay = $("#play-control-play");
  var playControlPause = $("#play-control-pause");
  var playControlReset = $("#play-control-reset");
  var zoomControlIn = $("#zoom-control-in");
  var zoomControlOut = $("#zoom-control-out");
  var speedControlSlow = $("#speed-control-slow");
  var speedControlFast = $("#speed-control-fast");
  var integrateTimer = null;
  
  // initial condition buttons
  $("#ic-apply-button").click( function() {simulation.applyInitialConditionsForm();} );
  $("#preset-ic-selector").change( function() {
    simulation.choosePresetInitialConditions(this.value);
  });
  
  
  // time control buttons
  playControlPlay.click( function() {
    if (!playControlPlay.hasClass("play-control-active")) {
      playControlPause.removeClass("play-control-active");
      playControlPlay.addClass("play-control-active");
      integrateTimer = setInterval(integrateToNextFrame, 1000/simulation.fps);
    }
  });
  
  playControlPause.click( function() {
    if (!playControlPause.hasClass("play-control-active")) {
      playControlPlay.removeClass("play-control-active");
      playControlPause.addClass("play-control-active");
      clearInterval(integrateTimer);
    }
    /*console.log(system.bodies);
    console.log(system.bodiesLast);*/
  });
  
  playControlReset.click( function() {
    if (playControlPlay.hasClass("play-control-active")) {
      playControlPlay.removeClass("play-control-active");
      playControlPause.addClass("play-control-active");
      clearInterval(integrateTimer);
    }
    simulation.resetInitialConditions();
    /*system.calcAngularMomentum();
    L0 = system.angularMomentum.slice(0);
    console.log(L0);*/
  });
  
  // zoom control buttons
  zoomControlIn.click( function() {
    simulation.setSpatialPlotDomain(simulation.spatialPlotRange / 1.8);
  });
  
  zoomControlOut.click( function() {
    simulation.setSpatialPlotDomain(simulation.spatialPlotRange * 1.8);
  });
  
    // speed control buttons
  speedControlSlow.click( function() {
    simulation.multiplySpeed(1.8);
  });
  
  speedControlFast.click( function() {
    simulation.multiplySpeed(1 / 1.8);
  });

  
 // var integrateTimer = setInterval(integrateToNextFrame, 1000/simulation.fps);
});
