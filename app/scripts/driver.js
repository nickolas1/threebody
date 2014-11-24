/*jshint quotmark: double, unused: false*/
"use strict";
/*global d3,
  Simulation */

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
  
  var bodySelection = d3.selectAll(".nbody");
  var shapeSelection = d3.selectAll(".shape-point");
  var shapeSizeSelection = d3.selectAll(".shape-point-size");
  var bodySvg = d3.select("#bodies-trail-layer");
  var shapeSvg = d3.select("#shape-layer");
  
  
  simulation.populateInitialConditionsForm();
  
  function integrateToNextFrame() {
    system.estimateDrawingTime(simulation.integrator.time, 
      simulation.integrator.time - simulation.integrator.lastSuccessfulDt, 
      simulation.timeNextAnimate);
    simulation.transitionBodies(10, bodySelection, bodySvg);
    simulation.transitionShapePoint(10, shapeSelection, shapeSvg);
    simulation.transitionShapePointSize(10, shapeSizeSelection);
    system.calcTriangleSizeAndShape();

    simulation.timeNextAnimate += simulation.dtAnimate;
    do {
      stepMonitor = simulation.integrator.integrationStep();
    } while (simulation.integrator.time < simulation.timeNextAnimate);
  }

  var playControlPlay = $("#play-control-play");
  var playControlPause = $("#play-control-pause");
  var playControlReset = $("#play-control-reset");
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
  });
  
  playControlReset.click( function() {
    if (playControlPlay.hasClass("play-control-active")) {
      playControlPlay.removeClass("play-control-active");
      playControlPause.addClass("play-control-active");
      clearInterval(integrateTimer);
    }
    simulation.resetInitialConditions();
  });

  
 // var integrateTimer = setInterval(integrateToNextFrame, 1000/simulation.fps);
});
