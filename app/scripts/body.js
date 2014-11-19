/*jshint quotmark: double, unused: false  */
"use strict";

function Body(id, mass, pos, vel, acc) {
  this.id = id;
  this.mass = mass;
  this.pos = pos;
  this.vel = vel;
  this.acc = acc; //will be set to correct value at integration time
}


