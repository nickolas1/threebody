/*jshint quotmark: double, unused: false  */
"use strict";
/*global Body*/


function System(N) {
  this.N = N;
  var masses = this.generateMasses(),
    pos = this.generatePositions(),
    vel = this.generateVelocities(pos);

  this.bodies = Array.apply(null, new Array(N)).map(Number.prototype.valueOf,0);
  this.bodiesLast = Array.apply(null, new Array(N)).map(Number.prototype.valueOf,0);
  
  this.timescale = 6.25;
  
  this.bodies.forEach(function (v, i, a) {
    a[i] = new Body(i, masses[i], pos[i], vel[i], [0, 0, 0]);
  });
  
  this.bodiesLast.forEach(function (v, i, a) {
    a[i] = new Body(i, 0, [0, 0, 0], [0, 0, 0], [0, 0, 0]);
  });  
  
  this.shape = [null, null, null]; // shape x, y ,r
  this.shape = {"r": null, "x": null, "y": null};
  this.calcTriangleSizeAndShape();
}


System.prototype.calcTriangleSizeAndShape = function() {
  var r210 = 0,
    r220 = 0,
    r221 = 0,
    dr,
    m0 = this.bodies[0].mass,
    m1 = this.bodies[1].mass,
    m2 = this.bodies[2].mass,
    k;
    
  for (k = 0; k < 3; k += 1) {
    dr = this.bodies[1].pos[k] - this.bodies[0].pos[k];
    r210 += dr * dr;
    
    dr = this.bodies[2].pos[k] - this.bodies[0].pos[k];
    r220 += dr * dr;
    
    dr = this.bodies[2].pos[k] - this.bodies[1].pos[k];
    r221 += dr * dr;
  }
  
 // this.shape[2] = Math.sqrt((m1*m0*r210 + m2*m0*r220 + m2*m1*r221) / (m0+m1+m2));
 // this.shape[0] = (r220 + r221 - 2*r210) / (r210 + r220 + r221);
 // this.shape[1] = 1.73205081 * (r221 - r220) / (r210 + r220 + r221);
  
  //this.shape = {
  //  "r": Math.sqrt((m1*m0*r210 + m2*m0*r220 + m2*m1*r221) / (m0+m1+m2)),
  //  "x": (r220 + r221 - 2*r210) / (r210 + r220 + r221),
  //  "y": 1.73205081 * (r221 - r220) / (r210 + r220 + r221)
  //};
  
  this.shape.r = Math.sqrt((m1*m0*r210 + m2*m0*r220 + m2*m1*r221) / (m0+m1+m2));
  this.shape.x = (r220 + r221 - 2*r210) / (r210 + r220 + r221);
  this.shape.y = 1.73205081 * (r221 - r220) / (r210 + r220 + r221);
  // 1.73205081 approx sqrt(3)
};


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
  positions[2] = [0, 0, 0];
  
  return positions;     
};       


System.prototype.generateVelocities = function(positions) {
  var velocities = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf,0);
  
  velocities[0] = [0, 0, 0];
  velocities[1] = [0, 0.8, 0];
  
  velocities[0] = [0.466203685, 0.43236573, 0];
  //velocities[0] = [0.266203685, 0.43236573, 0];
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
      dr = [0, 0, 0],
      mfaci,
      mfacj,
      bodiesi,
      bodiesj;
  
  // reset accels to 0
  for (i = 0; i < this.N; i += 1) {
    this.bodies[i].acc = [0, 0, 0];
  }   
  
  // add pairwise force to each body
  for (i = 0; i < this.N - 1; i += 1) {
    bodiesi = this.bodies[i];
    for (j = i + 1; j < this.N; j += 1) {    
    bodiesj = this.bodies[j];
      dr = [
          bodiesj.pos[0] - bodiesi.pos[0],
          bodiesj.pos[1] - bodiesi.pos[1],
          bodiesj.pos[2] - bodiesi.pos[2]
        ];
      r2 = dr[0]*dr[0] + dr[1]*dr[1] + dr[2]*dr[2];
      r3 = r2 * Math.sqrt(r2);

      mfaci = bodiesi.mass / r3;
      mfacj = bodiesi.mass / r3;
      bodiesi.acc[0] += dr[0] * mfacj;
      bodiesi.acc[1] += dr[1] * mfacj;
      bodiesi.acc[2] += dr[2] * mfacj;
      bodiesj.acc[0] -= dr[0] * mfaci;
      bodiesj.acc[1] -= dr[1] * mfaci;
      bodiesj.acc[2] -= dr[2] * mfaci;      
    }
  }
};

