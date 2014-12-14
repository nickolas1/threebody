/*jshint quotmark: double, unused: false  */
"use strict";

/**
* Creates an instance of Body.
* This is the atomic unit of the three body simulation.
*
* @namespace
* @constructor
* @param {Number} id The body's ID tag
* @param {Number} mass The body's mass
* @param {Number[]} pos Array of position values
* @param {Number[]} vel Array of velocity values
* @param {Number[]} acc Array of accelerations
*/

function Body(id, mass, pos, vel, acc) {
  /** The body's ID tag 
  @memberof Body 
  @member {Number} id */
  this.id = id;
  /** The body's mass 
  @memberof Body 
  @member {Number} mass */
  this.mass = mass;
  /** Array of position values 
  @memberof Body 
  @member {Number[]} pos */
  this.pos = pos;
  /** Array of velocity values
  @memberof Body 
  @member {Number[]} vel */
  this.vel = vel;
  /** Array of accelerations
  @memberof Body 
  @member {Number[]} acc  */
  this.acc = acc; //will be set to correct value at integration time
}


