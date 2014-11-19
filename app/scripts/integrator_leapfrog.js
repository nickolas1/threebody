/*jshint quotmark: double, unused: false*/
"use strict";


/**
takes as input a system object
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


IntegratorLeapfrog.prototype.kick = function(dt) {
  var i, k;
  
  for (i = 0; i < this.N; i += 1) {
    for (k = 0; k < 3; k += 1) {
      this.system.bodies[i].vel[k] += this.system.bodies[i].acc[k] * dt;
    }
  }  
};

IntegratorLeapfrog.prototype.drift = function(dt) {
  var i, k;
  
  for (i = 0; i < this.N; i += 1) {
    for (k = 0; k < 3; k += 1) {
      this.system.bodies[i].pos[k] += this.system.bodies[i].vel[k] * dt;
    }
  }  
};


IntegratorLeapfrog.prototype.integrationStep = function() {
  this.kick(this.dtHalf);
  this.drift(this.dt);
  this.system.calcAccels();
  this.kick(this.dtHalf);
};
