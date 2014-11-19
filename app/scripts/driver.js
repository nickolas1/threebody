/*jshint quotmark: double, unused: false*/
"use strict";
/*global Simulation */

$(function() {
    
  var stepMonitor;
  var system = new System(3);
  // log it to keep an eye on things in the console
  console.log(system);
  
  // set up the system here- presets, user defined, whatever
  
  // get things centered
  system.moveToCenterOfMomentum();
  // grab initial energy
  system.calcTotalEnergy();
  var initialEnergy = system.totalEnergy;
  
  // inject the system into the integrator
  var integrator = new IntegratorIAS15(system);
  
  console.log("energy: ",initialEnergy);
  console.log(integrator);
  
  var i = 0;
  for (i = 0; i < 1000000; i += 1) {
    stepMonitor = integrator.integrationStep();
    console.log(i, integrator.time);
    if (integrator.time > 7) {
      console.log(i);
      break;
    }
    if (i % 10000 === 0) {
      system.calcTotalEnergy();
      console.log(i, integrator.time, system.totalEnergy,(initialEnergy - system.totalEnergy)/initialEnergy);
    }
  }
  system.calcTotalEnergy();
  console.log("energy ",stepMonitor, system.totalEnergy,(initialEnergy - system.totalEnergy)/initialEnergy);
  console.log("\n");
});
