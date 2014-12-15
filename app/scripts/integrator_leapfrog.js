/*jshint quotmark: double, unused: false*/
"use strict";


/** Creates an instance of IntegratorLeapfrog.
  The IntegratorLeapfrog advances (in time) a {@link System} 
  which holds a collection of {@link Body}s.

  @class
  @deprecated
  @param {System} system the system this integrator is in charge of integrating in time
*/
function IntegratorLeapfrog(system) {

  this.sps = 60; /* steps per second */
  this.redraw = 2;
  this.transitionTime = 250;
  
  this.system = system;
  
  this.N = this.system.N;
  var dt;
  
  Object.defineProperty(this, "dt", {
    get: function() {
      return dt;
    },
    set: function(dtNew) {
      dt = dtNew;
      this.dtHalf = dtNew * 0.5;
    },
    enumerable: true,
    configurable: true
  });
}

/** Kick the system
 @memberof IntegratorLeapfrog
 @instance 
 @param {Number} dt the time to kick through
*/ 
IntegratorLeapfrog.prototype.kick = function(dt) {
  var i, k;
  
  for (i = 0; i < this.N; i += 1) {
    for (k = 0; k < 3; k += 1) {
      this.system.bodies[i].vel[k] += this.system.bodies[i].acc[k] * dt;
    }
  }  
};

/** Drift the system
 @memberof IntegratorLeapfrog
 @instance 
 @param {Number} dt the time to drift through
*/ 
IntegratorLeapfrog.prototype.drift = function(dt) {
  var i, k;
  
  for (i = 0; i < this.N; i += 1) {
    for (k = 0; k < 3; k += 1) {
      this.system.bodies[i].pos[k] += this.system.bodies[i].vel[k] * dt;
    }
  }  
};

/** Kick-Drift-Kick integration step
 @memberof IntegratorLeapfrog
 @instance 
*/ 
IntegratorLeapfrog.prototype.integrationStep = function() {
  this.kick(this.dtHalf);
  this.drift(this.dt);
  this.system.calcAccels();
  this.kick(this.dtHalf);
};
