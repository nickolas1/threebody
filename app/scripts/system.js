/*jshint quotmark: double, unused: false  */
"use strict";
/*global Body*/


function System(N) {
  this.N = N;
  var masses = this.generateMasses(),
    pos = this.generatePositions(),
    vel = this.generateVelocities(pos);

  this.bodies = Array.apply(null, new Array(N)).map(Number.prototype.valueOf,0);
  
  this.bodies.forEach(function (v, i, a) {
    a[i] = new Body(i, masses[i], pos[i], vel[i], [0, 0, 0]);
  });  
}


System.prototype.generateMasses = function() {
  var masses = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf,0);

  masses[0] = 1;
  masses[1] = 0.1;     
 
  masses[0] = 1;
  masses[1] = 1;
  masses[2] = 1;
 
  return masses;     
};

System.prototype.generatePositions = function() {
  // plummer sphere!
  var positions = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf,0);  
  
  positions[0] = [0, 0, 0];
  positions[1] = [1, 0, 0];
  
  positions[0] = [0.97000436, -0.24308753, 0];
  positions[1] = [-0.97000436, 0.24308753, 0];
  positions[2] = [0, 0, 0]
  
  return positions;     
};       

System.prototype.generateVelocities = function(positions) {
  var velocities = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf,0);
  
  velocities[0] = [0, 0, 0];
  velocities[1] = [0, 0.8, 0];
  
  velocities[0] = [0.466203685, 0.43236573, 0];
  velocities[1] = [0.466203685, 0.43236573, 0];
  velocities[2] = [-0.93240737, -0.86473146, 0];
    
  return velocities;
};

System.prototype.calcCenterOfMomentum = function() {
  var cmPos = [0, 0, 0],
    cmVel = [0, 0, 0],
    totalMass = 0,
    k;
  
  this.bodies.forEach(function (v) {
    totalMass += v.mass;
  });
  
  this.bodies.forEach(function (v) {
    for(k = 0; k < 3; k += 1){
      cmPos[k] += v.mass * v.pos[k] / totalMass;
      cmVel[k] += v.mass * v.vel[k] / totalMass;
    }
  });
  
  this.centerOfMomentumPosition = cmPos;
  this.centerOfMomentumVelocity = cmVel;   
};

System.prototype.calcKineticEnergy = function() {
  var ke = 0.0,
    v2,
    k;
  
  this.bodies.forEach(function (v) {    
    v2 = 0.0;
    for(k = 0; k < 3; k += 1){
      v2 = v2 + v.vel[k] * v.vel[k];
    }
    ke += 0.5 * v.mass * v2;
  });
  
  this.kineticEnergy = ke;
};

System.prototype.moveToCenterOfMomentum = function() {
  var k;

  this.calcCenterOfMomentum();
  this.calcKineticEnergy();
  this.calcPotentialEnergy();

  // move to the center of mass
  this.bodies.forEach(function (v, i, a) {
    for (k = 0; k < 3; k += 1) {
      a[i].pos[k] -= this.centerOfMomentumPosition[k];
      a[i].vel[k] -= this.centerOfMomentumVelocity[k];
    }
  }, this);  
};


System.prototype.calcPotentialEnergy = function() {
    var dr = [0, 0, 0],
        r2,
        pot = 0,
        posi,
        mi,
        posj,
        mj,
        i, j, k;
    
    for (i = 0; i < this.N - 1; i += 1) {
        for (j = i + 1; j < this.N; j += 1) {
            //get the potential contribution from each pair
            r2 = 0;
            for(k = 0; k < 3; k += 1){
                dr[k] = this.bodies[j].pos[k] - this.bodies[i].pos[k];
                r2 += dr[k] * dr[k];
            }
            pot -= this.bodies[i].mass * this.bodies[j].mass / Math.sqrt(r2);  
        }
    }
    this.potentialEnergy = pot;
};

System.prototype.calcTotalEnergy = function() {
    this.calcKineticEnergy();
    this.calcPotentialEnergy();
    this.totalEnergy = this.kineticEnergy + this.potentialEnergy;
};

System.prototype.calcAccels = function() {
    var i, j, k,
        r2,
        r3,
        a,
        dr = [0, 0, 0];
    
    // reset accels to 0
    for (i = 0; i < this.N; i += 1) {
      this.bodies[i].acc = [0, 0, 0];
    }     
    
    // add pairwise force to each body
    for (i = 0; i < this.N - 1; i += 1) {
        for (j = i + 1; j < this.N; j += 1) {
            r2 = 0;
            for(k = 0; k < 3; k += 1){
                dr[k] = this.bodies[j].pos[k] - this.bodies[i].pos[k];
                r2 += dr[k] * dr[k];
            }
            r3 = r2 * Math.sqrt(r2);
    
            for(k = 0; k < 3; k += 1){
                a = dr[k] / r3;
                this.bodies[i].acc[k] += a * this.bodies[j].mass;
                this.bodies[j].acc[k] -= a * this.bodies[i].mass;          
            }             
        }
    }
};

